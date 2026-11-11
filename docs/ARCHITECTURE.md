# 技术架构与模块边界

- 构建：TypeScript + Vite，目标静态站点，无后端。
- `src/app`：页面结构、浏览器能力、入口状态。
- `src/scene/world.ts`：地形/礁石/珊瑚的创建与 GPU 资源释放。
- `src/scene/coral.ts`：独立程序化珊瑚几何与种子随机数。
- `src/scene/water.ts`：依画质调整的水下氛围，返回资源清理函数。
- `src/scene/view.ts`：默认低于水面的观察镜头。
- `src/app/experience.ts`：创建 Three.js WebGLRenderer、加载世界、运行渲染循环并释放 GPU 资源。
- 后续 `navigation`、`life`、`performance`、`platform` 分别管理控制、生态、分档和生命周期。
- `src/navigation/motion.ts`：无 DOM 的位置/速度/边界计算；每帧时间步最多 50ms，镜头不穿出水面或海床。
- `src/navigation/controls.ts`：设备输入适配器，键鼠、触摸虚拟方向和浮潜按钮，退出时移除监听器。

海洋场景必须可创建/销毁，不允许页面切换时遗留 WebGL 纹理、几何或音频。
