import type { MotionInput } from './motion';

const bounded = (v: number) => Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0;

/** Keyboard, pointer and touch controls share one bounded input contract. */
export class Controls {
  private keys = new Set<string>();
  private forward = 0;
  private strafe = 0;
  private vertical = 0;
  private yaw = 0;
  private pitch = 0;
  private movementPointer: { id: number; origin: { x: number; y: number } } | null = null;
  private lookPointer: { id: number; last: { x: number; y: number } } | null = null;
  private hud: HTMLElement;

  constructor(private stage: HTMLElement) {
    this.hud = document.createElement('div');
    this.hud.className = 'touch-hud';
    this.hud.innerHTML = '<div class="joystick-hint" aria-hidden="true"><span>游动</span></div><div class="depth-actions"><button class="up" type="button" aria-label="上浮">↑ 上浮</button><button class="down" type="button" aria-label="下潜">↓ 下潜</button></div>';
    stage.append(this.hud);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibility);
    stage.addEventListener('pointerdown', this.onPointerDown);
    stage.addEventListener('pointermove', this.onPointerMove);
    stage.addEventListener('pointerup', this.onPointerUp);
    stage.addEventListener('pointercancel', this.onPointerUp);
    this.hud.querySelectorAll<HTMLButtonElement>('.depth-actions button').forEach(button => {
      button.addEventListener('pointerdown', this.onDepthDown);
      button.addEventListener('pointerup', this.onDepthUp);
      button.addEventListener('pointercancel', this.onDepthUp);
    });
  }

  getInput(): MotionInput {
    const result: MotionInput = {
      forward: bounded(Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) - Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) + this.forward),
      strafe: bounded(Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')) + this.strafe),
      vertical: bounded(Number(this.keys.has('Space')) - Number(this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.keys.has('KeyC')) + this.vertical),
      yaw: bounded(this.yaw), pitch: bounded(this.pitch),
    };
    this.yaw = this.pitch = 0;
    return result;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('button,input,select,textarea,[contenteditable="true"]')) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    this.keys.add(e.code);
  };
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.code); };
  private onBlur = () => {
    this.keys.clear(); this.forward = this.strafe = this.vertical = this.yaw = this.pitch = 0;
    this.movementPointer = null;
    this.lookPointer = null;
  };
  private onVisibility = () => { if (document.hidden) this.onBlur(); };
  private onDepthDown = (e: PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    this.vertical = (e.currentTarget as HTMLElement).classList.contains('up') ? 1 : -1;
  };
  private onDepthUp = (e: PointerEvent) => { e.stopPropagation(); this.vertical = 0; };
  private onPointerDown = (e: PointerEvent) => {
    if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLSelectElement) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const rect = this.stage.getBoundingClientRect();
    const isMovement = e.pointerType !== 'mouse' && e.clientX < rect.left + rect.width * 0.43;
    if (isMovement) {
      if (this.movementPointer) return;
      this.movementPointer = { id: e.pointerId, origin: { x: e.clientX, y: e.clientY } };
    } else {
      if (this.lookPointer) return;
      this.lookPointer = { id: e.pointerId, last: { x: e.clientX, y: e.clientY } };
    }
    this.stage.setPointerCapture?.(e.pointerId);
  };
  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerId === this.movementPointer?.id) {
      this.strafe = bounded((e.clientX - this.movementPointer.origin.x) / 42);
      this.forward = bounded((this.movementPointer.origin.y - e.clientY) / 42);
    } else if (e.pointerId === this.lookPointer?.id) {
      this.yaw = bounded(this.yaw + (e.clientX - this.lookPointer.last.x) / 45);
      this.pitch = bounded(this.pitch + (e.clientY - this.lookPointer.last.y) / 45);
      this.lookPointer.last = { x: e.clientX, y: e.clientY };
    }
  };
  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerId === this.movementPointer?.id) {
      this.movementPointer = null;
      this.forward = this.strafe = 0;
    } else if (e.pointerId === this.lookPointer?.id) {
      this.lookPointer = null;
    } else return;
    if (this.stage.hasPointerCapture?.(e.pointerId)) this.stage.releasePointerCapture(e.pointerId);
  };

  dispose(): void {
    this.onBlur();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.stage.removeEventListener('pointerdown', this.onPointerDown);
    this.stage.removeEventListener('pointermove', this.onPointerMove);
    this.stage.removeEventListener('pointerup', this.onPointerUp);
    this.stage.removeEventListener('pointercancel', this.onPointerUp);
    this.hud.remove();
  }
}
