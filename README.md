# 海底世界 Undersea World

一个以真实海洋生态为方向、轻量生态写实为视觉标准的浏览器数字休闲空间。

## 当前状态

- **已实现：** 静态首页、WebGL 2 能力检测、无 GPU 时的可读兜底页面、实时珊瑚礁场景、PC/手机自由潜游、34 条自主运动的礁鱼及 1 只海龟（默认中档）、自动/手动画质分级、帧率统计、进入后懒加载 3D 模块。
- **已实现的体验控制：** 暂停/继续、退出返回、默认静音并可开启的程序化水流音效、浏览器后台暂停与 WebGL 中断恢复提示；匿名事件仅在页面内部广播。
- **已实现的工程化：** GitHub Actions 单测/类型检查/构建；可手动触发 Playwright PC/移动端浏览器场景测试。
- **待验收：** 真实 WebGL 2 设备的视觉、操作、声音和帧率测试；Cloudflare 预览与生产部署尚未进行。
- **已验证：** 以 `npm test`、`npm run build` 的实际执行结果为准，不把静态首页算作完整海洋体验。
- **当前验证记录：** 2026-11-11，`npm test` 36/36 通过，`npm run typecheck` 与 `npm run build` 成功；当前环境的 Chromium 被操作系统权限限制，Playwright E2E 未通过启动阶段，真机验收待做。详见 `docs/QA.md`。
- **未上线：** 已建立 GitHub 仓库和开发中的草稿 PR，尚未绑定 Cloudflare Pages 站点。

## 本地运行

```bash
npm install
npm run dev
```

验证：`npm test`、`npm run typecheck`、`npm run build`。

完整浏览器验收：`npx playwright install chromium`（首次），然后 `npm run test:e2e`。如需指定系统 Chromium，可设置 `UNDERSEA_CHROMIUM_PATH`。

## Cloudflare Pages 部署准备

- GitHub 仓库：`gamehack/undersea-world`，目前 MVP 功能在 `feat/mvp` 草稿 PR，未合并主分支。
- 框架：Vite；构建命令：`npm ci && npm run build`；输出目录：`dist`；Node.js 24。
- 前端静态单页，无数据库、Secret、后台服务器、付费资源或用户账号；部署前需选择 Pages 项目与正式域名。
- 发布前在 Pages 预览分支进行 PC/手机实机验收；验收未通过不合并、不发布生产域名。

设计依据：`docs/superpowers/specs/2026-11-11-undersea-world-design.md`。开发计划：`docs/superpowers/plans/2026-11-11-undersea-world-mvp.md`。

## 同步原则

功能、行为、架构、埋点与部署改变时，同一提交更新受影响文档和测试；不能先改代码后补文档。
