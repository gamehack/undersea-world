import { test, expect, type Page } from 'playwright/test';

async function enterIfSupported(page: Page): Promise<boolean> {
  await page.goto('/');
  const supportsWebGL2 = await page.evaluate(() => {
    try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
  });
  if (!supportsWebGL2) return false;
  await page.getByRole('button', { name: '进入海底' }).click();
  await expect(page.locator('canvas.ocean-canvas')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#intro-overlay')).toBeHidden();
  return true;
}

test('shows an understandable fallback when WebGL 2 is missing', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type, ...args) {
      if (type === 'webgl2') return null;
      return original.call(this, type, ...args);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto('/');
  await page.getByRole('button', { name: '进入海底' }).click();
  await expect(page.getByRole('alert')).toContainText('暂时无法进入海底');
  await expect(page.getByRole('button', { name: '重试进入' })).toBeVisible();
});

test('enters the reef, pauses, resumes, changes quality and exits', async ({ page }) => {
  test.skip(!(await enterIfSupported(page)), 'WebGL 2 unavailable in browser environment');
  await expect(page.getByRole('button', { name: '暂停' })).toBeVisible();
  await expect(page.getByRole('button', { name: '退出' })).toBeVisible();
  await expect(page.locator('#tutorial-panel')).toBeVisible();
  await page.getByRole('button', { name: '知道了，开始探索' }).click();
  await page.getByText('设置', { exact: true }).click();
  await expect(page.getByRole('button', { name: '声音：关闭' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByLabel('环境音量').fill('30');
  await page.getByRole('button', { name: '缓慢模式：关闭' }).click();
  await expect(page.getByRole('button', { name: '缓慢模式：开启' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '减少光束与颗粒：关闭' }).click();
  await page.getByRole('button', { name: '暂停' }).click();
  await expect(page.getByRole('button', { name: '继续' })).toBeVisible();
  await page.getByLabel('画质选择').selectOption('low');
  await expect(page.getByRole('button', { name: '继续' })).toBeVisible();
  await page.getByRole('button', { name: '继续' }).click();
  await expect(page.locator('canvas.ocean-canvas')).toBeVisible();
  await page.getByRole('button', { name: '帮助' }).click();
  await expect(page.locator('#status-message')).toContainText('WASD');
  await page.getByRole('button', { name: '隐藏界面' }).click();
  await expect(page.getByRole('button', { name: '显示界面' })).toBeVisible();
  await page.getByRole('button', { name: '显示界面' }).click();
  await page.getByRole('button', { name: '退出' }).click();
  await expect(page.getByRole('button', { name: '进入海底' })).toBeVisible();
});

test('automatically pauses when the page becomes hidden', async ({ page }) => {
  test.skip(!(await enterIfSupported(page)), 'WebGL 2 unavailable in browser environment');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByRole('button', { name: '继续' })).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByRole('button', { name: '暂停' })).toBeVisible();
});

test('shows recovery action after a simulated WebGL context loss', async ({ page }) => {
  test.skip(!(await enterIfSupported(page)), 'WebGL 2 unavailable in browser environment');
  const simulated = await page.locator('canvas.ocean-canvas').evaluate(canvas => {
    const context = (canvas as HTMLCanvasElement).getContext('webgl2');
    const extension = context?.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    extension.loseContext();
    return true;
  });
  test.skip(!simulated, 'WEBGL_lose_context extension not available');
  await expect(page.getByRole('button', { name: '重新连接海底场景' })).toBeVisible();
  await expect(page.locator('#status-message')).toContainText('连接中断');
});

test('mobile view exposes touch swimming and depth controls', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Touch layout test');
  test.skip(!(await enterIfSupported(page)), 'WebGL 2 unavailable in browser environment');
  await expect(page.locator('.touch-hud')).toBeVisible();
  await expect(page.getByRole('button', { name: '上浮' })).toBeVisible();
  await expect(page.getByRole('button', { name: '下潜' })).toBeVisible();
});
