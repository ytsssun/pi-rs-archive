# Current checkpoint

## Product direction

The preferred distribution strategy is now a Pi fork: preserve upstream package names and `coding-agent` entry points, replace `packages/agent` behind its public contract with Rust, and gradually replace other implementations behind compatibility tests. The current loader-based experimental path is migration scaffolding, not the desired released architecture. See [fork strategy](fork-strategy.md).

## Active review gate

Latest candidate scopes adopt_context to a pending model request with exact request ID, returns the Rust-admitted view for actual provider use, and removes the stale persistent override. Rust invalid/stale/idle admission and unchanged history tests pass; nonempty/empty Agent replacement and retry fixtures pass. Full Session.compact/resume remains required before PR72 integration.

PR72 (`058efca`) is not ready to merge despite green CI. Its JavaScript context selection passes the direct nonempty and empty state-replacement diagnostics, but does not implement the frozen Rust-owned context adoption contract. Full Session.compact, restored compaction and history invariants remain untested. The previous message calling this fixed was too broad. Preserve the candidate for comparison; replace its policy selection with a Rust admission/projection operation before integration. PR71 merge `fde5058` CI35307243243 succeeded.

## Current verified status

The installed CLI is still the custom pi-rs path. The experimental Agent adapter runs unchanged upstream CLI/AgentSession with Rust scheduling and original providers/tools; it is not a complete replacement or the installed default.

Earlier mini live evidence at clean commit `1416178`, pinned upstream `9767ba2`, `gpt-5.4-mini`, context editing off, zero steering: original Pi completed **1/3** full workflows; Rust core completed **0/3**. All six initial bug fixes passed. Every failed resumed stage implemented correct arithmetic, ran tests and exited 0, but modified protected `test_maths.py`; strict external acceptance failed. No guard or task change was introduced. Both initial HTTP requests match after temporary workspace normalization. Small samples do not establish causality, equivalence or speed gains. [Evidence](experiments/live-parity-1416178/README.md).

Deterministic fixtures pass original CLI new/resume, streaming event order, Session error/abort/wait/queued continuation and scoped automatic retry. PR63 merged as d8b77a2; PR64 merged as 1416178 and merge CI passed. Scratch journals remain per-process and disposable; upstream SessionManager remains canonical. The attempted persistent scratch reopen was reverted in PR64 before merge.

Latest fixed-model cohort at clean `ac0823c`: `gpt-5.4-2026-03-05` passed one upstream and one Rust smoke; Rust then passed **3/3 clean workflows, 6/6 stages**, zero steering, context editing off, 44,465 tokens. Same prompts/protected-file acceptance as mini. See [evidence](experiments/live-gpt54-20260917/README.md). This supports bounded trial, not full parity/reliability. Evidence commit fd716e7 has successful CI35282052618. It was pushed directly to main contrary to the coordinator PR gate; subsequent work returns to review branches.

## Critical path and frozen next experiment

The previous plan to change tasks was based on an incorrect claim: the existing task never requested protected-test modification. That plan is superseded. Keep its failure visible and do not add file-write guards to turn instruction-following failures into apparent passes.

Resume request audit passes for all 63 saved requests across both engines: unchanged system/developer instruction and tools within each run, exact two-user ordering, complete tool-call/result pairing, and restored previous-request prefix plus final assistant/new user. Normalized wire options/tool schemas match across all six runs. This rules out those specific missing-context/contract errors, not all runtime differences. Reproduce with `python3 experiments/audit-live-resume.py /tmp/pi-upstream-parity-1416178 /tmp/pi-rust-parity-1416178 --output NEW_JSON`.

Current branch implements queue clearing in Rust and exposes all/steering/follow-up Agent methods. Original Session.clearQueue comparison passes with active queued messages, abort/wait and later reuse; pending messages are returned to the caller and never executed. Rust selector/invalid-input tests pass. Full Rust tests/clippy passed before the additional selector test, which also passes. Await exact-head CI.

