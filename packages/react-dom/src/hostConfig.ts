/**
 * File: hostConfig.ts
 * Created Date: 2023-02-22 19:51:55
 * Author: yao
 * Last Modified: 2023-03-20 21:56:56
 * describe：暂时的宿主环境节点的类型定义
 */

export type Container = Element;
export type Instance = Element;

export const createInstance = (type: string, props: any): Instance => {
	// todo 处理 props
	const element = document.createElement(type);

	return element;
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

export const appendChildToContainer = appendInitalChild;
