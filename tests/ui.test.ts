// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderFallback, renderShell } from '../src/app/ui';

describe('ocean UI', () => {
  it('mounts lifecycle and quality controls with sound off by default', () => {
    const root = document.createElement('div');
    const ui = renderShell(root);
    expect(ui.start.textContent).toContain('进入海底');
    expect(ui.sound.getAttribute('aria-pressed')).toBe('false');
    expect(ui.quality.value).toBe('auto');
    expect(ui.pause.hidden).toBe(true);
    expect(ui.exit.hidden).toBe(true);
    expect(ui.recover.hidden).toBe(true);
  });

  it('keeps unsupported visitors informed with text and a retry action', () => {
    const root = document.createElement('div');
    renderFallback(root, 'WebGL 2 未启用');
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('WebGL 2 未启用');
    expect(root.querySelector('button')?.textContent).toBe('重试进入');
    expect(root.querySelector('img')?.getAttribute('alt')).toContain('静态预览');
  });
});
