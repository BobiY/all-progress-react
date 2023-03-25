import { Action } from '../../shared/ReactTypes';
/**
 * File: currentDispatcher.ts
 * Created Date: 2023-03-21 22:23:54
 * Author: yao
 * Last Modified: 2023-03-21 22:37:28
 * describe：当前使用的 hooks 的集合
 */

export interface Dispatcher {
	useState: <T>(initalState: (() => T) | T) => [T, Dispatch<T>];
}

export type Dispatch<State> = (action: Action<State>) => void;

const currentDispatcher: { current: Dispatcher | null } = {
	current: null
};

export const resolveDispatcher = (): Dispatcher => {
	const dispatcher = currentDispatcher.current;

	if (dispatcher === null) {
		throw new Error('hook 只能在函数组件中使用');
	}

	return dispatcher;
};

export default currentDispatcher;
