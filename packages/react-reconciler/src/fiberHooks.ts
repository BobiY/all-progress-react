import { Action } from './../../shared/ReactTypes';
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue
} from './updateQueue';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
/**
 * File: fiberHooks.ts
 * Created Date: 2023-03-20 22:50:04
 * Author: yao
 * Last Modified: 2023-04-18 23:08:59
 * describe：
 */

import { FiberNode } from './fiber';
import internals from 'shared/internals';
import { scheduleUpdateOnFiber } from './workLoop';
import { requestUpdateLane, NoLane, Lane } from './fiberLanes';
import { Flags, PassiveEffect } from './fiberFlags';
import { HookHasEffect, Passive } from './hookEffectTags';

// 当前正在 render 的fiber
let currentlyRenderingFiber: FiberNode | null = null;

// 当前正在处理的 hook
let workInProcessHook: Hook | null = null;
let currentHook: Hook | null = null; // update
let renderLane: Lane = NoLane;

interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}

export interface Effect {
	tag: Flags;
	destory: EffectCallback | void;
	create: EffectCallback | void;
	deps: EffectDeps | void;
	next: Effect | null;
}

export interface FCUpdateQueue<State> extends UpdateQueue<State> {
	lastEffect: Effect | null; // 指向 effect 环状链表的最后一个
}

type EffectCallback = () => void;
type EffectDeps = any[] | null;

const { currentDispatcher } = internals;

export function renderWithHooks(wip: FiberNode, lane: Lane) {
	// 赋值操作
	currentlyRenderingFiber = wip;
	// 重置
	wip.memoizedState = null;
	wip.updateQueue = null;
	renderLane = lane;

	const current = wip.alternate;

	if (current !== null) {
		// update
		currentDispatcher.current = HooksDispatcherOnUpdate;
	} else {
		// mount
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const props = wip.pendingProps;
	const Component = wip.type;

	const children = Component(props);
	// 重置操作
	currentlyRenderingFiber = null;
	workInProcessHook = null;
	currentHook = null;
	renderLane = NoLane;
	return children;
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState,
	useEffect: mountEffect
};

const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState,
	useEffect: updateEffect
};

function updateState<State>(): [State, Dispatch<State>] {
	// 找到 useState 对应的 hook 的数据
	const hook = updateWorkInProgressHook();

	// 计算新 state 的逻辑
	const queue = hook.updateQueue as UpdateQueue<State>;

	const pending = queue.shared.pending;

	if (pending !== null) {
		const { memoizedState } = processUpdateQueue(
			hook.memoizedState,
			pending,
			renderLane
		);
		hook.memoizedState = memoizedState;
	}
	return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}

function updateEffect(create: EffectCallback | void, deps: EffectDeps | void) {
	// 找到 useEffect 对应的 hook 的数据
	const hook = updateWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	let destory: EffectCallback | void;

	if (currentHook !== null) {
		const prevEffect = currentHook.memoizedState as Effect;
		destory = prevEffect.destory;

		if (nextDeps !== null) {
			// 浅比较
			const prevDeps = prevEffect.deps as EffectDeps;
			if (areHookInputsEqual(nextDeps, prevDeps)) {
				hook.memoizedState = pushEffect(Passive, create, destory, deps);
				return;
			}
		}
		// 浅比较不相等
		(currentlyRenderingFiber as FiberNode).flags |= PassiveEffect;
		hook.memoizedState = pushEffect(
			Passive | HookHasEffect,
			create,
			destory,
			deps
		);
	}
}

function mountEffect(create: EffectCallback | void, deps: EffectDeps | void) {
	// 找到 useEffect 对应的 hook 的数据
	const hook = mountWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;

	// 代表当前 fiber 需要处理副作用
	(currentlyRenderingFiber as FiberNode).flags |= PassiveEffect;

	hook.memoizedState = pushEffect(
		Passive | HookHasEffect,
		create,
		undefined,
		nextDeps
	);
}

function areHookInputsEqual(nextDeps: EffectDeps, prevDeps: EffectDeps) {
	if (prevDeps === null || nextDeps === null) {
		return false;
	}

	for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
		if (Object.is(prevDeps[i], nextDeps[i])) {
			continue;
		}
		// 有不相等
		return false;
	}
	// 全等
	return true;
}

function pushEffect(
	hookFlags: Flags,
	create: EffectCallback | void,
	destory: EffectCallback | void,
	deps: EffectDeps | void
): Effect {
	const effect: Effect = {
		tag: hookFlags,
		create,
		destory,
		deps,
		next: null
	};

	const fiber = currentlyRenderingFiber as FiberNode;
	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
	if (updateQueue === null) {
		const updateQueue = createFCUpdateQueue();
		fiber.updateQueue = updateQueue;
		effect.next = effect;
		updateQueue.lastEffect = effect;
	} else {
		// queue 存在
		const lastEffect = updateQueue.lastEffect;
		if (lastEffect === null) {
			effect.next = effect;
			updateQueue.lastEffect = effect;
		} else {
			effect.next = lastEffect.next;
			lastEffect.next = effect;
			updateQueue.lastEffect = effect;
		}
	}

	return effect;
}

function createFCUpdateQueue<State>() {
	const updateQueue = createUpdateQueue<State>() as FCUpdateQueue<State>;
	updateQueue.lastEffect = null;
	return updateQueue;
}

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
	const lane = requestUpdateLane();
	const update = createUpdate(action, lane);

	enqueueUpdate(updateQueue, update);

	scheduleUpdateOnFiber(fiber, lane);
}

function updateWorkInProgressHook() {
	// TODO render 阶段触发的更新
	let nextCurrentKook: Hook | null;

	if (currentHook === null) {
		// 这是 FC update 是的第一个 hook 复用的节点才会有
		const current = currentlyRenderingFiber?.alternate;
		if (current !== null) {
			nextCurrentKook = current?.memoizedState; // 获取 hook, 不存在就是第一个
		} else {
			// mount 阶段
			nextCurrentKook = null;
		}
	} else {
		nextCurrentKook = currentHook.next;
	}

	if (nextCurrentKook === null) {
		// mount/update u1  u2  u3
		// update       u1  u2  u3  u4
		throw new Error(
			`组件${currentlyRenderingFiber?.type}执行时比上次多了一个 hook，请检查`
		);
	}

	currentHook = nextCurrentKook as Hook;
	const newHook: Hook = {
		memoizedState: currentHook?.memoizedState,
		updateQueue: currentHook?.updateQueue,
		next: null
	};
	if (workInProcessHook === null) {
		// mount 是第一个 hook
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用 hook');
		} else {
			workInProcessHook = newHook;
			currentlyRenderingFiber.memoizedState = workInProcessHook;
		}
	} else {
		// mount 后续的 hook
		workInProcessHook.next = newHook;
		workInProcessHook = newHook;
	}

	return workInProcessHook;
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
