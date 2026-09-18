# Fork strategy: Pi with a Rust core

## Recommendation

Maintain pi-rs as a fork-shaped distribution of Pi rather than as a separate product that happens to load vendored Pi. Keep the upstream Pi package layout and public package names where compatibility requires them, but replace the implementation of `packages/agent` with a Rust-backed implementation and keep a narrow Node bridge for extensions and providers.

The fork should track a pinned upstream base and periodically rebase or merge upstream changes. The Rust core should live in a clearly owned Rust package/crate; the JavaScript package `@earendil-works/pi-agent-core` should become the compatibility facade that delegates runtime policy to Rust.

## Why this is cleaner

- Existing extensions continue to resolve the same package names and import paths.
- `coding-agent` can remain close to upstream instead of being reimplemented or wrapped from the outside.
- Pi's CLI, settings, package discovery, commands and TUI remain available while the core changes underneath.
- Upstream changes are visible as ordinary fork diffs instead of hidden loader substitutions.
- Users can install one Pi-compatible distribution instead of choosing between a custom headless CLI and an experimental mode.

## What the fork owns

Rust should replace the implementation behind the `agent` package: state transitions, turn scheduling, queues, cancellation/recovery, context projection, durable session operations and eventually provider transport and built-in tools. The JS package keeps the upstream public exports and converts Node callbacks/effects to Rust requests.

The fork should initially retain upstream `coding-agent`, `ai`, `tui`, protocol and extension infrastructure. Those packages are compatibility surfaces, not permanent implementation commitments. Each can be Rust-reimplemented later behind contract tests.

## Costs and controls

A fork must actively manage upstream drift. Record the upstream base commit, merge/rebase date and any conflict in the project checkpoint. Keep vendored reference files unchanged when they are used as an oracle; fork-owned replacements must be clearly separated. Do not silently claim upstream parity after changing behavior.

Use a small compatibility patch surface:

1. package-level Rust adapter and Node-API bridge;
2. explicit changes in `coding-agent` only where it needs to expose Rust runtime lifecycle or session operations;
3. no loader tricks in the released distribution;
4. upstream compatibility tests plus pi-rs Rust tests in CI.

## Migration sequence

1. Make the fork's `packages/agent` JS exports delegate to the Rust adapter without changing the `coding-agent` call sites.
2. Run the unchanged upstream coding-agent CLI against that package with deterministic provider and extension fixtures.
3. Replace session/compaction and provider policy one contract at a time.
4. Make the fork's normal `pi` command select the Rust core; keep an upstream-core fallback only for debugging during migration.
5. Retire the custom headless CLI and loader-based experimental path after equivalent user workflows pass.

This is a product/distribution decision, not a claim that the current repository already has a clean fork. The current experimental path is evidence and migration scaffolding; it should converge into the fork layout.
