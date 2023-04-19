import { REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import { Key, Props } from 'shared/ReactTypes';
import { ChildDeletion, Placement } from './fiberFlags';
import { HostText, Fragment } from './workTags';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { ReactElementType } from 'shared/ReactTypes';
import {
	FiberNode,
	createFiberFromElement,
	createFiberFromFragment,
	createWorkInProcess
} from './fiber';
/**
 * File: chilFbers.ts
 * Created Date: 2023-02-26 20:31:14
 * Author: yao
 * Last Modified: 2023-04-10 22:30:18
 * describe：
 */

type ExistingChildren = Map<string | number, FiberNode>;

function ChildReconciler(shouldTrackEffects: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) {
			// mount
			return;
		}
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];

			returnFiber.flags |= ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	}

	function deleteRemainingChildren(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null
	) {
		if (!shouldTrackEffects) {
			return;
		}

		let childToDelete = currentFirstChild;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
	}

	// 根据 React Element 创建 fiber，并为 fiber 链接 父 fiber
	function reconcilerSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		const key = element.key;
		while (currentFiber !== null) {
			// update
			if (currentFiber.key === key) {
				// key 相同
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (element.type === currentFiber.type) {
						let props = element.props;
						if (element.type === REACT_FRAGMENT_TYPE) {
							props = element.props.children;
						}
						// type 相同
						console.log('存在复用，复用的节点为', element);
						// update 走到这里时，才存在 al 属性值
						const existing = userFiber(currentFiber, props);
						existing.return = returnFiber;
						// 当前节点可复用，标记剩下的节点删除
						deleteRemainingChildren(returnFiber, currentFiber.sibling);
						return existing;
					}
					// 删除旧的节点 key 相同 type 不同，删除旧的节点
					deleteRemainingChildren(returnFiber, currentFiber);
					break;
				} else {
					if (__DEV__) {
						console.warn('还未实现的 react 类型', element);
						break;
					}
				}
			} else {
				// key 不同 删除旧的节点
				deleteChild(returnFiber, currentFiber);
				currentFiber = currentFiber.sibling;
			}
		}
		// 根据 React Element 创建 fiber
		let fiber;
		if (element.type === REACT_FRAGMENT_TYPE) {
			fiber = createFiberFromFragment(
				element.props.children,
				element.props.key
			);
		} else {
			fiber = createFiberFromElement(element);
		}
		fiber.return = returnFiber;
		// fiber.alternate = currentFiber; // 为什么不做这一步的链接
		return fiber;
	}

	function reconcilerSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		while (currentFiber !== null) {
			// update
			if (currentFiber.tag === HostText) {
				// 类型没变，可以复用
				const existing = userFiber(currentFiber, { content });
				existing.return = returnFiber;
				deleteRemainingChildren(returnFiber, currentFiber.sibling);
				return existing;
			}
			deleteChild(returnFiber, currentFiber);
			currentFiber = currentFiber.sibling;
		}
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

	function reconcileChildrenArray(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: any[]
	) {
		// 最后一个可复用的fiber 在current 中的 index
		let lastPlacedIndex = 0;
		// 创建的最后一个 Fiber
		let lastNewFiber: FiberNode | null = null;
		// 创建的第一个 Fiber
		let firstNewFiber: FiberNode | null = null;

		// 1. 将 current 保存在 map 中
		const existingChildren: ExistingChildren = new Map();
		// current 是一个 FiberNode 链表
		// newChild 是一个 React Element 数组
		let current = currentFirstChild;
		while (current !== null) {
			const keyToUse = current.key !== null ? current.key : current.index;
			existingChildren.set(keyToUse, current);
			current = current.sibling;
		}

		for (let i = 0; i < newChild.length; i++) {
			// 2. 遍历 newChild，寻找是否课复用
			const after = newChild[i];
			const newFiber = updateFromMap(returnFiber, existingChildren, i, after);

			// 更新以后的值是 null，不论更新前是什么值，更新后是 null，false 等的值是就是 null
			if (newFiber === null) {
				continue;
			}
			// 3. 标记移动还是插入是 移动指的是向右移动
			newFiber.index = i;
			newFiber.return = returnFiber;
			if (lastNewFiber === null) {
				lastNewFiber = newFiber;
				firstNewFiber = newFiber;
			} else {
				lastNewFiber.sibling = newFiber;
				// 完成了兄弟 fiber 链接
				lastNewFiber = lastNewFiber.sibling;
			}

			if (!shouldTrackEffects) {
				continue;
			}

			const current = newFiber.alternate;
			if (current !== null) {
				const oldIndex = current.index;
				if (oldIndex < lastPlacedIndex) {
					newFiber.flags |= Placement; // 标记移动
					continue;
				} else {
					// 不移动
					lastPlacedIndex = oldIndex;
				}
			} else {
				// mount
				newFiber.flags |= Placement; // 标记插入
			}
		}
		// 4. 不可复用的旧节点标记为删除
		existingChildren.forEach((fiber) => {
			deleteChild(returnFiber, fiber);
		});

		return firstNewFiber;
	}

	function updateFromMap(
		returnFiber: FiberNode,
		existingChildren: ExistingChildren,
		index: number,
		element: any
	): FiberNode | null {
		const keyToUse = element.key !== null ? element.key : element.index;
		const before = existingChildren.get(keyToUse);
		// HostText
		if (typeof element === 'string' || typeof element === 'number') {
			if (before) {
				if (before.tag === HostText) {
					// 表示更新之前也是 HostText 可以复用
					existingChildren.delete(keyToUse);
					return userFiber(before, { content: element + '' });
				}
			}
			// 表示不能复用，创建一个新的 HostText 节点
			return new FiberNode(HostText, { content: element + '' }, null);
		}
		// ReactElement
		if (typeof element === 'object' && element !== null) {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					if (element.type === REACT_FRAGMENT_TYPE) {
						// fragment
						return updateFragment(
							returnFiber,
							before,
							element,
							keyToUse,
							existingChildren
						);
					}
					if (before) {
						if (before.type === element.type) {
							// 表示 key 相同，type 相同 可以复用
							existingChildren.delete(keyToUse);

							return userFiber(before, element.props);
						}
					}
					// 如果不能复用，则创建新的 fiber
					return createFiberFromElement(element);

				default:
					break;
			}

			// TODO element 是数组类型 [<li></li>,<li></li>]
			if (Array.isArray(element)) {
				if (__DEV__) {
					console.warn('element 是数组，还未实现', element);
				}
			}
		}

		// element 是数组
		if (Array.isArray(element)) {
			return updateFragment(
				returnFiber,
				before,
				element,
				keyToUse,
				existingChildren
			);
		}
		return null;
	}

	return function reconcileChildFibers(
		returnFiber: FiberNode, // 父节点
		currentFiber: FiberNode | null, // 现在的 子 fiber
		newChild?: any // 新的 子 fiber
	) {
		// 判断 Fragment
		const isUnkeyedTopLevelFragment =
			typeof newChild === 'object' &&
			newChild !== null &&
			newChild.type === REACT_FRAGMENT_TYPE &&
			newChild.key === null;
		if (isUnkeyedTopLevelFragment) {
			// 这里将 Fragment 变为了数组
			newChild = newChild.props.children;
		}
		// 判断当前 fiber 的类型
		// 非 文本的 子节点
		if (typeof newChild === 'object' && newChild !== null) {
			// todo 多节点的情况  ul> li *3  暂时不处理
			if (Array.isArray(newChild)) {
				return reconcileChildrenArray(returnFiber, currentFiber, newChild);
			}
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

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcilerSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}
		// 兜底情况，进入此情况就标记为删除
		if (currentFiber !== null) {
			deleteRemainingChildren(returnFiber, currentFiber);
		}

		if (__DEV__) {
			console.warn('未实现的 reconciler 类型', newChild);
		}

		return null;
	};
}

// 处理复用
function userFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	const clone = createWorkInProcess(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
}

function updateFragment(
	returnFiber: FiberNode,
	current: FiberNode | undefined,
	elements: any[],
	key: Key,
	existingChildren: ExistingChildren
) {
	let fiber;
	if (!current || current.tag !== Fragment) {
		fiber = createFiberFromFragment(elements, key);
	} else {
		existingChildren.delete(key);
		fiber = userFiber(current, elements);
	}
	fiber.return = returnFiber;
	return fiber;
}

export const reconcilerChildFibers = ChildReconciler(true); // 追踪副作用
export const mountChildFibers = ChildReconciler(false); // 不追踪副作用
