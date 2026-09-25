import { describe, it, expect } from 'vitest';
import app from '../api/index.js';

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

  it('POST /api/internal/tip-worker 라우트가 등록되어 있어야 한다', () => {
    const workerRoute = app._router.stack.find(
      (layer: { route?: { path?: string } }) => layer.route?.path === '/api/internal/tip-worker'
    );
    expect(workerRoute).toBeDefined();
    expect(workerRoute?.route?.methods?.post).toBe(true);
  });
});
