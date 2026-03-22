# System Health
> Last checked: 2026-03-23 00:04 CET

## Gateway
- ✅ Running on port 19789 (loopback)
- ✅ Config valid, no issues or warnings
- ✅ Model: anthropic/claude-opus-4-6

## Cron Health
- ✅ memory-autosave: healthy (0 consecutive errors)
- ⚠️ library-update: 2 consecutive errors
- ❌ memory-save: 5 consecutive errors (channel config)
- ❌ evoclaw-heartbeat: 6 consecutive errors (channel config)

## Recommendations
1. **Critical:** Fix delivery channel on `memory-save` and `evoclaw-heartbeat` cron jobs — both have been failing consistently since creation. Either set `delivery.channel` explicitly or switch to `delivery.mode: "none"`.
2. Monitor library-update — 2 consecutive errors, currently recovering.
3. Consider whether memory-save (isolated) and memory-autosave (main session) are redundant.
