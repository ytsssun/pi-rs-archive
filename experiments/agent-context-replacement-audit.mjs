// Diagnostic only: models the state assignment used by upstream manual compact().
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Agent} from '../vendor/pi-mono/packages/agent/src/agent.ts';
import {RustAgentAdapter} from './agent-shaped-adapter.mjs';
const model={id:'fixture',provider:'fixture',api:'fixture',input:['text'],contextWindow:10000,maxTokens:100};
const empty=process.argv.includes("--empty");
async function run(native){
 const contexts=[];
 const streamFn=async(_,context)=>{
  contexts.push(structuredClone(context.messages));
  const message={role:'assistant',content:[{type:'text',text:'ok'}],stopReason:'stop',timestamp:1};
  return {async *[Symbol.asyncIterator](){yield {type:'done',message};},async result(){return message;}};
 };
 const options={initialState:{model},streamFn};
 const agent=native?new RustAgentAdapter({...options,cwd:process.cwd(),scratchPath:join(mkdtempSync(join(tmpdir(),'pi-context-audit-')),'scratch.jsonl')}):new Agent(options);
 try{
  await agent.prompt({role:'user',content:[{type:'text',text:'old context'}],timestamp:1});
  agent.state.messages=empty?[]:[{role:'user',content:[{type:'text',text:'replacement summary'}],timestamp:2}];
  await agent.prompt({role:'user',content:[{type:'text',text:'continue'}],timestamp:3});
  return contexts[1].flatMap(m=>m.content.filter(c=>c.type==='text').map(c=>c.text));
 }finally{agent.store?.close();}
}
const upstream=await run(false),rust=await run(true);
assert.deepEqual(upstream,empty?['continue']:['replacement summary','continue']);
console.log(JSON.stringify({upstream,rust,compatible:JSON.stringify(upstream)===JSON.stringify(rust),scope:'Direct Agent state replacement diagnostic; not execution of full Session.compact()'}));
if(JSON.stringify(upstream)!==JSON.stringify(rust))process.exitCode=1;
