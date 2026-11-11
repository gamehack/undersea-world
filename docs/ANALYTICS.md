# 匿名事件与隐私规则

## 当前实现

`src/platform/telemetry.ts` 对事件名和字段做白名单校验，并通过页面级 DOM 事件 `undersea:analytics` 分发。**尚未配置外部统计服务，也不会自动发送网络请求**，不存在登录 ID、Cookie ID、客户端指纹或精确位置采集。

| 事件名 | 触发条件 | 允许字段 |
|---|---|---|
| `app_opened` | 首页应用完成初始化 | `device_class`, `referrer_group` |
| `scene_load_started` | 开始初始化 3D | `quality_tier` |
| `scene_load_succeeded` | 场景创建成功 | `quality_tier`, `load_duration_ms` |
| `scene_load_failed` | WebGL 不支持或初始化失败 | `error_category`, `stage` |
| `experience_started` | 首次进入可潜游场景 | `input_type` |
| `experience_ended` | 用户退出或页面卸载 | `active_seconds`, `total_seconds` |
| `experience_paused` / `experience_resumed` | 用户手动暂停/继续 | `reason` |
| `context_lost` | WebGL 上下文丢失 | `cause` |
| `render_recovered` | WebGL 自动恢复或手动重试 | `cause`, `success` |
| `experience_3min` / `experience_10min` | 累计活跃时长首次达到 180/600 秒 | `active_seconds` |
| `quality_changed` | 用户手动或运行时自动降档 | `from`, `to`, `reason` |
| `render_performance` | 场景渲染期间每 2.5 秒发布一次最近帧率统计 | `fps`, `slow_frame_rate`, `device_class` |
| `sound_toggled` | 改变环境声音 | `enabled` |

事件对齐已批准设计规格第 9.1 节。`device_class` 仅为粗略的 mobile/desktop，`referrer_group` 仅为 direct/search/social/other，绝不发送原始 Referer 或完整 URL。仅允许上表列出的字段，长字符串、含非法字符、非有限数字会丢弃。事件接收方异常不能中断渲染。当前页面内分发不等于持久化测量，仍无法据此得出真实进入成功率。未来接入 GA4 等服务，需要单独评审数据发送、隐私告知、同意与保留期限。

## 时长定义

页面可见、窗口有焦点且海洋场景正在渲染时累加活跃时长；浏览器后台、人工暂停、GPU 丢失期间不计时。动画模拟单次步长最多 50ms，但活跃时长使用真实帧间隔，避免低 FPS 系统性低估；极端单次间隔限为 1 秒以免休眠空窗被误算。用户切换画质时继续累计本次会话时长，不重复发送进入事件。
