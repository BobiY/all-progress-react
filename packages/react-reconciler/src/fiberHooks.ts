import { Action } from './../../shared/ReactTypes';
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate
} from './updateQueue';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
/**
 * File: fiberHooks.ts
 * Created Date: 2023-03-20 22:50:04
 * Author: yao
 * Last Modified: 2023-03-21 23:21:36
 * describe：
 */

import { FiberNode } from './fiber';
import internals from 'shared/internals';
import { scheduleUpdateOnFiber } from './workLoop';

// 当前正在 render 的fiber
let currentlyRenderingFiber: FiberNode | null = null;

// 当前正在处理的 hook
let workInProcessHook: Hook | null = null;

interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}

const { currentDispatcher } = internals;

export function renderWithHooks(wip: FiberNode) {
	// 赋值操作
	currentlyRenderingFiber = wip;
	// 重置
	wip.memoizedState = null;

	const current = wip.alternate;

	if (current !== null) {
		// update
	} else {
		// mount
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const props = wip.pendingProps;
	const Component = wip.type;

	const children = Component(props);
	// 重置操作
	currentlyRenderingFiber = null;
	return children;
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

function mountState<State>(
	initalState: (() => State) | State
): [State, Dispatch<State>] {
	// 找到 useState 对应的 hook 的数据
	const hook = mountWorkInProgressHook();
	let memoizedState;
	if (initalState instanceof Function) {
		memoizedState = initalState();
	} else {
		memoizedState = initalState;
	}

	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;
	// @ts-ignore
	const dispatch = (queue.dispatch = dispatchSetState.bind(
		null,
		currentlyRenderingFiber as FiberNode,
		queue
	));

	queue.dispatch = dispatch;

	return [memoizedState, dispatch];
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	const update = createUpdate(action);

	enqueueUpdate(updateQueue, update);

	scheduleUpdateOnFiber(fiber);
}

function mountWorkInProgressHook(): Hook {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	};
	if (workInProcessHook === null) {
		// mount 是第一个 hook
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用 hook');
		} else {
			workInProcessHook = hook;
			currentlyRenderingFiber.memoizedState = workInProcessHook;
		}
	} else {
		// mount 后续的 hook
		workInProcessHook.next = hook;
		workInProcessHook = hook;
	}

	return workInProcessHook;
}
