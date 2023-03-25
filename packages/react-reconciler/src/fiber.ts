import { ReactElementType } from 'shared/ReactTypes';
/**
 * File: fiber.ts
 * Created Date: 2023-02-21 20:32:54
 * Author: yao
 * Last Modified: 2023-03-21 22:50:16
 * describe：fiber node
 */
import { Props, Key } from 'shared/ReactTypes';
import { workTag, FunctionComponent, HostComponent } from './workTags';
import { Flags, NoFlages } from './fiberFlags';
import { Container } from 'hostConfig';

export class FiberNode {
	tag: any;
	key: any;
	stateNode: any;
	type: any;
	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;
	ref: any;
	pendingProps: Props;
	memoizedProps: Props | null;
	memoizedState: any;

	alternate: FiberNode | null;
	flags: Flags;
	subtreeFlags: Flags;

	updateQueue: unknown;

	constructor(tag: workTag, pendingProps: Props, key: Key) {
		// 实例属性
		this.tag = tag;
		this.key = key;
		// HostComponent <div> => 保存真实的 div DOM 节点
		this.stateNode = null;
		// fiber node 的类型
		// FunctionComponent => 指的是 函数组件本身
		this.type = null;
		//  构成树状结构
		// 指向父fiberNode
		this.return = null;
		// 兄弟 fiberNode
		this.sibling = null;
		// 子 fiberNode
		this.child = null;
		this.index = 0;

		this.ref = null;

		// 作为工作单元
		this.pendingProps = pendingProps; // 初始化的 props 是什么
		this.memoizedProps = null; // 最终计算完成的 props 是什么
		this.memoizedState = null; // 保存 hook 值的链表，指向第 0 个 hooks
		this.updateQueue = null;

		this.alternate = null;
		this.flags = NoFlages; // fiber Node 的计算出的操作类型 => 副作用
		this.subtreeFlags = NoFlages;
	}
}

export class FiberRootNode {
	// 宿主环境根节点
	container: Container;
	current: FiberNode;
	// 更新完成后储存在这个字段中
	finishedWork: FiberNode | null;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
	}
}

export const createWorkInProcess = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let wip = current.alternate;
	if (wip == null) {
		// 首屏渲染时  mount
		wip = new FiberNode(current.tag, pendingProps, current.key);
		wip.stateNode = current.stateNode;
		wip.alternate = current;
		current.alternate = wip;
	} else {
		// update
		wip.pendingProps = pendingProps;
		wip.flags = NoFlages;
		wip.subtreeFlags = NoFlages;
	}
	wip.type = current.type;
	wip.updateQueue = current.updateQueue;
	wip.child = current.child;
	wip.memoizedState = current.memoizedState;
	wip.memoizedProps = current.memoizedProps;
	return wip;
};

export function createFiberFromElement(element: ReactElementType): FiberNode {
	const { type, key, props } = element;
	let fiberTag: workTag = FunctionComponent;
	if (typeof type === 'string') {
		// <div /> type : 'div'
		fiberTag = HostComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('未实现的type类型', element);
	}

	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	return fiber;
}
