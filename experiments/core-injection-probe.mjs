// Negative capability probe; this is not a successful Rust-in-upstream integration.
import assert from 'node:assert/strict';
import {AgentSession} from '../vendor/pi-mono/packages/coding-agent/src/core/agent-session.ts';
import * as nativeDriver from '../prototype/architecture/native-runtime-driver.mjs';
assert.deepEqual(Object.keys(nativeDriver),['drive']);
assert.throws(()=>new AgentSession({agent:nativeDriver,cwd:process.cwd()}),/subscribe is not a function/);
console.log('CONFIRMED GAP: current native driver is not an upstream AgentSession-compatible Agent; no CLI core replacement demonstrated');
