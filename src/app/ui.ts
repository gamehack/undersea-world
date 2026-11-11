export function renderFallback(root: HTMLElement, reason: string): void {
  root.replaceChildren();
  const panel = document.createElement('section');
  panel.className = 'fallback-panel';
  panel.setAttribute('role', 'alert');
  const title = document.createElement('h2');
  title.textContent = '暂时无法进入海底';
  const detail = document.createElement('p');
  detail.textContent = reason;
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = '重试进入';
  retry.addEventListener('click', () => window.location.reload());
  const preview = document.createElement('img');
  preview.src = '/fallback.svg';
  preview.alt = '海底珊瑚与鱼群的静态预览';
  panel.append(title, detail, retry, preview);
  root.append(panel);
}

export interface ShellElements {
  stage: HTMLElement;
  overlay: HTMLElement;
  start: HTMLButtonElement;
  status: HTMLElement;
  sound: HTMLButtonElement;
  quality: HTMLSelectElement;
  help: HTMLButtonElement;
  performance: HTMLElement;
  pause: HTMLButtonElement;
  exit: HTMLButtonElement;
  recover: HTMLButtonElement;
  volume: HTMLInputElement;
  slowMode: HTMLButtonElement;
  effects: HTMLButtonElement;
  hideHud: HTMLButtonElement;
  showHud: HTMLButtonElement;
  tutorial: HTMLElement;
  dismissTutorial: HTMLButtonElement;
}

export function renderShell(root: HTMLElement): ShellElements {
  root.innerHTML = `
    <main class="ocean-app">
      <div class="ocean-stage" id="ocean-stage" aria-label="交互式海底世界">
        <div class="preview-fish fish-a" aria-hidden="true"></div>
        <div class="preview-fish fish-b" aria-hidden="true"></div>
      </div>
      <header class="topbar">
        <div class="brand"><span class="brand-mark" aria-hidden="true">◉</span><span>海底世界 <small>UNDERSEA WORLD</small></span></div>
        <div class="top-actions">
          <button id="help-button" class="glass-button" aria-label="查看操作帮助" type="button">帮助</button>
          <button id="pause-button" class="glass-button" type="button" hidden>暂停</button>
          <button id="exit-button" class="glass-button" type="button" hidden>退出</button>
          <details class="settings-menu"><summary class="glass-button">设置</summary>
            <div class="settings-panel">
              <button id="sound-button" class="glass-button" aria-pressed="false" type="button">声音：关闭</button>
              <label class="settings-field">音量 <input id="volume-slider" type="range" min="0" max="100" value="40" aria-label="环境音量"></label>
              <label class="settings-field">画质
                <select id="quality-select" aria-label="画质选择"><option value="auto">自动</option><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select>
              </label>
              <button id="slow-mode-button" class="glass-button" type="button" aria-pressed="false">缓慢模式：关闭</button>
              <button id="effects-button" class="glass-button" type="button" aria-pressed="false">减少光束与颗粒：关闭</button>
              <button id="hide-hud-button" class="glass-button" type="button">隐藏界面</button>
            </div>
          </details>
        </div>
      </header>
      <section id="intro-overlay" class="intro-overlay" aria-labelledby="intro-title">
        <div class="intro-copy">
          <p class="eyebrow">一片海 · 无限宁静</p>
          <h1 id="intro-title">潜入海底，<br><em>与海洋一起呼吸。</em></h1>
          <p class="intro-description">随时进入一片自由的海。看鱼群游弋，听水流低语，在珊瑚之间慢慢探索。没有任务，也无需赶路。</p>
          <button id="enter-button" class="enter-button" type="button">进入海底 <span aria-hidden="true">↗</span></button>
          <p class="intro-note">支持手机和电脑 · 免费体验 · 无需登录</p>
        </div>
        <div class="intro-depth" aria-hidden="true"><span>3—18 M</span><small>热带珊瑚礁</small></div>
      </section>
      <div id="status-message" class="status-message" role="status" aria-live="polite"></div>
      <button id="recover-button" class="recover-button" type="button" hidden>重新连接海底场景</button>
      <button id="show-ui-button" class="show-ui-button" type="button">显示界面</button>
      <aside id="tutorial-panel" class="tutorial-panel" hidden aria-label="初次潜游操作提示">
        <strong>欢迎来到珊瑚礁</strong>
        <p>电脑使用 WASD 和鼠标拖动；手机双手同时操作：左边游动，右边观察。空格/右侧按钮上浮，Shift/C/下潜按钮下降。</p>
        <button id="dismiss-tutorial" type="button">知道了，开始探索</button>
      </aside>
      <output id="performance-status" class="performance-status" aria-label="实时渲染帧率" hidden></output>
      <footer class="footer"><span>轻量生态写实 · 自由探索</span><span>潜界 AI · 数字休闲空间</span></footer>
    </main>`;

  const required = <T extends Element>(selector: string) => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing app element ${selector}`);
    return element;
  };
  return {
    stage: required<HTMLElement>('#ocean-stage'),
    overlay: required<HTMLElement>('#intro-overlay'),
    start: required<HTMLButtonElement>('#enter-button'),
    status: required<HTMLElement>('#status-message'),
    sound: required<HTMLButtonElement>('#sound-button'),
    quality: required<HTMLSelectElement>('#quality-select'),
    help: required<HTMLButtonElement>('#help-button'),
    performance: required<HTMLElement>('#performance-status'),
    pause: required<HTMLButtonElement>('#pause-button'),
    exit: required<HTMLButtonElement>('#exit-button'),
    recover: required<HTMLButtonElement>('#recover-button'),
    volume: required<HTMLInputElement>('#volume-slider'),
    slowMode: required<HTMLButtonElement>('#slow-mode-button'),
    effects: required<HTMLButtonElement>('#effects-button'),
    hideHud: required<HTMLButtonElement>('#hide-hud-button'),
    showHud: required<HTMLButtonElement>('#show-ui-button'),
    tutorial: required<HTMLElement>('#tutorial-panel'),
    dismissTutorial: required<HTMLButtonElement>('#dismiss-tutorial'),
  };
}
