import { jsx, jsxDEV, isValidElement as isValidElementFun } from './src/jsx';
import { Dispatcher, resolveDispatcher } from './src/currentDispatcher';
import currentDispatcher from './src/currentDispatcher';
/**
 * File: index.ts
 * Created Date: 2023-02-16 20:45:20
 * Author: yao
 * Last Modified: 2023-03-25 11:27:37
 * describe：React 包导出放到
 */
export default {
	version: '0.0.0',
	createElement: jsx
};

export const version = '0.0.0';

// todo s根据环境区分使用 jsx or jsDEV
export const createElement = jsx;

export const isValidElement = isValidElementFun;

export const useState: Dispatcher['useState'] = (initalState) => {
	const dispatcher = resolveDispatcher();

	return dispatcher.useState(initalState);
};

// 内部数据共享层
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};
