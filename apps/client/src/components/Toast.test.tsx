/**
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('./Toast.css', () => ({
  toastContainer: 'toastContainer',
  toastContent: 'toastContent',
  toastIcon: 'toastIcon',
}));

import { Toast } from './Toast';
import { useToastStore } from '../store/useToastStore';

describe('Toast Component', () => {
  beforeEach(() => {
    useToastStore.setState({ message: null, timerId: null });
  });

  it('message가 null일 때는 토스트 내용이 렌더링되지 않아야 한다', () => {
    const { container } = render(<Toast />);
    const toastElement = container.querySelector('.toastContent');
    expect(toastElement).toBeNull();
  });

  it('message가 존재할 때 해당 메시지가 화면에 노출되어야 한다', () => {
    useToastStore.setState({ message: '안내 메시지입니다' });

    render(<Toast />);
    expect(screen.getByText('안내 메시지입니다')).toBeDefined();
  });

  it('노출된 토스트를 클릭하면 hideToast가 호출되어 메시지가 닫혀야 한다', () => {
    useToastStore.setState({ message: '클릭 시 닫히는 메시지' });

    render(<Toast />);
    const toastContentEl = screen.getByText('클릭 시 닫히는 메시지');

    fireEvent.click(toastContentEl);

    expect(useToastStore.getState().message).toBeNull();
  });
});
