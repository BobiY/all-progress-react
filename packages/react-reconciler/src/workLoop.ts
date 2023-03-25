import { MutationMask, NoFlages } from './fiberFlags';
import { HostRoot } from './workTags';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { FiberNode, FiberRootNode, createWorkInProcess } from './fiber';
import { commitMutationEffects } from './commitWork';
/**
 * File: workLoop.ts
 * Created Date: 2023-02-21 21:04:39
 * Author: yao
 * Last Modified: 2023-03-22 20:24:40
 * describe：
 */
let workInProgress: FiberNode | null = null; // 正在比较的 fiber Node

// 创建一个当前正在处理的节点（旧的节点就是 这个节点的 alternate）
function prepareFreshStack(rootFiber: FiberRootNode) {
	workInProgress = createWorkInProcess(rootFiber.current, {});
}
// 从根节点开始遍历整个 fiber 树 传入 fiber 开始更新
export function scheduleUpdateOnFiber(fiber: FiberNode) {
	// 调度功能伏笔
	// 先拿到 fiber root node
	const root = markUpdateFromFiberToRoot(fiber);
	renderRoot(root);
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = parent.return;
	}
	if (node.tag === HostRoot) {
		return node.stateNode; // fiberRootNode.current <=> hostRootFiberNode
	}
	return null;
}

// 从根节点开始更新
function renderRoot(root: FiberRootNode) {
	// 初始化
	prepareFreshStack(root);

	do {
		try {
			workLoop();
			break;
		} catch (error) {
			if (__DEV__) {
				console.error('workLoop 发生错误', error);
			}

			workInProgress = null;
		}
	} while (true);

	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;

	// wip fiberNode 树 树中的 flags
	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork;

	if (finishedWork == null) {
		return;
	}

	if (__DEV__) {
		console.warn('commit 阶段开始', finishedWork);
	}
	// 重置
	root.finishedWork = null;

	// 判断是否存在 3 个子阶段需要执行的操作
	// root flges  root subtreeFlags

	// root subtreeFlags
	const subtreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlages;

	// root flges
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlages;

	if (subtreeHasEffect || rootHasEffect) {
		// 双缓存切换的 current 切换
		root.current = finishedWork;
		// beforeMutation 阶段
		// debugger;
		// Mutation 阶段 Placement 对应的操作
		commitMutationEffects(finishedWork);
		// layout 阶段
	} else {
		// 不存在对应的操作
		root.current = finishedWork;
	}
}

function workLoop() {
	while (workInProgress !== null) {
		preformUnitOfWork(workInProgress);
	}
}

function preformUnitOfWork(fiber: FiberNode) {
	// next 是当前 fiber 的子节点
	const next = beginWork(fiber);

	// 将计算后的 props 储存
	fiber.memoizedProps = fiber.pendingProps;
	// next 为 null 时，表明 DFS 走到了叶子节点（也就是到头了）
	if (next === null) {
		completeUnitOfWork(fiber); // 按照现在的逻辑，每切换一次 workInProgress 就会重新循环一次，
	} else {
		workInProgress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;

	do {
		completeWork(node);
		const sibling = node.sibling;
		if (sibling !== null) {
			// 存在兄弟，则对兄弟执行 beginWork
			workInProgress = sibling;
			return;
		}
		// 如果各级都不存在父节点，则一路向上，直到 hostRootFiber
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}
