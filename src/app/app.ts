import { browserWebGL2Status } from './capabilities';
import { renderFallback, renderShell } from './ui';
import { nextQualityTier, selectQuality, type QualityTier } from '../performance/quality';
import { ActiveDuration, Lifecycle } from '../platform/lifecycle';
import { OceanAudio } from '../platform/audio';
import { browserTelemetry } from '../platform/telemetry';
import type { ReefExperience } from './experience';

export function createOceanApp(root: HTMLElement): void {
  const ui = renderShell(root);
  const lifecycle = new Lifecycle();
  const telemetry = browserTelemetry();
  const audio = new OceanAudio();
  let duration = new ActiveDuration();
  let experience: ReefExperience | undefined;
  let entering = false;
  let soundEnabled = false;
  let statsTimer: number | undefined;
  let autoTierOverride: QualityTier | undefined;
  let slowWindows = 0;
  let tutorialSeen = false;
  let slowMode = false;
  let reducedEffects = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let activeTier: QualityTier | undefined;
  let sessionStartedAt = 0;
  let hadContextLoss = false;
  const appElement = root.querySelector<HTMLElement>('.ocean-app')!;
  audio.setVolume(Number(ui.volume.value) / 100);
  const deviceClass = window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 ? 'mobile' : 'desktop';
  let referrerGroup = 'direct';
  if (document.referrer) {
    try {
      const host = new URL(document.referrer).hostname.toLowerCase();
      referrerGroup = /google|bing|baidu|duckduckgo/.test(host) ? 'search'
        : /facebook|instagram|tiktok|reddit|x\.com|twitter|youtube/.test(host) ? 'social' : 'other';
    } catch { referrerGroup = 'other'; }
  }
  telemetry.emit('app_opened', { device_class: deviceClass, referrer_group: referrerGroup });
  if (reducedEffects) {
    ui.effects.setAttribute('aria-pressed', 'true');
    ui.effects.textContent = '减少光束与颗粒：开启';
  }

  function currentTier(): QualityTier {
    const selected = ui.quality.value;
    if (selected === 'low' || selected === 'medium' || selected === 'high') return selected;
    return autoTierOverride ?? selectQuality((navigator as Navigator & { deviceMemory?: number }).deviceMemory, window.devicePixelRatio);
  }

  function updateAudioLabel(): void {
    ui.sound.textContent = `声音：${soundEnabled ? '开启' : '关闭'}`;
    ui.sound.setAttribute('aria-pressed', String(soundEnabled));
  }

  function stopStats(): void {
    if (statsTimer !== undefined) window.clearInterval(statsTimer);
    statsTimer = undefined;
    ui.performance.hidden = true;
  }

  function updateRunningState(): void {
    if (lifecycle.running) experience?.resume();
    else experience?.pause();
    ui.pause.textContent = lifecycle.running ? '暂停' : '继续';
    if (lifecycle.running && soundEnabled) void audio.resume();
    else void audio.suspend();
  }

  async function enterOcean(): Promise<void> {
    if (entering) return;
    const reconfiguring = !!experience;
    if (browserWebGL2Status() === 'unsupported') {
      if (experience) exitOcean();
      telemetry.emit('scene_load_failed', { error_category: 'unsupported_webgl2', stage: 'capability' });
      renderFallback(root, '此浏览器或设备不支持 WebGL 2，或已关闭硬件加速。');
      return;
    }
    entering = true;
    ui.start.disabled = true;
    ui.start.textContent = '正在潜入…';
    ui.status.textContent = '正在初始化海洋世界…';
    const loadStartedAt = performance.now();
    telemetry.emit('scene_load_started', { quality_tier: currentTier() });
    try {
      const { mountReefExperience } = await import('./experience');
      experience?.dispose();
      if (!reconfiguring) duration = new ActiveDuration();
      experience = mountReefExperience(ui.stage, currentTier(), {
        onActiveSeconds(seconds) {
          for (const secondsReached of duration.advance(seconds)) {
            telemetry.emit(secondsReached === 180 ? 'experience_3min' : 'experience_10min', { active_seconds: secondsReached });
          }
        },
        onContextLost() {
          lifecycle.onContextLost();
          updateRunningState();
          ui.status.textContent = '图形设备连接中断。等待恢复，或点击重新连接。';
          ui.recover.hidden = false;
          hadContextLoss = true;
          telemetry.emit('context_lost', { cause: 'webgl' });
        },
        onContextRestored() {
          lifecycle.onContextRestored();
          updateRunningState();
          ui.status.textContent = lifecycle.running ? '海洋画面已恢复。' : '画面已恢复，可以继续。';
          ui.recover.hidden = true;
          hadContextLoss = false;
          telemetry.emit('render_recovered', { cause: 'webgl', success: true });
        },
      });
      experience.setSlowMode(slowMode);
      experience.setReducedEffects(reducedEffects);
      if (reconfiguring) lifecycle.onContextRestored();
      else {
        lifecycle.start();
        lifecycle.onFocus(true);
      }
      lifecycle.onVisibility(document.hidden);
      if (hadContextLoss) {
        hadContextLoss = false;
        telemetry.emit('render_recovered', { cause: 'manual_retry', success: true });
      }
      activeTier = currentTier();
      updateRunningState();
      ui.overlay.hidden = true;
      ui.pause.hidden = false;
      ui.exit.hidden = false;
      ui.recover.hidden = true;
      stopStats();
      ui.performance.hidden = false;
      slowWindows = 0;
      statsTimer = window.setInterval(() => {
        const stats = experience?.getPerformance();
        const fps = stats?.fps ?? 0;
        ui.performance.textContent = fps ? `${Math.round(fps)} FPS · ${currentTier().toUpperCase()}` : '测量中';
        if (stats?.fps) telemetry.emit('render_performance', { fps: Math.round(stats.fps), slow_frame_rate: stats.slowFrameRate, device_class: deviceClass });
        if (!stats || !lifecycle.running || ui.quality.value !== 'auto' || entering) return;
        const consistentlySlow = stats.fps > 0 && stats.fps < 25 && stats.slowFrameRate >= 0.45;
        slowWindows = consistentlySlow ? slowWindows + 1 : 0;
        if (slowWindows >= 2) {
          slowWindows = 0;
          if (!reducedEffects) {
            reducedEffects = true;
            experience?.setReducedEffects(true);
            ui.effects.setAttribute('aria-pressed', 'true');
            ui.effects.textContent = '减少光束与颗粒：开启';
            ui.status.textContent = '检测到掉帧，已先降低水体特效。';
          } else {
            const lower = nextQualityTier(currentTier(), stats);
            if (lower) {
              const from = currentTier();
              autoTierOverride = lower;
              telemetry.emit('quality_changed', { from, to: lower, reason: 'auto' });
              ui.status.textContent = '检测到持续掉帧，正在自动降低画质以保持流畅。';
              void enterOcean();
            }
          }
        }
      }, 2500);
      if (soundEnabled) {
        soundEnabled = await audio.setEnabled(true);
        updateAudioLabel();
      }
      ui.status.textContent = reconfiguring ? '画质已更新，当前位置已重置。' : '已进入珊瑚礁。WASD 游动、空格上浮、Shift 下潜，拖动改变视角。';
      telemetry.emit('scene_load_succeeded', { quality_tier: currentTier(), load_duration_ms: Math.round(performance.now() - loadStartedAt) });
      if (!reconfiguring) {
        sessionStartedAt = performance.now();
        telemetry.emit('experience_started', { input_type: deviceClass === 'mobile' ? 'touch' : 'keyboard' });
      }
      if (!reconfiguring && !tutorialSeen) ui.tutorial.hidden = false;
    } catch {
      stopStats();
      experience?.dispose();
      experience = undefined;
      lifecycle.exit();
      telemetry.emit('scene_load_failed', { error_category: 'initialization', stage: 'renderer' });
      renderFallback(root, '海洋场景初始化失败，请检查图形加速后重试。');
    } finally {
      entering = false;
      ui.start.disabled = false;
      ui.start.textContent = '进入海底';
    }
  }

  function exitOcean(): void {
    telemetry.emit('experience_ended', {
      active_seconds: Math.round(duration.seconds),
      total_seconds: Math.round((performance.now() - sessionStartedAt) / 1000),
    });
    lifecycle.exit();
    experience?.dispose();
    experience = undefined;
    stopStats();
    void audio.dispose();
    soundEnabled = false;
    updateAudioLabel();
    ui.overlay.hidden = false;
    ui.pause.hidden = true;
    ui.exit.hidden = true;
    ui.recover.hidden = true;
    ui.tutorial.hidden = true;
    appElement.classList.remove('ui-hidden');
    ui.status.textContent = '已返回海面。随时可以再次进入。';
  }

  ui.start.addEventListener('click', () => { void enterOcean(); });
  ui.recover.addEventListener('click', () => { void enterOcean(); });
  ui.exit.addEventListener('click', exitOcean);
  ui.pause.addEventListener('click', () => {
    if (!experience) return;
    if (lifecycle.running) {
      lifecycle.pause();
      telemetry.emit('experience_paused', { reason: 'button' });
      ui.status.textContent = '已暂停。海洋在这里等你。';
    } else {
      lifecycle.resume();
      telemetry.emit('experience_resumed', { reason: 'button' });
      ui.status.textContent = '继续潜游。';
    }
    updateRunningState();
  });
  ui.sound.addEventListener('click', () => {
    const desired = !soundEnabled;
    if (!experience) {
      soundEnabled = desired;
      updateAudioLabel();
      ui.status.textContent = desired ? '进入海底后开启水流环境声。' : '声音已关闭。';
      return;
    }
    void audio.setEnabled(desired).then(enabled => {
      soundEnabled = enabled;
      if (!lifecycle.running) void audio.suspend();
      updateAudioLabel();
      ui.status.textContent = enabled ? '水流环境声已开启。' : (desired ? '此设备无法开启音频。' : '环境声音已关闭。');
      telemetry.emit('sound_toggled', { enabled });
    });
  });
  ui.quality.addEventListener('change', () => {
    const from = activeTier ?? currentTier();
    autoTierOverride = undefined;
    telemetry.emit('quality_changed', { from, to: currentTier(), reason: 'manual' });
    ui.status.textContent = `画质：${ui.quality.selectedOptions[0]?.textContent ?? '自动'}`;
    if (experience) void enterOcean();
  });
  ui.volume.addEventListener('input', () => {
    audio.setVolume(Number(ui.volume.value) / 100);
  });
  ui.slowMode.addEventListener('click', () => {
    slowMode = !slowMode;
    ui.slowMode.setAttribute('aria-pressed', String(slowMode));
    ui.slowMode.textContent = `缓慢模式：${slowMode ? '开启' : '关闭'}`;
    experience?.setSlowMode(slowMode);
  });
  ui.effects.addEventListener('click', () => {
    reducedEffects = !reducedEffects;
    ui.effects.setAttribute('aria-pressed', String(reducedEffects));
    ui.effects.textContent = `减少光束与颗粒：${reducedEffects ? '开启' : '关闭'}`;
    experience?.setReducedEffects(reducedEffects);
  });
  ui.hideHud.addEventListener('click', () => { appElement.classList.add('ui-hidden'); });
  ui.showHud.addEventListener('click', () => { appElement.classList.remove('ui-hidden'); });
  ui.dismissTutorial.addEventListener('click', () => { ui.tutorial.hidden = true; tutorialSeen = true; });
  ui.help.addEventListener('click', () => {
    ui.status.textContent = '电脑：WASD/方向键游动、拖动转视角、空格上浮、Shift/C 下潜。手机：左侧移动、右侧转视角及上下按钮。';
    if (experience) ui.tutorial.hidden = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (!experience) return;
    const action = lifecycle.onVisibility(document.hidden);
    updateRunningState();
    if (action === 'resume') ui.status.textContent = '欢迎回来，继续探索。';
  });
  window.addEventListener('blur', () => {
    if (!experience) return;
    lifecycle.onFocus(false);
    updateRunningState();
  });
  window.addEventListener('focus', () => {
    if (!experience) return;
    lifecycle.onFocus(true);
    updateRunningState();
  });
  window.addEventListener('keydown', event => {
    if (event.code !== 'Escape' || !experience) return;
    if (event.target instanceof HTMLElement && event.target.closest('select,input,textarea')) return;
    event.preventDefault();
    if (!ui.tutorial.hidden) ui.dismissTutorial.click();
    else if (!ui.recover.hidden) ui.recover.click();
    else ui.pause.click();
  });
  window.addEventListener('pagehide', () => { if (experience) exitOcean(); });
}
