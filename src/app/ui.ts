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
          <button id="sound-button" class="glass-button" aria-pressed="false" type="button">声音：关闭</button>
          <label class="quality-label">画质
            <select id="quality-select" aria-label="画质选择"><option value="auto">自动</option><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select>
          </label>
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
  };
}
