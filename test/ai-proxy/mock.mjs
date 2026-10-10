// stands in for api.anthropic.com: records what it was sent and answers like the Messages API
import http from 'node:http'; import fs from 'node:fs';
http.createServer((req, res) => { let b = ''; req.on('data', d => b += d); req.on('end', () => {
  fs.appendFileSync(new URL('upstream.log', import.meta.url), JSON.stringify({ path: req.url, headers: { 'x-api-key': req.headers['x-api-key'], 'anthropic-beta': req.headers['anthropic-beta'] }, body: JSON.parse(b) }) + '\n');
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-opus-5-5', stop_reason: 'end_turn', stop_sequence: null,
    usage: { input_tokens: 300, output_tokens: 40 }, content: [{ type: 'thinking', thinking: '', signature: 'x' }, { type: 'text', text: 'FORMULA: =SUMIFS($E$2:$E$1301,$B$2:$B$1301,B2)\nWHY: Adds the amount of this party.' }] }));
}); }).listen(8799);
