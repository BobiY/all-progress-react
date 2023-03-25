import { Placement } from './fiberFlags';
import { HostText } from './workTags';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, createFiberFromElement } from './fiber';
/**
 * File: chilFbers.ts
 * Created Date: 2023-02-26 20:31:14
 * Author: yao
 * Last Modified: 2023-03-22 20:03:39
 * describe：
 */

function ChildReconciler(shouldTrackEffects: boolean) {
	// 根据 React Element 创建 fiber，并为 fiber 链接 父 fiber
	function reconcilerSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		// 根据 React Element 创建 fiber
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		// fiber.alternate = currentFiber; // 为什么不做这一步的链接
		return fiber;
	}

	function reconcilerSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		// 根据element 创建 fiber
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	}
	// 给 fiber 打上更新标记
	function placeSingleChild(fiber: FiberNode) {
		// update 时 shouldTrackEffects 为 true
		if (shouldTrackEffects && fiber.alternate === null) {
			// 首屏渲染的情况
			fiber.flags |= Placement;
		}
		return fiber;
	}

	return function reconcileChildFibers(
		returnFiber: FiberNode, // 父节点
		currentFiber: FiberNode | null, // 现在的 子 fiber
		newChild?: ReactElementType // 新的 子 fiber
	) {
		// 判断当前 fiber 的类型
		// 非 文本的 子节点
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcilerSingleElement(returnFiber, currentFiber, newChild)
					);

				default:
					if (__DEV__) {
						console.warn('未实现的 reconciler 类型', newChild);
					}
					break;
			}
		}
		// todo 多节点的情况  ul> li *3  暂时不处理

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcilerSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

		return null;
	};
}

export const reconcilerChildFibers = ChildReconciler(true); // 追踪副作用
export const mountChildFibers = ChildReconciler(false); // 不追踪副作用
