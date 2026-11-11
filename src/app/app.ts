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
      renderFallback(root, '此浏览器或设备不支持 WebGL 2，或已关闭硬件加速。');
      return;
    }
    entering = true;
    ui.start.disabled = true;
    ui.start.textContent = '正在潜入…';
    ui.status.textContent = '正在初始化海洋世界…';
    try {
      const { mountReefExperience } = await import('./experience');
      experience?.dispose();
      if (!reconfiguring) duration = new ActiveDuration();
      experience = mountReefExperience(ui.stage, currentTier(), {
        onActiveSeconds(seconds) {
          for (const secondsReached of duration.advance(seconds)) {
            telemetry.emit(secondsReached === 180 ? 'ocean_3min' : 'ocean_10min', { duration_seconds: secondsReached });
          }
        },
        onContextLost() {
          lifecycle.onContextLost();
          updateRunningState();
          ui.status.textContent = '图形设备连接中断。等待恢复，或点击重新连接。';
          ui.recover.hidden = false;
          telemetry.emit('ocean_context_lost', { reason: 'webgl' });
        },
        onContextRestored() {
          lifecycle.onContextRestored();
          updateRunningState();
          ui.status.textContent = lifecycle.running ? '海洋画面已恢复。' : '画面已恢复，可以继续。';
          ui.recover.hidden = true;
        },
      });
      if (reconfiguring) lifecycle.onContextRestored();
      else lifecycle.start();
      lifecycle.onVisibility(document.hidden);
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
        if (!stats || !lifecycle.running || ui.quality.value !== 'auto' || entering) return;
        const lower = nextQualityTier(currentTier(), stats);
        slowWindows = lower ? slowWindows + 1 : 0;
        if (slowWindows >= 2 && lower) {
          autoTierOverride = lower;
          telemetry.emit('quality_changed', { tier: lower, source: 'auto' });
          ui.status.textContent = '检测到持续掉帧，正在自动降低画质以保持流畅。';
          void enterOcean();
        }
      }, 2500);
      if (soundEnabled) {
        soundEnabled = await audio.setEnabled(true);
        updateAudioLabel();
      }
      ui.status.textContent = reconfiguring ? '画质已更新，当前位置已重置。' : '已进入珊瑚礁。WASD 游动、空格上浮、Shift 下潜，拖动改变视角。';
      if (!reconfiguring) telemetry.emit('ocean_enter', { tier: currentTier(), source: 'button' });
    } catch {
      stopStats();
      experience?.dispose();
      experience = undefined;
      lifecycle.exit();
      telemetry.emit('ocean_error', { reason: 'initialization' });
      renderFallback(root, '海洋场景初始化失败，请检查图形加速后重试。');
    } finally {
      entering = false;
      ui.start.disabled = false;
      ui.start.textContent = '进入海底';
    }
  }

  function exitOcean(): void {
    telemetry.emit('ocean_exit', { duration_seconds: Math.round(duration.seconds) });
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
    ui.status.textContent = '已返回海面。随时可以再次进入。';
  }

  ui.start.addEventListener('click', () => { void enterOcean(); });
  ui.recover.addEventListener('click', () => { void enterOcean(); });
  ui.exit.addEventListener('click', exitOcean);
  ui.pause.addEventListener('click', () => {
    if (!experience) return;
    if (lifecycle.running) {
      lifecycle.pause();
      telemetry.emit('ocean_pause', { source: 'button' });
      ui.status.textContent = '已暂停。海洋在这里等你。';
    } else {
      lifecycle.resume();
      telemetry.emit('ocean_resume', { source: 'button' });
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
    autoTierOverride = undefined;
    telemetry.emit('quality_changed', { tier: currentTier() });
    ui.status.textContent = `画质：${ui.quality.selectedOptions[0]?.textContent ?? '自动'}`;
    if (experience) void enterOcean();
  });
  ui.help.addEventListener('click', () => {
    ui.status.textContent = '电脑：WASD/方向键游动、拖动转视角、空格上浮、Shift/C 下潜。手机：左侧移动、右侧转视角及上下按钮。';
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
    if (!ui.recover.hidden) ui.recover.click();
    else ui.pause.click();
  });
  window.addEventListener('pagehide', () => { if (experience) exitOcean(); });
}
