# 海底世界 Undersea World

一个以真实海洋生态为方向、轻量生态写实为视觉标准的浏览器数字休闲空间。

## 当前状态

- **已实现：** 静态首页、WebGL 2 能力检测、无 GPU 时的可读兜底页面、基础声音/画质界面、实时珊瑚礁场景、PC/手机自由潜游。
- **开发中：** 鱼群与海龟、性能分级、真实声音与匿名事件。
- **已验证：** 以 `npm test`、`npm run build` 的实际执行结果为准，不把静态首页算作完整海洋体验。
- **当前验证记录：** 2026-11-11，`npm test` 14/14 通过，`npm run build` 成功；当前隔离执行环境禁止启动 Chromium，尚未完成手机/PC 实际画面与触控体验验收。
- **未上线：** 尚未绑定 GitHub 远程仓库或 Cloudflare Pages 站点。

## 本地运行

```bash
npm install
npm run dev
```

验证：`npm test`、`npm run typecheck`、`npm run build`。

设计依据：`docs/superpowers/specs/2026-11-11-undersea-world-design.md`。开发计划：`docs/superpowers/plans/2026-11-11-undersea-world-mvp.md`。

## 同步原则

功能、行为、架构、埋点与部署改变时，同一提交更新受影响文档和测试；不能先改代码后补文档。
