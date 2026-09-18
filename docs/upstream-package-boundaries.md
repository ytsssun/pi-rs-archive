# Upstream Pi package boundaries

> Distribution direction: the recommended end state is a Pi fork with the same package boundaries and a Rust-backed `agent` package. See [the fork strategy](fork-strategy.md).

Reference: vendored Pi commit `9767ba275f3e9a5ee0f5c5342249b629ab1b2282` (MIT, Pi 0.85.1). The goal is ecosystem compatibility with maximum Rust ownership. “Keep upstream” means preserve the observable package/API contract first; it does not mean the implementation can never move to Rust.

## Classification

| Package | Upstream role | pi-rs policy | Why |
|---|---|---|---|
| `agent` (`@earendil-works/pi-agent-core`) | Generic Agent state machine, events, queues, tool calls, attachments | **Primary Rust replacement target; keep a JS-compatible facade** | This is the core runtime we want to replace. Extensions and `coding-agent` consume its public Agent shape. Rust should own scheduling, state transitions, context projection, cancellation/recovery, and persistence. Node should adapt model/tool effects. |
| `coding-agent` (`@earendil-works/pi-coding-agent`) | User-facing Pi CLI/TUI integration, sessions, extension loader, built-in tools, commands, settings | **Keep upstream initially; gradually remove only duplicated policy** | This is where the community ecosystem hooks in. Replacing it wholesale would break extensions, packages, settings, CLI behavior and TUI. Its AgentSession should become a thin host around the Rust-compatible Agent contract. |
| `ai` (`@earendil-works/pi-ai`) | Model/provider types, streaming contracts, auth/model discovery and provider adapters | **Keep API/types; reimplement transports selectively** | Extensions and providers depend on these TypeScript contracts. Rust can eventually own HTTP/SSE, retries, usage and wire codecs behind a compatible Node facade, but provider-specific auth/discovery behavior must remain compatible. |
| `tui` (`@earendil-works/pi-tui`) | Terminal rendering and interactive widgets | **Keep upstream** | UI is not core runtime. A Rust TUI is possible later, but only behind equivalent CLI/event behavior; it is not needed for core replacement. |
| `session-backends` | Pluggable durable session storage | **Keep interface; Rust may provide backend** | Session persistence is a high-value Rust ownership area, but the backend contract and migration behavior must remain compatible with Pi sessions. |
| `protocol` | Framed CBOR remote-session protocol | **Keep wire contract; Rust implementation is desirable** | This is an interoperability boundary for future remote agents. Rewriting implementation is safe once byte-level compatibility fixtures exist. |
| `client` | Client for remote Pi sessions | **Keep API initially; Rust client later** | Depends on `protocol` and remote lifecycle semantics; not required for local core replacement. |
| `server` | Experimental remote Pi server | **Defer; Rust implementation later** | Future multiplayer/remote execution surface, not a blocker for local Agent parity. |
| `chord` | Service composition, replicated state, RPC and plugins | **Defer** | Separate application runtime, not required by the coding-agent core. |
| `telemetry` | Vendor-neutral telemetry contracts and schemas | **Keep schema; Rust exporter later** | Observability must remain opt-in and compatible; it is not runtime policy. |
| `evals` | Evaluation harnesses and task scoring | **Keep as validation tooling; add Rust scenarios** | Useful for parity measurement, but not part of the runtime shipped to users. |

## What “replacement” means

The intended product is not a second incompatible coding agent. It is the upstream `coding-agent` experience with its `agent` implementation replaced:

```text
Pi coding-agent CLI / TUI / extensions / tools / settings
                         |
             compatible Agent + Session facade
                         |
                Rust runtime and store
                         |
       Node effects: provider, tools, callbacks, extensions
```

The first compatibility target is the public `Agent` behavior used by `coding-agent`: constructor/state shape, `prompt`, `continue`, `steer`, `followUp`, queue clearing, events, streaming messages, tool calls, errors, abort and context replacement. Passing a finite subset does not establish complete package compatibility.

## Candidates for eventual Rust ownership

1. Agent state machine and turn scheduling.
2. Durable session store, branch/context projection and compaction records.
3. Provider HTTP/SSE transport, bounded streaming queues, retries and usage accounting, behind the `pi-ai` contract.
4. Built-in coding tools, if their Node-visible argument/result and permission semantics remain identical.
5. Protocol/client/server implementations after wire-level fixtures are frozen.

## Must remain ecosystem-facing

The following contracts should remain callable from TypeScript extensions even if their implementation moves to Rust: extension loading and lifecycle hooks, provider registration and model resolution, tool registration/validation, custom messages, session events, command APIs, `pi-ai` model/provider types, and the CLI/TUI surface.

The current experimental adapter does not yet satisfy all of these. Open gaps are tracked in `docs/checkpoint.md` and `docs/core-parity-matrix.md`; do not infer full compatibility from the package classification.
