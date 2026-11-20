import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/public-config.js';

function response() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('public-config rejects non-GET requests', () => {
  const res = response();
  handler({ method: 'POST' }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, 'GET');
});

test('public-config reports missing Supabase settings without exposing secrets', () => {
  const oldUrl = process.env.SUPABASE_URL;
  const oldAnon = process.env.SUPABASE_ANON_KEY;
  const oldService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'must-never-be-returned';
  try {
    const res = response();
    handler({ method: 'GET' }, res);
    assert.equal(res.statusCode, 503);
    assert.match(res.body.error, /SUPABASE_URL/);
    assert.equal(JSON.stringify(res.body).includes('must-never-be-returned'), false);
  } finally {
    if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl;
    if (oldAnon === undefined) delete process.env.SUPABASE_ANON_KEY; else process.env.SUPABASE_ANON_KEY = oldAnon;
    if (oldService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = oldService;
  }
});

test('public-config returns only the browser-safe anon key and URL', () => {
  const oldUrl = process.env.SUPABASE_URL;
  const oldAnon = process.env.SUPABASE_ANON_KEY;
  process.env.SUPABASE_URL = 'https://example-project.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'public-anon-key';
  try {
    const res = response();
    handler({ method: 'GET' }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      supabaseUrl: 'https://example-project.supabase.co',
      supabaseAnonKey: 'public-anon-key'
    });
  } finally {
    if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl;
    if (oldAnon === undefined) delete process.env.SUPABASE_ANON_KEY; else process.env.SUPABASE_ANON_KEY = oldAnon;
  }
});
