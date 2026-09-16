# Current checkpoint

Main `673d99a` includes PR #54: assistant text/tool-call provider wire conversion, plus PR #52: original tool definition snippets/guidelines now reach formal CLI prompts; active/custom normalization and exact pinned-builder equality pass. Head 7dee906 passed CI35136017635/35136012501 and independent checkout `/tmp/pi-agent-end-verify` rebuilt and passed tool-prompt-contributions and cli-agent-start. Earlier partial fix only preserved bash guidance and is superseded in the board. Rust lifecycle/queue/provider failure changes through PR #51 are merged.

Live status: historical native 0/3 complete workflows; separate current smokes each 0/1. The latest complete prompt-fix smoke on ecf01ed passed bugfix and failed resumed protected-test integrity; arithmetic/tests/process/history checks pass, zero steering. Original pinned Pi baseline passed 1/1 workflow. These runs have differing wire parameters and are not a causal isolation. [Evidence](experiments/upstream-live-baseline/README.md), including native-complete-prompt-fix.json. No daily-use reliability claim.

## Current critical path

Deterministic provider request conformance before further live reruns. Observed upstream developer message role versus native system role; upstream omits reasoning_effort and includes store=false/max_completion_tokens, native sends reasoning_effort=none. Confirm pinned provider source and compare captured requests after normalizing workspace paths. Fix only demonstrated contract differences; retain fixed prompts, model and protected acceptance. Do not blame model alone or introduce guardrails without evidence.

Locate adapter request conversion and compare actual upstream wire generation, including resumed messages and tool schemas. Add executable regression; then run one smoke and, only after success, three clean repetitions. Main merge CI still needs inspection. Worker capacity has repeatedly failed; execute locally unless an independent bounded task justifies another attempt.

## History

[Archived checkpoints](checkpoint-history.md), [board](board.jsonl), and committed experiment summaries preserve failed results and supersessions. Raw credentials and traces remain outside Git. Preserve unrelated worktrees/stash.
