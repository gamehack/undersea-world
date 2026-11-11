import * as THREE from 'three';
import { createWorld } from '../scene/world';
import { createWaterAtmosphere } from '../scene/water';
import { createInitialCamera } from '../scene/view';
import { Controls } from '../navigation/controls';
import { advanceMotion, initialMotion } from '../navigation/motion';
import { createMarineLife } from '../life/creatures';
import { qualitySettings, type QualityTier } from '../performance/quality';
import { FrameStats, frameTiming } from '../performance/metrics';

export interface ReefExperience {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  getPerformance(): { fps: number; slowFrameRate: number };
  pause(): void;
  resume(): void;
  dispose(): void;
}

export interface ExperienceCallbacks {
  onActiveSeconds?: (seconds: number) => void;
  onContextLost?: () => void;
  onContextRestored?: () => void;
}

export function mountReefExperience(stage: HTMLElement, tier: QualityTier = 'medium', callbacks: ExperienceCallbacks = {}): ReefExperience {
  const settings = qualitySettings(tier);
  const renderer = new THREE.WebGLRenderer({ antialias: settings.antialias, powerPreference: 'default' });
  renderer.setClearColor(0x0d5267);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.pixelRatioCap));
  renderer.domElement.className = 'ocean-canvas';
  renderer.domElement.setAttribute('aria-label', '可自由探索的珊瑚礁实时三维场景');

  const width = Math.max(1, stage.clientWidth);
  const height = Math.max(1, stage.clientHeight);
  renderer.setSize(width, height);
  stage.replaceChildren(renderer.domElement);

  const scene = new THREE.Scene();
  const world = createWorld(20261111, tier);
  scene.add(world.group);
  const marineLife = createMarineLife(world.group, 20261111, tier);
  const disposeAtmosphere = createWaterAtmosphere(scene, tier);
  const camera = createInitialCamera(width / height);
  const controls = new Controls(stage);
  let motion = { ...initialMotion };
  const clock = new THREE.Clock();
  const frameStats = new FrameStats();
  let frameId = 0;
  let disposed = false;
  let running = true;

  const resize = () => {
    if (disposed) return;
    const w = Math.max(1, stage.clientWidth);
    const h = Math.max(1, stage.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  window.addEventListener('resize', resize);

  const animate = () => {
    if (disposed || !running) return;
    const elapsed = clock.getDelta();
    const { simulationSeconds: seconds, activeSeconds } = frameTiming(elapsed);
    frameStats.pushFrame(elapsed * 1000);
    motion = advanceMotion(motion, controls.getInput(), seconds, world.bounds);
    marineLife.update(seconds);
    camera.position.set(motion.x, motion.y, motion.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(motion.pitch, motion.yaw, 0);
    renderer.render(scene, camera);
    callbacks.onActiveSeconds?.(activeSeconds);
    frameId = window.requestAnimationFrame(animate);
  };
  const pause = () => {
    if (!running || disposed) return;
    running = false;
    window.cancelAnimationFrame(frameId);
    clock.stop();
  };
  const resume = () => {
    if (running || disposed) return;
    running = true;
    clock.start();
    frameId = window.requestAnimationFrame(animate);
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    pause();
    callbacks.onContextLost?.();
  };
  const contextRestored = () => callbacks.onContextRestored?.();
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
  frameId = window.requestAnimationFrame(animate);

  return {
    scene,
    camera,
    getPerformance: () => frameStats.summary(),
    pause,
    resume,
    dispose() {
      disposed = true;
      running = false;
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      controls.dispose();
      disposeAtmosphere();
      scene.remove(world.group);
      marineLife.dispose();
      world.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
