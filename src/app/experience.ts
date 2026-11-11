import * as THREE from 'three';
import { createWorld } from '../scene/world';
import { createWaterAtmosphere } from '../scene/water';
import { createInitialCamera } from '../scene/view';
import { Controls } from '../navigation/controls';
import { advanceMotion, initialMotion } from '../navigation/motion';

export interface ReefExperience {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  dispose(): void;
}

export function mountReefExperience(stage: HTMLElement, tier: 'low' | 'medium' | 'high' = 'medium'): ReefExperience {
  const renderer = new THREE.WebGLRenderer({ antialias: tier === 'high', powerPreference: 'default' });
  renderer.setClearColor(0x0d5267);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier === 'high' ? 1.75 : tier === 'low' ? 1 : 1.35));
  renderer.domElement.className = 'ocean-canvas';
  renderer.domElement.setAttribute('aria-label', '可自由探索的珊瑚礁实时三维场景');

  const width = Math.max(1, stage.clientWidth);
  const height = Math.max(1, stage.clientHeight);
  renderer.setSize(width, height);
  stage.replaceChildren(renderer.domElement);

  const scene = new THREE.Scene();
  const world = createWorld(20261111);
  scene.add(world.group);
  const disposeAtmosphere = createWaterAtmosphere(scene, tier);
  const camera = createInitialCamera(width / height);
  const controls = new Controls(stage);
  let motion = { ...initialMotion };
  const clock = new THREE.Clock();
  let frameId = 0;
  let disposed = false;

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
    if (disposed) return;
    const seconds = Math.min(clock.getDelta(), 0.05);
    motion = advanceMotion(motion, controls.getInput(), seconds, world.bounds);
    camera.position.set(motion.x, motion.y, motion.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(motion.pitch, motion.yaw, 0);
    renderer.render(scene, camera);
    frameId = window.requestAnimationFrame(animate);
  };
  frameId = window.requestAnimationFrame(animate);

  return {
    scene,
    camera,
    dispose() {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      controls.dispose();
      disposeAtmosphere();
      scene.remove(world.group);
      world.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
