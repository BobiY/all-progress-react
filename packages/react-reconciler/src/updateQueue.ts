import { Lane } from './fiberLanes';
/**
 * File: updateQueue.ts
 * Created Date: 2023-02-21 21:20:15
 * Author: yao
 * Last Modified: 2023-04-18 09:35:56
 * describe：
 */

import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';

export interface Update<State> {
	action: Action<State>;
	next: Update<any> | null;
	lane: Lane;
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}

// 创建更新的数据结构(实例)
export const createUpdate = <State>(
	action: Action<State>,
	lane: Lane
): Update<State> => {
	return {
		action,
		next: null,
		lane
	};
};

export const createUpdateQueue = <State>() => {
	return {
		shared: {
			pending: null
		},
		dispatch: null
	} as UpdateQueue<State>;
};

// 将 update 加入 update队列的方法
export const enqueueUpdate = <State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>
) => {
	// update 既是第一个节点，又是最后一个节点
	const pending = updateQueue.shared.pending;
	if (pending === null) {
		// pending a -> a
		update.next = update;
	} else {
		// pending b -> a -> b
		update.next = pending.next;
		pending.next = update;
	}

	updateQueue.shared.pending = update;
};

// 消费 update 的方法
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null,
	renderLane: Lane
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState
	};
	if (pendingUpdate !== null) {
		// 第一个 update
		const first = pendingUpdate.next;
		let pending = pendingUpdate.next as Update<any>;
		do {
			const updateLane = pending?.lane;
			if (updateLane === renderLane) {
				const action = pending.action;
				if (action instanceof Function) {
					// baseState = 2  pendingUpdate = (x) => 4x => memoizedState = 4
					result.memoizedState = action(result.memoizedState);
				} else {
					// baseState = 1  pendingUpdate 2 => memoizedState 2
					result.memoizedState = action;
				}
			} else {
				if (__DEV__) {
					console.error('不应该进入这里 updateLane === renderLane');
				}
			}
			pending = pending.next as Update<any>;
		} while (pending !== first);
	}
	// result.memoizedState = baseState;
	return result;
};
