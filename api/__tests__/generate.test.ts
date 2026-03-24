import { describe, it, expect, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';

// Import the handler
import handler from '../generate-website';

function makeReq(body: any) {
  return { body } as any;
}

function makeRes() {
  const res: any = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (data: any) => { res._json = data; return res; };
  res.send = (d: any) => { res._send = d; return res; };
  return res;
}

describe('generate-website handler', () => {
  const siteDir = path.join(process.cwd(), 'public', 'preview');

  afterAll(() => {
    // cleanup preview files created by tests
    if (fs.existsSync(siteDir)) {
      fs.rmSync(siteDir, { recursive: true, force: true });
    }
  });

  it('creates preview files', async () => {
    const req = makeReq({ brandName: 'TestSite', prompt: 'A small test site' });
    const res = makeRes();

    await handler(req, res);
    expect(res._status).toBe(200);
    const siteId = res._json?.siteId;
    expect(siteId).toBeDefined();
    const preview = res._json?.previewUrl;
    expect(preview).toContain('/preview/');

    const dir = path.join(process.cwd(), 'public', 'preview', siteId);
    expect(fs.existsSync(dir)).toBe(true);
    expect(fs.existsSync(path.join(dir, 'index.html'))).toBe(true);
  });
});
