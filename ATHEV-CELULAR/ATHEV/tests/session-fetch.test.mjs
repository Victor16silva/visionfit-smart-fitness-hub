import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sessionFetch } from '../js/session-fetch.js';
const base = 'https://example.supabase.co';
const future = () => Response.json({code:'PGRST303',message:'JWT issued at future'}, {status:401});
test('temporary clock rejection retries the same session and returns data', async () => {
  const waits = []; let calls = 0;
  const fetch = sessionFetch(base, async request => {
    assert.equal(request.headers.get('authorization'), 'Bearer test');
    return ++calls === 1 ? future() : Response.json({ok:true});
  }, async ms => waits.push(ms));
  assert.deepEqual(await (await fetch(base+'/rest/v1/profiles', {headers:{authorization:'Bearer test'}})).json(), {ok:true});
  assert.deepEqual(waits,[1000]);
});
test('persistent rejection stops after two retries', async () => {
  let calls = 0;
  const fetch = sessionFetch(base, async () => { calls++; return future(); }, async () => {});
  assert.equal((await fetch(base+'/rest/v1/profiles')).status,401);
  assert.equal(calls,3);
});
test('writes, auth endpoints, other origins and other errors are not replayed', async () => {
  for (const [url, method, response] of [
    [base+'/rest/v1/profiles','POST',future],
    [base+'/auth/v1/user','GET',future],
    ['https://other.example/rest/v1/profiles','GET',future],
    [base+'/rest/v1/profiles','GET',()=>Response.json({code:'PGRST303',message:'JWT expired'},{status:401})],
  ]) {
    let calls=0;
    await sessionFetch(base, async()=>{calls++;return response();}, async()=>{})(url,{method});
    assert.equal(calls,1);
  }
});
test('cancellation prevents retry', async () => {
  const controller = new AbortController(); let calls=0;
  const fetch=sessionFetch(base,async()=>{calls++;return future();},async()=>controller.abort());
  await assert.rejects(fetch(base+'/rest/v1/profiles',{signal:controller.signal}),{name:'AbortError'});
  assert.equal(calls,1);
});
