import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useToastStore } from './useToastStore';

describe('useToastStore Zustand store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.setState({ message: null, timerId: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('초기 상태는 message와 timerId가 null이어야 한다', () => {
    const state = useToastStore.getState();
    expect(state.message).toBeNull();
    expect(state.timerId).toBeNull();
  });

  it('showToast 호출 시 메시지와 타이머가 설정되고 지정 시간 후 메시지가 닫혀야 한다', () => {
    useToastStore.getState().showToast('테스트 메시지', 3000);

    expect(useToastStore.getState().message).toBe('테스트 메시지');
    expect(useToastStore.getState().timerId).not.toBeNull();

    // 2999ms 경과 시에는 여전히 표시됨
    vi.advanceTimersByTime(2999);
    expect(useToastStore.getState().message).toBe('테스트 메시지');

    // 3000ms 경과 시 메시지와 타이머가 초기화됨
    vi.advanceTimersByTime(1);
    expect(useToastStore.getState().message).toBeNull();
    expect(useToastStore.getState().timerId).toBeNull();
  });

  it('새로운 showToast 호출 시 이전 타이머를 클리어하고 새 메시지로 갱신되어야 한다', () => {
    useToastStore.getState().showToast('첫 번째 메시지', 3000);
    const firstTimerId = useToastStore.getState().timerId;

    // 1초 후 두 번째 토스트 표시
    vi.advanceTimersByTime(1000);
    useToastStore.getState().showToast('두 번째 메시지', 2000);

    expect(useToastStore.getState().message).toBe('두 번째 메시지');
    expect(useToastStore.getState().timerId).not.toBe(firstTimerId);

    // 이전 타이머 시점(3000ms)이 아닌 새로 설정된 duration(2000ms) 후 초기화되어야 함
    vi.advanceTimersByTime(1999);
    expect(useToastStore.getState().message).toBe('두 번째 메시지');

    vi.advanceTimersByTime(1);
    expect(useToastStore.getState().message).toBeNull();
  });

  it('hideToast 호출 시 즉시 메시지가 null이 되고 타이머가 클리어되어야 한다', () => {
    useToastStore.getState().showToast('수동 닫기 테스트', 5000);
    expect(useToastStore.getState().message).toBe('수동 닫기 테스트');

    useToastStore.getState().hideToast();

    expect(useToastStore.getState().message).toBeNull();
    expect(useToastStore.getState().timerId).toBeNull();
  });
});
