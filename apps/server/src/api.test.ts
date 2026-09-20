import { describe, it, expect, vi } from 'vitest';
import app from '../api/index.js';
import type { Request, Response } from 'express';

// 샌드박스 환경(TCP 포트 바인딩 제한)에서 안전하게 Express 라우터를 검증하는 헬퍼
function createMockRes() {
  const res: Partial<Response> = {};
  res.statusCode = 200;
  res.status = vi.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn().mockImplementation((data: unknown) => {
    res.locals = { data };
    return res;
  });
  return res as Response & { statusCode: number; locals: { data: unknown } };
}

describe('Server Route Handlers (Sandbox-safe)', () => {
  it('GET /api/health 라우트가 등록되어 있어야 한다', () => {
    const healthRoute = app._router.stack.find(
      (layer: { route?: { path?: string } }) => layer.route?.path === '/api/health'
    );
    expect(healthRoute).toBeDefined();
    expect(healthRoute?.route?.methods?.get).toBe(true);
  });

  it('POST /api/flyers/parse-master 라우트가 등록되어 있어야 한다', () => {
    const parseMasterRoute = app._router.stack.find(
      (layer: { route?: { path?: string } }) => layer.route?.path === '/api/flyers/parse-master'
    );
    expect(parseMasterRoute).toBeDefined();
    expect(parseMasterRoute?.route?.methods?.post).toBe(true);
  });

  it('POST /api/flyers/sync-branch 라우트가 등록되어 있어야 한다', () => {
    const syncBranchRoute = app._router.stack.find(
      (layer: { route?: { path?: string } }) => layer.route?.path === '/api/flyers/sync-branch'
    );
    expect(syncBranchRoute).toBeDefined();
    expect(syncBranchRoute?.route?.methods?.post).toBe(true);
  });
});
