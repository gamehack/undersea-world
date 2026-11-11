# 匿名事件与隐私规则

## 当前实现

`src/platform/telemetry.ts` 对事件名和字段做白名单校验，并通过页面级 DOM 事件 `undersea:analytics` 分发。**尚未配置外部统计服务，也不会自动发送网络请求**，不存在登录 ID、Cookie ID、客户端指纹或精确位置采集。

| 事件名 | 触发条件 | 允许字段 |
|---|---|---|
| `ocean_enter` | 成功创建海洋场景 | `tier`, `source` |
| `ocean_exit` | 用户退出或卸载页面 | `duration_seconds` |
| `ocean_pause` / `ocean_resume` | 用户手动暂停/继续 | `source` |
| `ocean_context_lost` | WebGL 上下文丢失 | `reason` |
| `ocean_error` | 场景初始化失败 | `reason` |
| `ocean_3min` / `ocean_10min` | 累计活跃时长首次达到 180/600 秒 | `duration_seconds` |
| `quality_changed` | 切换画质 | `tier` |
| `sound_toggled` | 改变环境声音 | `enabled` |

允许字段仅限 `tier`、`source`、`duration_seconds`、`reason`、`enabled`，长字符串、含非法字符、非有限数字会丢弃。事件接收方异常不能中断渲染。未来如果接入 GA4 等服务，需要单独评审数据发送、隐私告知、同意与保留期限。

## 时长定义

页面可见、窗口有焦点且海洋场景正在渲染时累加活跃时长；浏览器后台、人工暂停、GPU 丢失期间不计时。动画模拟单次步长最多 50ms，但活跃时长使用真实帧间隔，避免低 FPS 系统性低估；极端单次间隔限为 1 秒以免休眠空窗被误算。用户切换画质时继续累计本次会话时长，不重复发送进入事件。
