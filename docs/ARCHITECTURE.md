# 技术架构与模块边界

- 构建：TypeScript + Vite，目标静态站点，无后端。
- `src/app`：页面结构、浏览器能力、入口状态。
- `src/scene/world.ts`：地形/礁石/珊瑚的创建与 GPU 资源释放。
- `src/scene/coral.ts`：独立程序化珊瑚几何与种子随机数。
- `src/scene/water.ts`：依画质调整的水下氛围，返回资源清理函数。
- `src/scene/view.ts`：默认低于水面的观察镜头。
- `src/app/experience.ts`：创建 Three.js WebGLRenderer、加载世界、运行渲染循环并释放 GPU 资源。
- `src/life/species.ts`：三类程序化鱼的数量、配色、活动范围与游速配置。
- `src/life/steering.ts`：确定性邻近避让、方向协调和活动区域边界逻辑。
- `src/life/creatures.ts`：鱼与海龟三维模型、逐帧游动更新和资源释放。
- `performance`、`platform` 已分别管理画质与生命周期，真实设备验收和外部统计接入仍待完成。
- `src/navigation/motion.ts`：无 DOM 的位置/速度/边界计算；每帧时间步最多 50ms，镜头不穿出水面或海床。
- `src/navigation/controls.ts`：设备输入适配器，键鼠、触摸虚拟方向和浮潜按钮，退出时移除监听器。
- `src/performance/quality.ts`：保守自动档与四档 UI 的低/中/高渲染配置（像素比、抗锯齿、鱼群与珊瑚密度）。
- `src/performance/metrics.ts`：无 DOM 的最近 120 帧统计，忽略无效耗时。
- `src/performance/metrics.ts` 的真实帧间隔与模拟帧步长分开；长时间运行的鱼群维持温和巡游速度。
- `src/main.ts`：延迟加载 Three.js 模块；手动改变画质会销毁并重新创建场景。
- `src/app/app.ts`：应用状态控制器，协调进入/退出、静音、画质切换、前后台和恢复动作。
- 画质重建不重复进入会话、不清零有效时长或人工暂停；自动档连续慢帧后逐级降低场景密度。双触点由 `Controls` 分别维护游动与转向指针。
- `src/platform/lifecycle.ts`：用户暂停、文档隐藏与 WebGL 丢失的组合状态；同时统计有效潜游时长。
- `src/platform/audio.ts`：默认静音、交互启用的本地 Web Audio 低频水流噪声，退出时清理音频资源。
- `src/platform/telemetry.ts`：匿名、有限字段的事件白名单；只发浏览器内事件，不向服务端提交数据。

海洋场景必须可创建/销毁，不允许页面切换时遗留 WebGL 纹理、几何或音频。
