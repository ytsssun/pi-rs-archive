# Architecture decision: Rust-first Pi compatibility

## Decision

We will remove upstream **implementations** over time, but preserve the ecosystem's observable **contracts**. The maintained product should converge on one Rust runtime and one thin Node/TypeScript host, rather than carrying a second full copy of Pi's runtime and a permanently vendored upstream implementation.

This is feasible because Pi extensions interact with named JavaScript contracts: extension lifecycle callbacks, tools, provider registration, model/message types, session events, and commands. They do not require the internal implementation to remain TypeScript. It is not feasible to promise compatibility while deleting those contracts or changing their timing, serialization, error, and capability behavior.

## Target shape

```text
pi-rs CLI (Rust)
  ├─ Rust runtime: scheduling, state, sessions, context, transport, built-in tools
  └─ Node compatibility host
       ├─ loads .ts extensions and package resources
       ├─ exposes Pi-compatible Agent/Session/provider/tool APIs
       └─ executes extension callbacks and other JS effects
```

The host is an adapter, not a second agent implementation. Rust is the policy owner; Node is the ecosystem boundary. A Rust-only binary can be added later for users who do not need JavaScript extensions, but it is not the compatibility product.

## What can be deleted

After contract tests exist, the following upstream implementations can be removed from the runtime distribution:

- `packages/agent` loop, queues, session state and context projection.
- `packages/ai` HTTP/SSE codecs, retries, usage accounting and provider dispatch, behind compatible model/provider types.
- `coding-agent` built-in tool implementations, once Rust tools reproduce argument/result/permission semantics.
- Upstream session backend implementation, once Rust persistence passes migration and recovery tests.
- Upstream TUI implementation only if a compatible Rust UI is deliberately built; this is optional and not part of core replacement.

## What must remain compatible

The compatibility host must continue to provide:

- TypeScript extension loading and package/resource discovery.
- `pi.on` lifecycle events and callback ordering.
- `registerTool`, tool validation, tool results and cancellation signals.
- `registerProvider`, model lookup, credentials and provider-specific options.
- Agent state shape, prompt/continue/steer/follow-up, abort and event streams.
- Session entries, custom messages, branches/compaction and resume behavior.
- CLI commands and the file/image attachment representation extensions observe.

These can be implemented by Rust and exposed through Node-API. “Keep” means keep the contract, not keep vendored source forever.

## Migration rule

Each upstream implementation is removable only after:

1. the public contract is captured in deterministic tests;
2. an independent compatibility case exercises a real extension or provider path;
3. Rust owns the policy rather than JavaScript choosing between divergent histories;
4. new-process session recovery and failure behavior are covered;
5. the upstream source is no longer required at runtime for that capability.

Until then, the pinned upstream checkout remains a reference and fallback. The current experimental adapter is evidence toward this target, not completion of it.
