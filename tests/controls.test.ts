// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { Controls } from '../src/navigation/controls';

describe('Controls', () => {
  it('maps keyboard swim directions and clears them when released', () => {
    const stage = document.createElement('div');
    document.body.append(stage);
    const controls = new Controls(stage);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    expect(controls.getInput().forward).toBe(1);
    expect(controls.getInput().vertical).toBe(1);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
    expect(controls.getInput().forward).toBe(0);
    controls.dispose();
    stage.remove();
  });

  it('does not keep moving after the browser loses focus', () => {
    const controls = new Controls(document.createElement('div'));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' }));
    window.dispatchEvent(new Event('blur'));
    expect(controls.getInput().forward).toBe(0);
    controls.dispose();
  });
});
