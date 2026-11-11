import { browserWebGL2Status } from './app/capabilities';
import { renderFallback, renderShell } from './app/ui';
import { mountReefExperience } from './app/experience';
import './styles.css';
import './controls.css';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root');

const ui = renderShell(root);
let soundEnabled = false;
ui.sound.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  ui.sound.textContent = `声音：${soundEnabled ? '开启' : '关闭'}`;
  ui.sound.setAttribute('aria-pressed', String(soundEnabled));
  ui.status.textContent = soundEnabled ? '环境声音将在场景加载后启用。' : '环境声音已关闭。';
});
ui.quality.addEventListener('change', () => {
  ui.status.textContent = `画质：${ui.quality.selectedOptions[0]?.textContent ?? '自动'}`;
});
ui.help.addEventListener('click', () => {
  ui.status.textContent = '电脑：WASD 游动，空格上浮；手机：拖动视角和虚拟摇杆。';
});
ui.start.addEventListener('click', () => {
  if (browserWebGL2Status() === 'unsupported') {
    renderFallback(root, '此浏览器或设备尚不支持 WebGL 2，或硬件加速已被关闭。');
    return;
  }
  ui.start.disabled = true;
  ui.start.textContent = '正在潜入…';
  ui.status.textContent = '正在初始化海洋世界…';
  try {
    const quality = ui.quality.value === 'low' || ui.quality.value === 'high' ? ui.quality.value : 'medium';
    mountReefExperience(ui.stage, quality);
    ui.overlay.hidden = true;
    ui.status.textContent = '已进入珊瑚礁。WASD 游动、空格上浮、Shift 下潜，拖动改变视角。';
  } catch {
    renderFallback(root, '海洋场景加载失败，请检查硬件加速设置后重试。');
  }
});
