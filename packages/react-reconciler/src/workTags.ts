/**
 * File: workTags.ts
 * Created Date: 2023-02-21 20:35:35
 * Author: yao
 * Last Modified: 2023-04-05 16:01:34
 * describe：节点类型定义
 */

export type workTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText
	| typeof Fragment;

// 函数组件
export const FunctionComponent = 0;

// 根节点
export const HostRoot = 3;

// <div>
export const HostComponent = 5;

// <div>123</div> ==》 123 的类型
export const HostText = 6;

// Fragment
export const Fragment = 7; // FiberNode.tag 属性
