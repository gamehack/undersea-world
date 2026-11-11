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

  it('allows simultaneous left-hand swimming and right-hand looking', () => {
    const stage = document.createElement('div');
    document.body.append(stage);
    Object.defineProperty(stage, 'getBoundingClientRect', { value: () => ({ left: 0, width: 400 }) });
    const controls = new Controls(stage);
    const send = (type: string, pointerId: number, x: number, y: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.assign(event, { pointerId, pointerType: 'touch', clientX: x, clientY: y, button: 0 });
      stage.dispatchEvent(event);
    };
    send('pointerdown', 1, 60, 200);
    send('pointerdown', 2, 310, 200);
    send('pointermove', 1, 60, 135);
    send('pointermove', 2, 355, 195);
    const input = controls.getInput();
    expect(input.forward).toBeGreaterThan(0.5);
    expect(input.yaw).toBeGreaterThan(0.5);
    send('pointerup', 2, 355, 195);
    expect(controls.getInput().forward).toBeGreaterThan(0.5);
    send('pointerup', 1, 60, 135);
    expect(controls.getInput().forward).toBe(0);
    controls.dispose();
    stage.remove();
  });

  it('preserves Space activation on focused buttons', () => {
    const stage = document.createElement('div');
    const button = document.createElement('button');
    stage.append(button);
    document.body.append(stage);
    const controls = new Controls(stage);
    const event = new KeyboardEvent('keydown', { code: 'Space', cancelable: true, bubbles: true });
    button.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(controls.getInput().vertical).toBe(0);
    controls.dispose();
    stage.remove();
  });
});
