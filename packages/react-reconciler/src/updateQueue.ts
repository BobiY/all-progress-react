/**
 * File: updateQueue.ts
 * Created Date: 2023-02-21 21:20:15
 * Author: yao
 * Last Modified: 2023-03-21 23:13:38
 * describe：
 */

import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';

export interface Update<State> {
	action: Action<State>;
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}

// 创建更新的数据结构(实例)
export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return {
		action
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
	updateQueue.shared.pending = update;
};

// 消费 update 的方法
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState
	};
	if (pendingUpdate !== null) {
		const action = pendingUpdate.action;
		if (action instanceof Function) {
			// baseState = 2  pendingUpdate = (x) => 4x => memoizedState = 4
			result.memoizedState = action(baseState);
		} else {
			// baseState = 1  pendingUpdate 2 => memoizedState 2
			result.memoizedState = action;
		}
	}

	return result;
};
