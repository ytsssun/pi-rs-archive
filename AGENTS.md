# pi-rs contribution guide

Pi-rs replaces Pi's core runtime in Rust while preserving the unchanged TypeScript/Node.js plugin boundary. Keep compatibility claims tied to reproducible evidence.

For runtime limits, fixture contracts, recovery semantics, and known compatibility gaps, read [`docs/runtime-details.md`](docs/runtime-details.md) when changing runtime, provider, tool, session, or context behavior. For current verified status and historical evidence, read [`docs/checkpoint.md`](docs/checkpoint.md) and query [`docs/board.jsonl`](docs/board.jsonl).

Every behavioral change must include an appropriate deterministic or live verification. Record commands, results, scope, and failures in the append-only board; distinguish tested from verified. Preserve upstream Pi source and plugin files unchanged unless the task explicitly concerns the vendored reference.

## Runtime ownership

Rust owns execution policy: state transitions, message admission and queues, turn scheduling, cancellation/recovery semantics, and context projection. Node hosts unchanged Pi plugins, tools, providers and callbacks, executes effects requested by Rust, and returns their results through Node-API.

This is the target boundary, not a claim that migration is complete. The current JS driver still owns parts of scheduling and failure handling. When changing these behaviors, read [the architecture map](docs/architecture.md), trace the active CLI path, and move the relevant decision into Rust with an upstream-backed regression test. Keep JS additions focused on ecosystem adapters; document any temporary policy in JS, its necessity, and its migration task on the board. Preserve existing upstream implementations instead of rewriting them for language purity.

Judge progress by Rust's control of runtime behavior and reproducible Pi compatibility, not Rust/JS line counts. Update the architecture map when ownership changes. See [checkpoint](docs/checkpoint.md) for the current migration acceptance criteria.

The long-term target is Rust-first implementation with a thin Node compatibility host. Preserve Pi contracts for extensions and providers, but do not preserve upstream implementations merely for language purity. Before deleting an upstream implementation, add contract, extension/provider, failure, and fresh-process recovery evidence as specified in [the Rust-first architecture decision](docs/architecture-decision-rust-first.md).

For milestone selection, delegation, CI integration, or recovery after a worker failure, follow [the coordinator contract](docs/coordinator.md).
