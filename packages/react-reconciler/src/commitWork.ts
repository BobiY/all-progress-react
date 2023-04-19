import { Instance, insertChildToContainer } from 'react-dom/src/hostConfig';
import {
	Container,
	appendChildToContainer,
	commitUpdate,
	removeChild
} from 'hostConfig';
import {
	HostComponent,
	HostRoot,
	HostText,
	FunctionComponent
} from './workTags';
import {
	ChildDeletion,
	Flags,
	MutationMask,
	NoFlages,
	PassiveEffect,
	Placement,
	Update
} from './fiberFlags';
import { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber';
import { Effect, FCUpdateQueue } from './fiberHooks';
import { HookHasEffect } from './hookEffectTags';
/**
 * File: commitWork.ts
 * Created Date: 2023-03-07 20:57:10
 * Author: yao
 * Last Modified: 2023-04-18 23:10:37
 * describe：
 */
let nextEffect: FiberNode | null = null;

export const commitMutationEffects = (
	finishedWork: FiberNode,
	root: FiberRootNode
) => {
	nextEffect = finishedWork;

	while (nextEffect !== null) {
		// 向下遍历
		const child: FiberNode | null = nextEffect.child;

		if (
			(nextEffect.subtreeFlags & (MutationMask | PassiveEffect)) !== NoFlages &&
			child !== null
		) {
			nextEffect = child;
		} else {
			// 要么到底了，要么子节点的 subtreeFlags = 0
			// 向上遍历  DFS
			up: while (nextEffect !== null) {
				commitMutationEffectOnFiber(nextEffect, root);

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

const commitMutationEffectOnFiber = (
	finishedWork: FiberNode,
	root: FiberRootNode
) => {
	const flags = finishedWork.flags;

	if ((flags & Placement) !== NoFlages) {
		// placement 操作
		commitPlacement(finishedWork);

		// 将 placement从节点的操作中移除
		finishedWork.flags &= ~Placement;
	}

	if ((flags & Update) !== NoFlages) {
		// Update 操作
		commitUpdate(finishedWork);

		// 将 Update
		finishedWork.flags &= ~Update;
	}

	if ((flags & ChildDeletion) !== NoFlages) {
		// ChildDeletion 操作
		const deletions = finishedWork.deletions;
		if (deletions !== null) {
			deletions.forEach((childToDelete) => {
				commitDeletion(childToDelete, root);
			});
		}

		// 将 ChildDeletion 从节点的操作中移除
		finishedWork.flags &= ~ChildDeletion;
	}
	if ((flags & PassiveEffect) !== NoFlages) {
		// 收集回调
		commitPassiveEffect(finishedWork, root, 'update');
		finishedWork.flags &= ~PassiveEffect;
	}
};

function commitPassiveEffect(
	fiber: FiberNode,
	root: FiberRootNode,
	type: keyof PendingPassiveEffects
) {
	// update
	if (
		fiber.tag !== FunctionComponent ||
		(type === 'update' && (fiber.flags & PassiveEffect) === NoFlages)
	) {
		// 不是函数组件 没有副作用
		return;
	}
	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
	if (updateQueue !== null) {
		if (updateQueue.lastEffect === null && __DEV__) {
			console.error('当 FC 存在 PassiveEffect flag 时，不应该不存在 effect');
		} else {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			root.pendingPassiveEffects[type].push(updateQueue.lastEffect!);
		}
	}

	// unmounted
}

const commitPlacement = (finishedWork: FiberNode) => {
	// finishedWork => dom
	if (__DEV__) {
		console.warn('执行 placement 操作', finishedWork);
	}
	// 获取最近的父级的 DOM 节点
	const hostParent = getHostParent(finishedWork);

	// host sibling
	const sibling = getHostSibling(finishedWork);

	if (hostParent !== null) {
		// 将当前节点插入最近的父 DOM 中
		insertOrappendPlacementNodeIntoContainer(finishedWork, hostParent, sibling);
	}
};

function getHostSibling(fiber: FiberNode) {
	let node: FiberNode = fiber;

	findSibling: while (true) {
		// 不存在兄弟向上找
		while (node.sibling === null) {
			const parent = node.return;
			if (
				parent === null ||
				parent.tag === HostComponent ||
				parent.tag === HostRoot
			) {
				return null;
			}
			node = parent;
		}
		node.sibling.return = node.return;
		node = node.sibling;
		// 存在兄弟 向下找
		while (node.tag !== HostText && node.tag !== HostComponent) {
			// 向下遍历，找到他的子孙元素为 HostText 或者 HostComponent
			if ((node.flags & Placement) !== NoFlages) {
				// 不稳定的节点，不能作为 目标兄弟节点
				continue findSibling;
			}
			if (node.child === null) {
				// 表示到底了
				continue findSibling;
			} else {
				node.child.return = node;
				node = node.child;
			}
		}
		if ((node.flags & Placement) === NoFlages) {
			return node.stateNode;
		}
	}
}

export function commitHookEffectList(
	flags: Flags,
	lastEffect: Effect,
	callback: (effect: Effect) => void
) {
	let effect = lastEffect.next as Effect;

	do {
		if ((effect.tag & flags) === flags) {
			callback(effect);
		}
		effect = effect.next as Effect;
	} while (effect !== lastEffect.next);
}

export function commitHookEffectListDestroy(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const destory = effect.destory;
		if (typeof destory === 'function') {
			destory();
		}
	});
}

export function commitHookEffectListCreate(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const create = effect.create;
		if (typeof create === 'function') {
			effect.destory = create();
		}
	});
}

export function commitHookEffectListUnmount(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const destory = effect.destory;
		if (typeof destory === 'function') {
			destory();
		}
		effect.tag &= ~HookHasEffect;
	});
}

