// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { getWebGL2Status } from '../src/app/capabilities';
import { renderFallback } from '../src/app/ui';

describe('getWebGL2Status', () => {
  it('reports support when browser returns a usable WebGL2 context', () => {
    expect(getWebGL2Status(() => ({ version: 2 }))).toBe('supported');
  });

  it('uses the fallback when context creation returns null', () => {
    expect(getWebGL2Status(() => null)).toBe('unsupported');
  });

  it('uses the fallback when WebGL context creation throws', () => {
    expect(getWebGL2Status(() => { throw new Error('GPU unavailable'); })).toBe('unsupported');
  });
});

describe('renderFallback', () => {
  it('shows a readable recovery message without interpreting untrusted markup', () => {
    const root = document.createElement('div');
    renderFallback(root, '<script>bad()</script>');
    expect(root.textContent).toContain('<script>bad()</script>');
    expect(root.querySelector('script')).toBeNull();
    expect(root.querySelector('button')?.textContent).toContain('重试');
  });
});
