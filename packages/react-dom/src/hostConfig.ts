import { Props } from 'shared/ReactTypes';
import { HostText } from './../../react-reconciler/src/workTags';
import { FiberNode } from './../../react-reconciler/src/fiber';
import { updateFiberProps, DOMElement } from './syntheticEvent';
/**
 * File: hostConfig.ts
 * Created Date: 2023-02-22 19:51:55
 * Author: yao
 * Last Modified: 2023-04-05 18:09:44
 * describe：暂时的宿主环境节点的类型定义
 */

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (type: string, props: Props): Instance => {
	// todo 处理 props
	const element = document.createElement(type) as unknown;

	// 将 props 保存在 dom 元素上
	updateFiberProps(element as DOMElement, props);
	return element as DOMElement;
};

export const appendInitalChild = (
	parent: Instance | Container,
	child: Instance
) => {
	parent.appendChild(child);
};

export const createTextInstance = (content: string) => {
	return document.createTextNode(content);
};

export function commitUpdate(fiber: FiberNode) {
	switch (fiber.tag) {
		case HostText:
			const text = fiber.memoizedProps.content;

			return commitTextUpdate(fiber.stateNode, text);

		default:
			if (__DEV__) {
				console.warn('未实现的Update 类型');
			}
			break;
	}
}

export function commitTextUpdate(textInstance: TextInstance, content: string) {
	textInstance.textContent = content;
}

export function removeChild(
	child: Instance | TextInstance,
	container: Instance
) {
	container.removeChild(child);
}

export function insertChildToContainer(
	child: Instance,
	container: Container,
	before: Instance
) {
	container.insertBefore(child, before);
}

export const appendChildToContainer = appendInitalChild;

export const scheduleMicroTask =
	typeof queueMicrotask === 'function'
		? queueMicrotask
		: typeof Promise === 'function'
		? (callback: (...args: any) => void) => Promise.resolve(null).then(callback)
		: setTimeout;
