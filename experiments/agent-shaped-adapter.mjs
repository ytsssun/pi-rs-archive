// Experimental SDK seam, never an upstream Agent loop. Rust disk state is scratch only.
import {validateToolArguments} from '../vendor/pi-mono/packages/ai/src/utils/validation.ts';
import {createBackendSync,request} from '../prototype/architecture/native-store-backend.mjs';
import {sessionEntryToContextMessages} from '../vendor/pi-mono/packages/coding-agent/src/core/session-manager.ts';
export class RustAgentAdapter {
  static async create({scratchPath,cwd,model,streamFunction,initialMessages=[]}) {
    return new RustAgentAdapter({scratchPath,cwd,initialState:{model,messages:initialMessages},streamFn:streamFunction});
  }
  constructor(options) {
    this.store=createBackendSync({path:options.scratchPath,cwd:options.cwd});
    this.state={systemPrompt:'',tools:[],messages:[],thinkingLevel:'off',isStreaming:false,streamMessage:null,pendingToolCalls:new Set(),error:undefined,...options.initialState};
    this.state.messages=structuredClone(this.state.messages);
    this.streamFunction=options.streamFn;
    this.convertToLlm=options.convertToLlm??(messages=>messages.filter(m=>['user','assistant','toolResult'].includes(m.role)));
    for(const key of ['transformContext','getApiKey','onPayload','onResponse','sessionId','transport','thinkingBudgets','maxRetryDelayMs','beforeToolCall','afterToolCall','prepareNextTurn','prepareNextTurnWithContext'])this[key]=options[key];
    this.steeringMode=options.steeringMode??'one-at-a-time';this.followUpMode=options.followUpMode??'one-at-a-time';
  }
  listeners=new Set();trace=[];controller=new AbortController();seen=0;
  steeringMode='one-at-a-time';followUpMode='one-at-a-time';
  get signal(){return this.controller.signal;}
  subscribe(listener){this.listeners.add(listener);return ()=>this.listeners.delete(listener);}
  async emit(event){for(const listener of this.listeners)await listener(event);}
  step(payload){const action=request({op:'runtime',handle:this.store.handle,timestamp:new Date().toISOString(),messageTimestamp:Date.now(),...payload});this.trace.push({input:payload.event,output:action?.type??null,requestId:action?.requestId});return action;}
  async syncMessages(){const all=this.store.getBranch().flatMap(sessionEntryToContextMessages);for(const message of all.slice(this.seen)){this.state.messages.push(message);if(!(message.role==='assistant'&&this.startedAssistant))await this.emit({type:'message_start',message});if(message.role==='assistant')this.startedAssistant=false;await this.emit({type:'message_end',message});}this.seen=all.length;}
  hasQueuedMessages(){return this.store.pendingUsers().length>0;}
  followUp(message){this.enqueue(message,'followUp');}
  steer(message){this.enqueue(message,'steer');}
  enqueue(message,deliverAs){if(message.role!=='user'||!Array.isArray(message.content)||message.content.some(c=>c.type!=='text'))throw Error('Experimental adapter supports text users only');this.store.enqueueUser({kind:'user',message,options:{deliverAs}});}
  waitForIdle(){return this.running??Promise.resolve();}
  abort(){this.controller.abort();}
  continue(){this.running=this.run(undefined,true);return this.running;}
  clearSteeringQueue(){this.step({event:'clear_users',queue:'steer'});}
  clearFollowUpQueue(){this.step({event:'clear_users',queue:'followUp'});}
  clearAllQueues(){this.step({event:'clear_users',queue:'all'});}
  prompt(messages){this.running=this.run(messages);return this.running;}
  async run(messages,queuedContinuation=false){
    if(this.state.isStreaming)throw Error('Already running');
    const inputs=Array.isArray(messages)?messages:[messages];
    const imageParts=inputs[0]?.content?.filter(c=>c.type==='image')??[];
    if(!queuedContinuation&&(inputs.length===0||inputs[0].role!=='user'||inputs[0].content.some(c=>!['text','image'].includes(c.type))||inputs.slice(1).some(m=>m.role!=='custom')||inputs[0].content.some(c=>c.type==='image')&&!inputs[0].content.some(c=>c.type==='text')))throw Error('Unsupported: expected text user followed by custom messages');
    if(this.seen===0){for(const message of this.state.messages)this.store.appendMessage(message);this.seen=this.state.messages.length;}
    this.controller=new AbortController();this.state.errorMessage=undefined;
    this.state.isStreaming=true;
    this.store.setQueueModes({steeringMode:this.steeringMode,followUpMode:this.followUpMode});
    try{
      let action=queuedContinuation?this.step({event:'continue_context',messages:this.state.messages}).action:this.step({event:'begin',prompt:inputs[0].content,nextTurnMessages:inputs.slice(1).map(({customType,content,display,details})=>({customType,content,display,details})),driveStart:true,maxActions:32,lifecycle:true});
      while(true){
        if(action.type==='lifecycle'){
          if(action.event.type!=='agent_start'&&action.event.type!=='turn_start')await this.syncMessages();
          if(action.event.type==='turn_end'&&action.event.message?.errorMessage)this.state.errorMessage=action.event.message.errorMessage;
          await this.emit(action.event);action=this.step({event:'lifecycle_ack',requestId:action.requestId});continue;
        }
        await this.syncMessages();
        if(action.type==='settled')break;
        if(action.type==='done'){
          const next=this.step({event:'advance_queued'});
          if(next.type==='ending'||next.type==='admitted'){action=next.action;continue;}break;
        }
        if(action.type==='model'){
          const messageCount=this.state.messages.length;
          try{
          const runtimeMessages=action.contextEntries.flatMap(sessionEntryToContextMessages);
          // Rust explicitly owns adoption of upstream compaction/branch context views.
          let contextMessages=runtimeMessages;
          if(JSON.stringify(this.state.messages)!==JSON.stringify(contextMessages)){
            contextMessages=this.step({event:'adopt_context',requestId:action.requestId,messages:this.state.messages}).messages;
          }
          const context={systemPrompt:this.state.systemPrompt,messages:contextMessages,tools:this.state.tools};
          const refreshed=await (this.prepareNextTurnWithContext?this.prepareNextTurnWithContext({context,turnIndex:0},this.signal):this.prepareNextTurn?.(this.signal));
          // Reject unsupported compaction instead of silently diverging from Rust history.
          if(JSON.stringify(refreshed?.context?.messages??context.messages)!==JSON.stringify(context.messages))throw Error('Unsupported: context history replacement');
          const nextContext=refreshed?.context??context, model=refreshed?.model??this.state.model;
          const transformed=this.transformContext?await this.transformContext(structuredClone(nextContext.messages),this.signal):nextContext.messages;
          const llmContext={...nextContext,messages:await this.convertToLlm(transformed)};
          const thinking=refreshed?.thinkingLevel??this.state.thinkingLevel;
          const output=await this.streamFunction(model,llmContext,{signal:this.signal,apiKey:await this.getApiKey?.(model.provider),reasoning:thinking==='off'?undefined:thinking,sessionId:this.sessionId,transport:this.transport,thinkingBudgets:this.thinkingBudgets,maxRetryDelayMs:this.maxRetryDelayMs,onPayload:this.onPayload,onResponse:this.onResponse});
          let partial=false;
          for await(const event of output){
            if(event.type==='start'){
              partial=true;this.startedAssistant=true;
              this.state.streamingMessage=event.partial;this.state.streamMessage=event.partial;this.state.messages.push(event.partial);
              await this.emit({type:'message_start',message:{...event.partial}});
            }else if(partial&&['text_start','text_delta','text_end','thinking_start','thinking_delta','thinking_end','toolcall_start','toolcall_delta','toolcall_end'].includes(event.type)){
              this.state.streamingMessage=event.partial;this.state.streamMessage=event.partial;this.state.messages[this.state.messages.length-1]=event.partial;
              await this.emit({type:'message_update',assistantMessageEvent:event,message:{...event.partial}});
            }
          }
          // Partial state is transient. Rust admits/persists the final message once.
          if(partial)this.state.messages.pop();
          this.state.streamingMessage=undefined;this.state.streamMessage=null;
          action=this.step({event:'model_result',requestId:action.requestId,message:await output.result()});
          }catch(error){
            this.state.messages.length=messageCount;this.startedAssistant=false;
            this.state.streamingMessage=undefined;this.state.streamMessage=null;
            action=this.step({event:'provider_failure',requestId:action.requestId,model:this.state.model,error:error instanceof Error?error.message:String(error),cancelled:this.signal.aborted});
          }
          continue;
        }
        if(action.type==='tool'){
          let toolCall=action.call,args=toolCall.arguments;let result,isError=false;
          await this.emit({type:'tool_execution_start',toolCallId:toolCall.id,toolName:toolCall.name,args});
          try{
            if(toolCall.skipError)throw Error(toolCall.skipError);
            const tool=this.state.tools.find(t=>t.name===toolCall.name);if(!tool)throw Error('Unknown tool');
            toolCall={...toolCall,arguments:tool.prepareArguments?.(args)??args};args=validateToolArguments(tool,toolCall);
            const before=await this.beforeToolCall?.({toolCall,args},this.signal);if(before?.block)throw Error(before.reason??'Blocked');
            result=await tool.execute(toolCall.id,args,this.signal,update=>this.emit({type:'tool_execution_update',toolCallId:toolCall.id,toolName:toolCall.name,args,partialResult:update}));
            const after=await this.afterToolCall?.({toolCall,args,result,isError},this.signal);if(after)result={...result,...after};
          }catch(error){isError=true;result={content:[{type:'text',text:String(error)}]};}
          await this.emit({type:'tool_execution_end',toolCallId:toolCall.id,toolName:toolCall.name,result,isError});
          action=this.step({event:'tool_result',requestId:action.requestId,result,isError});continue;
        }
        throw Error(`Unsupported Rust action ${action.type}`);
      }
    }finally{this.state.isStreaming=false;}
  }
}
