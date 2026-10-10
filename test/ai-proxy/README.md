# Local test of the AI Formula proxy

Runs the real Worker with `wrangler dev`, a throw-away signing key and a stand-in for api.anthropic.com.
Nothing is sent to Anthropic and no real key is needed.

```bash
npm install
node test/ai-proxy/keys.mjs            # test signing key + Pro / Free / expired / blocked DBK1 keys, writes .dev.vars
node test/ai-proxy/mock.mjs &          # fake Messages API on 127.0.0.1:8799
npx wrangler dev --local --port 8787 &
node test/ai-proxy/run.mjs             # 16 checks; prints ALL PASSED
```

Delete `.dev.vars` afterwards (it is git-ignored). Start each run with a fresh `wrangler dev`
(or delete `.wrangler/`) so the daily counters start at zero.
