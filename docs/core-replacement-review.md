# Core replacement review — 2026-09-17

## Conclusion

Current pi-rs is a separate headless CLI using selected unchanged Pi components and a Rust runtime. It is **not** an unchanged upstream Pi CLI with its core swapped out. No successful drop-in core integration has been demonstrated. The desired product remains a Rust core under the Pi ecosystem; a second complete CLI implementation is not necessary to that goal.

Current path:

```text
pi-rs Rust launcher -> our bin/pi-native.mjs -> our host/driver
                                             -> Rust PiRuntime + session store
                                             -> original Pi tools/loader/callbacks
                                             -> partly original, partly custom providers
```

Target integration experiment:

```text
upstream Pi UI/CLI -> upstream AgentSession -> Agent-compatible adapter
                                           -> Rust execution policy
                                           -> original Node tools/providers
```

The custom provider request conversion and CLI/session owner have duplicated upstream responsibilities. Recent missing tool guidance, missing model binding and dropped assistant text are concrete costs of this approach. Rust runtime work is reusable, but those adapters are not proof of ecosystem compatibility.

## Executed check and source evidence

Pinned Pi: 9767ba275f3e9a5ee0f5c5342249b629ab1b2282.

Run `node --experimental-strip-types experiments/core-injection-probe.mjs`.

The current native module exports only `drive`. Direct injection into the real upstream AgentSession constructor fails at `this.agent.subscribe is not a function`. This deliberately minimal negative test proves the existing module does not satisfy that interface; it does not prove an adapter is impossible or enumerate every missing method. No live model or TUI is exercised.

- `packages/coding-agent/src/core/sdk.ts` constructs `new Agent(...)` and later `new AgentSession(...)`. CreateAgentSessionOptions has no agent-factory option.
- `packages/coding-agent/src/main.ts` MainOptions exposes extension factories, not an agent factory. The CLI creates its own session runtime factory internally.
- `packages/coding-agent/src/core/agent-session.ts` accepts an Agent via its constructor and immediately subscribes. This is the narrower SDK seam to test first.
- `agent-session-runtime.ts` has a whole-session runtime factory. Replacing a whole Session requires a larger surface than replacing Agent beneath it.

## Setup review

CI and deterministic comparisons catch real regressions, but many tests exercise our custom path rather than the intended replacement seam. Helper tests previously overstated formal integration. Repeated direct-main evidence commits also created integration conflicts; one behavioral change bypassed the PR gate and had to be corrected. Architecture documentation retained contradictory historical claims. These are coordination failures, not user decisions or capacity blockers.

## Next frozen milestone

Build an experimental Agent-shaped adapter beneath unchanged upstream AgentSession in an isolated worktree. Retain upstream provider/tool implementations and upstream session ownership for this experiment; avoid double persistence. Rust must demonstrably choose model/tool/continuation actions, not delegate its loop back to upstream Agent.

Acceptance: real upstream AgentSession executes one deterministic tool-edit turn, delivers normal message/tool/lifecycle events, queues one follow-up, settles, and can reopen its session in a new process. External assertions protect the edited result. Instrument the Rust boundary so a hidden upstream Agent loop cannot pass. First inventory required Agent methods/state/setters/hooks, then implement only this vertical slice. Report streaming, cancellation and unsupported methods explicitly. No TUI or unchanged CLI success claim until the original entry point actually runs with the adapter.

After this SDK seam succeeds, choose a minimal, explicit CLI integration hook or package adapter. Do not patch vendored source silently, claim all plugins work, or replace more of AgentSession before evidence requires it.