function recordHostChildrenToDelete(
	childrenToDelete: FiberNode[],
	unmountedFiber: FiberNode
) {
	// 1. 找到第一个 root host 节点
	const lastOne = childrenToDelete[childrenToDelete.length - 1];

	if (!lastOne) {
		// 第一个要删除的节点 存在
		childrenToDelete.push(unmountedFiber);
	} else {
		// 是第一个要删除节点的兄弟节点
		let node = lastOne.sibling;
		while (node !== null) {
			if (unmountedFiber === node) {
				childrenToDelete.push(unmountedFiber);
			}
			node = node.sibling;
		}
	}
	// 2. 每找到一个 host 接单，判断这个节点是不是 1 中找到的那个节点的兄弟节点
}

function commitDeletion(childToDelete: FiberNode, root: FiberRootNode) {
	const rootChildrenToDelete: FiberNode[] = [];

	// todo 递归子树
	commitNestedComponent(childToDelete, (unmountedFiber) => {
		switch (unmountedFiber.tag) {
			case HostComponent:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountedFiber);
				// todo 解绑 ref
				return;
			case HostText:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountedFiber);
				return;
			case FunctionComponent:
				// TODO useEffect unmounted 的处理
				commitPassiveEffect(unmountedFiber, root, 'unmount');
				return;
			default:
				if (__DEV__) {
					console.warn('未处理的 unmounted 的节点', unmountedFiber);
				}
				break;
		}
	});
	// todo 移除 rootHostNode
	if (rootChildrenToDelete.length !== 0) {
		const hostParent = getHostParent(childToDelete);
		if (hostParent !== null) {
			rootChildrenToDelete.forEach((node) => {
				removeChild(node.stateNode, hostParent);
			});
		}
	}
	childToDelete.return = null;
	childToDelete.child = null;
}

function commitNestedComponent(
	root: FiberNode,
	onCommitUnmont: (fiber: FiberNode) => void
) {
	let node = root;
	while (true) {
		onCommitUnmont(node);

		if (node.child !== null) {
			// 向下遍历
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === root) {
			// 终止条件
			return;
		}

		while (node.sibling === null) {
			if (node.return === null || node.return === root) {
				return;
			}
			// 向上归的过程
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

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

function insertOrappendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container,
	before?: Instance
) {
	// fiber 线下找到 host 类型的 fiber
	// 当前的 finishedWork 是否是能使用的 DOM 节点类型
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		if (before) {
			// 存在则插入
			insertChildToContainer(finishedWork.stateNode, hostParent, before);
		} else {
			// 不存在则 append
			appendChildToContainer(hostParent, finishedWork.stateNode);
		}
		// 这里 return 的目的是阻断后续操作，不然会导致后续不论什么层级的 child 都插到同一个 parent 中
		return;
	}
	// 如果当前的 finishedWork 不是 hostComponent 节点，则看他的子节点是不是
	const child = finishedWork.child;

	// 子节点存在时
	if (child !== null) {
		// 看子节点是否能插入 DOM 树种
		insertOrappendPlacementNodeIntoContainer(child, hostParent);

		// 处理兄弟节点
		let sibling = child.sibling;
		while (sibling !== null) {
			insertOrappendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
