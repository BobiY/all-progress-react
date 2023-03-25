/**
 * File: beginWork.ts
 * Created Date: 2023-02-21 21:02:26
 * Author: yao
 * Last Modified: 2023-03-22 20:14:29
 * describe：DFS 遍历节点 递 的过程
 */
import { ReactElementType } from 'shared/ReactTypes';
import { UpdateQueue, processUpdateQueue } from './updateQueue';
import { FiberNode } from './fiber';
import {
	HostRoot,
	HostComponent,
	HostText,
	FunctionComponent
} from './workTags';
import { mountChildFibers, reconcilerChildFibers } from './childFbers';
import { renderWithHooks } from './fiberHooks';

// 找到 wip 的子节点
export const beginWork = (wip: FiberNode) => {
	// 比较，返回子 fiberNode
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip);
		case HostComponent:
			return updateHostCompnent(wip);
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(wip);
		default:
			if (__DEV__) {
				console.warn('beginWork未实现的类型');
			}
			break;
	}
	return null;
};

function updateHostRoot(wip: FiberNode) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	// 执行 pending.action 即可获得应用的跟组件 App 的 React Element 实例
	const { memoizedState } = processUpdateQueue(baseState, pending);
	wip.memoizedState = memoizedState;

	const nextChildren = wip.memoizedState; // 函数组件的返回值就是自己的 孩子
	recocnileChildren(wip, nextChildren);
	return wip.child;
}

function updateHostCompnent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	recocnileChildren(wip, nextChildren);
	return wip.child;
}

function updateFunctionComponent(wip: FiberNode) {
	const nextChildren = renderWithHooks(wip);
	recocnileChildren(wip, nextChildren);
	return wip.child;
}

function recocnileChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate;
	if (current !== null) {
		// mount 时，只有 hostRootFiber 存在 alternate，就是 hostRootFiber
		// update  <div><h3></h3></div>
		wip.child = reconcilerChildFibers(wip, current?.child, children);
	} else {
		// mount
		wip.child = mountChildFibers(wip, null, children);
	}
}

/**
 * 经过 recocnileChildren 的计算以后，wip 的 children 从 React Element 变为了 FiberNode
 */
