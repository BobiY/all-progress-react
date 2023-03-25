/**
 * File: fiberReconciler.ts
 * Created Date: 2023-02-22 20:00:44
 * Author: yao
 * Last Modified: 2023-03-22 19:57:01
 * describe：
 */
import { Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate
} from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

// createRoot(container) 执行的方法
// 创建了一个 hostRoot 对应的 fiber 和 一个 FiberRootNode
export function createContainer(container: Container) {
	// 创建 hostRootFiber 对应应用挂载的根节点
	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	// 用来管理全局事宜 => 保存应用通用的信息
	const root = new FiberRootNode(container, hostRootFiber);
	// 挂载 rootFiber 的更新队列
	hostRootFiber.updateQueue = createUpdateQueue();

	return root;
}

// createRoot(container).render(<App />) 执行的方法
export function updateContainer(
	element: ReactElementType | null, // 挂载的应用跟组件 App
	rootFiber: FiberRootNode // hostRootFiber 对应的 dom 节点也就是 fiberRootNode
) {
	// 指的是应用的根节点对应的fiber 节点
	const hostRootFiber = rootFiber.current;
	// 创建一个更新 action
	const update = createUpdate<ReactElementType | null>(element);
	// 将此更新加入 更新队列中
	// 将 update 插入队列中等待执行
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	);

	// 开始 reconciler 阶段
	scheduleUpdateOnFiber(hostRootFiber);
	return element;
}

/**
 * 所以在 beginWork 阶段处理 rootFiber 时，执行队列中保存的 action，即可获得应用的根组件 App 的 React Element 实例
 */