Experimental installed entry now exists as `pi-rs --experimental-upstream-core`: it invokes the unchanged upstream CLI with the Rust Agent adapter, allocates fresh private temporary scratch per process, and hides loader/scratch environment details. `cargo install --locked --path . --bin pi-rs --root /tmp/pi-rs-installed-probe --debug` followed by the installed binary HTTP fixture passes locally; installed local HTTP new/resume passes; installed live smoke ran both stages but failed protected-test integrity on resume. The default command is unchanged. This is source-checkout-only and experimental, not a stable distribution or full replacement.

Installed entry acceptance is complete for wiring: isolated cargo install, two-process HTTP fixture with native action traces, and live smoke. Live stage0 passed; resumed stage1 ran successfully but modified protected tests, so strict workflow acceptance failed. No blanket model-vs-runtime causal claim. PR68 merged as 3d76379 after CI35294237069/35294234359 passed. Launcher argument fix: only a leading selector is consumed; matching prompt/option values are preserved.

Unchanged vendored todo.ts now passes an installed-entry comparison against original Pi. The first process adds a todo; the second process reconstructs state through session_start and toggles the same item. External assertions verify persisted details, nextId, event sequence and native model/tool actions. Commands: `node --experimental-strip-types experiments/upstream-cli-provider-probe.mjs --todo --upstream` and `--todo --binary /tmp/pi-rs-installed-probe/bin/pi-rs` after cargo install. This is fixture evidence for one extension, not ecosystem-wide compatibility; /todos TUI, branching and session_tree are untested.

Custom message-array admission now passes installed-entry upstream comparison using a synthetic test extension. Session_start queues nextTurn custom input, before_agent_start returns another custom input; Rust admits user then custom messages, preserving content/display/details and canonical custom_message entries over two processes. Initial native run failed at single-text-only input; adapter now delegates custom validation/admission to existing Rust begin. Todo extension and Session retry regressions pass. PR69 merged as 24b5c53 after exact-head CI.

Image attachment wire/resume comparison now passes original Pi and installed Rust-core entry at base `11f19d1` plus harness changes. A valid one-pixel PNG enters through original `@file` handling; all four HTTP requests preserve its data URL, canonical history retains exactly one image, and a second process restores it without reattaching. Commands: `node --experimental-strip-types experiments/upstream-cli-provider-probe.mjs --image --upstream` and `--image --binary /tmp/pi-rs-installed-probe/bin/pi-rs`. Deterministic fixture only; visual reasoning remains unverified. The earlier adapter fixture used base64 for “hello”, not a valid PNG, and checked memory rather than disk persistence; that claim is superseded by this stronger test.

PR71 merged as `fde5058` after exact-head runs 35304972689 and 35304970775 succeeded. Merge CI remains to be checked. Next blocking finding: `node --experimental-strip-types experiments/agent-context-replacement-audit.mjs` exits 1: original Agent sends replacement summary plus new user; Rust sends old user/assistant plus new user. Upstream manual compact assigns `agent.state.messages` in agent-session.ts; this diagnostic exercises that assignment, not full compaction. Frozen fix acceptance: explicit Rust-owned context adoption, no canonical history rewriting, correct subsequent model context, original Session compact/new-process resume coverage, and retry/queue regressions. Preserve the failing diagnostic until fixed. Image-only prompts remain unsupported. Do not treat this attachment test as full multimodal parity.

## Limits and recovery

No personal daily-use readiness claim. No complete plugin compatibility, general context replacement, tool cancellation or production integration mode. Queue clear now has scoped tests; transcript continuation only accepts queues or validated last-error retry. Retry projection is process-local to the scratch runtime.

Read AGENTS.md and coordinator.md, inspect branch/CI before integration. Latest evidence branch is `codex/live-parity-audit`. Reproduce live harness with `python3 experiments/integrated-live.py --engine rust-core --env-file .env --output NEW_DIRECTORY --model gpt-5.4-mini --repetitions 3`; this documents the command, not an instruction to repeat unchanged failures. Raw artifacts remain under `/tmp/pi-{upstream,rust}-parity-1416178`; durable summaries, diffs, native traces and request hashes are in the evidence directory. Never print credentials.

## History

[Checkpoint history](checkpoint-history.md), [append-only board](board.jsonl), and [architecture review](core-replacement-review.md) retain superseded findings and failures.
