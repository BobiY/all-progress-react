### 基本概念记录

- current => 真实 UI 对应的 Fiber Tree（前缓冲区）
- work In Progress(wip) => 正在内存中构建的 Fiber Tree（后缓冲区）
- 两者通过 alternate 属性链接，如下：

```javascript

current.alternate == workInProgress
workInProgress.alternate = current
```

- hostFiberNode => 对应应用挂载的根节点的 fiber node
- fiberRootNode => 用来管理全局，比如 workInProgress 和 current 的切换，任务的调度信息等
