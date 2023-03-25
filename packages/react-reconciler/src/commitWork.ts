import { Container, appendChildToContainer } from 'hostConfig';
import { HostComponent, HostRoot, HostText } from './workTags';
import { MutationMask, NoFlages, Placement } from './fiberFlags';
import { FiberNode } from './fiber';
/**
 * File: commitWork.ts
 * Created Date: 2023-03-07 20:57:10
 * Author: yao
 * Last Modified: 2023-03-22 20:35:43
 * describe：
 */
let nextEffect: FiberNode | null = null;

export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextEffect = finishedWork;

	while (nextEffect !== null) {
		// 向下遍历
		const child: FiberNode | null = nextEffect.child;

		if (
			(nextEffect.subtreeFlags & MutationMask) !== NoFlages &&
			child !== null
		) {
			nextEffect = child;
		} else {
			// 要么到底了，要么子节点的 subtreeFlags = 0
			// 向上遍历  DFS
			up: while (nextEffect !== null) {
				commitMutationEffectOnFiber(nextEffect);

				// 处理兄弟节点
				const sibling: FiberNode | null = nextEffect.sibling;

				if (sibling !== null) {
					nextEffect = sibling;
					break up;
				}
				nextEffect = nextEffect.return;
			}
		}
	}
};

const commitMutationEffectOnFiber = (finishedWork: FiberNode) => {
	const flags = finishedWork.flags;

	if ((flags & Placement) !== NoFlages) {
		// placement 操作
		commitPlacement(finishedWork);

		// 将 placement从节点的操作中移除
		finishedWork.flags &= ~Placement;
	}
};

const commitPlacement = (finishedWork: FiberNode) => {
	// finishedWork => dom
	if (__DEV__) {
		console.warn('执行 placement 操作', finishedWork);
	}
	// 获取最近的父级的 DOM 节点
	const hostParent = getHostParent(finishedWork);
	if (hostParent !== null) {
		// 将当前节点插入最近的父 DOM 中
		appendPlacementNodeIntoContainer(finishedWork, hostParent);
	}
};

function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return;

	while (parent) {
		const parentTag = parent.tag;
		// HostComponent HostRoot
		if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		}
		if (parentTag == HostRoot) {
			return parent.stateNode.container as Container;
		}
		parent = parent.return;
	}

	if (__DEV__) {
		console.warn('未找到挂载的parent Dom 节点', fiber);
	}
	return null;
}

function appendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container
) {
	// fiber 线下找到 host 类型的 fiber
	// 当前的 finishedWork 是否是能使用的 DOM 节点类型
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		appendChildToContainer(hostParent, finishedWork.stateNode);
		// 这里 return 的目的是阻断后续操作，不然会导致后续不论什么层级的 child 都插到同一个 parent 中
		return;
	}
	// 如果当前的 finishedWork 不是 hostComponent 节点，则看他的子节点是不是
	const child = finishedWork.child;

	// 子节点存在时
	if (child !== null) {
		// 看子节点是否能插入 DOM 树种
		appendPlacementNodeIntoContainer(child, hostParent);

		// 处理兄弟节点
		let sibling = child.sibling;
		while (sibling !== null) {
			appendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
