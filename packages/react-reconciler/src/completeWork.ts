import { Update } from './fiberFlags';
/**
 * File: completeWork.ts
 * Created Date: 2023-02-21 21:02:37
 * Author: yao
 * Last Modified: 2023-04-05 16:04:19
 * describe：DFS 遍历节点 归 的过程
 */

import { NoFlages } from './fiberFlags';
import {
	createInstance,
	appendInitalChild,
	createTextInstance,
	Container
} from 'hostConfig';
import {
	HostComponent,
	HostText,
	HostRoot,
	FunctionComponent,
	Fragment
} from './workTags';
import { FiberNode } from './fiber';
import { updateFiberProps } from 'react-dom/src/syntheticEvent';

function markUpdate(fiber: FiberNode) {
	fiber.flags |= Update;
}

export const completeWork = (wip: FiberNode) => {
	const newProps = wip.pendingProps;
	const current = wip.alternate;

	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// update
				// 遍历属性是否变化
				// 1. props 是否变化
				// 2. 变了 Update Flag
				updateFiberProps(wip.stateNode, newProps);
			} else {
				// mount
				// 1. 构建 DOM
				const instance = createInstance(wip.type, newProps);
				// 2. 将 DON 插入到 DOM 树中
				appendAllChildren(instance, wip);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		case HostText:
			if (current !== null && wip.stateNode) {
				// update
				const oldText = current.memoizedProps.content;
				const newText = newProps.content;
				if (oldText !== newText) {
					markUpdate(wip);
				}
			} else {
				// mount
				// 1. 构建 DOM
				const instance = createTextInstance(newProps.content);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		case HostRoot:
		case FunctionComponent:
		case Fragment:
			bubbleProperties(wip);
			return null;
		default:
			if (__DEV__) {
				console.log('未处理的 completeWork 的情况');
			}
			break;
	}
	return null;
};

function appendAllChildren(parent: Container, wip: FiberNode) {
	let node = wip.child;
	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitalChild(parent, node?.stateNode);
		} else if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === wip) {
			return;
		}

		while (node.sibling === null) {
			if (node.return === null || node.return === wip) {
				return;
			}
			node = node?.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

// 将 wip 的子节点的更新标记冒泡到 wip 上
function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlages;
	let child = wip.child;

	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;

		child.return = wip;
		child = child.sibling;
	}
	wip.subtreeFlags |= subtreeFlags;
}
