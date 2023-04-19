import { scheduleMicroTask } from './../../react-dom/src/hostConfig';
import {
	Lane,
	getHighestProiorityLane,
	mergeLanes,
	NoLane,
	SyncLane,
	markRootFinished
} from './fiberLanes';
import { MutationMask, NoFlages, PassiveMask } from './fiberFlags';
import { HostRoot } from './workTags';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import {
	FiberNode,
	FiberRootNode,
	createWorkInProcess,
	PendingPassiveEffects
} from './fiber';
import {
	commitHookEffectListCreate,
	commitHookEffectListDestroy,
	commitHookEffectListUnmount,
	commitMutationEffects
} from './commitWork';
import { flushSyncCallbacks, scheduleSyncCallback } from './synctTaskQueue';
import {
	unstable_scheduleCallback as scheduleCallback, // 用于调度回调函数
	unstable_NormalPriority as NormalPriority // 用于调度的优先级，普通
} from 'scheduler';
import { HookHasEffect, Passive } from './hookEffectTags';
/**
 * File: workLoop.ts
 * Created Date: 2023-02-21 21:04:39
 * Author: yao
 * Last Modified: 2023-04-18 22:56:54
 * describe：
 */
let workInProgress: FiberNode | null = null; // 正在比较的 fiber Node
let wipRootRenderLane: Lane = NoLane;

let rootDoseHasPassiveEffects = false;

// 创建一个当前正在处理的节点（旧的节点就是 这个节点的 alternate）
// rootFiber
function prepareFreshStack(rootFiber: FiberRootNode, lane: Lane) {
	// workInProgress 是 hostRootFiber 的复制品
	workInProgress = createWorkInProcess(rootFiber.current, {});
	wipRootRenderLane = lane;
}
// 从根节点开始遍历整个 fiber 树 传入 fiber 开始更新
export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
	// 调度功能伏笔
	// 先拿到根节点 FiberRootNode
	const root = markUpdateFromFiberToRoot(fiber);
	markRootUpdated(root, lane);
	ensureRootIsScheduled(root);
	// performSyncWorkOnRoot(root);
}
//  schedule 阶段的入口
function ensureRootIsScheduled(root: FiberRootNode) {
	const updateLane = getHighestProiorityLane(root.pendingLanes);
	if (updateLane === NoLane) {
		// 代表当前没有更新
		return;
	}
	if (updateLane === SyncLane) {
		// 同步优先级，用微任务调度
		if (__DEV__) {
			console.log('在微任务中调度，优先级为', updateLane);
		}
		// 加入任务队列
		console.log('scheduleMicroTask', scheduleMicroTask);

		scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane));
		// 使用微任务刷新任务队列
		scheduleMicroTask(flushSyncCallbacks);
	} else {
		// 其他的优先级 用宏任务调度
	}
}

function markRootUpdated(root: FiberRootNode, lane: Lane) {
	root.pendingLanes = mergeLanes(root.pendingLanes, lane);
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = parent.return;
	}
	if (node.tag === HostRoot) {
		return node.stateNode; // fiberRootNode.current <=> hostRootFiberNode.stateNode <=> fiberRootNode
	}
	return null;
}

// 同步调度更新
function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
	const nextLane = getHighestProiorityLane(root.pendingLanes);

	if (nextLane !== SyncLane) {
		// 其他比 SyncLane 低的优先级
		// NoLane
		// 以上的两种优先级说明不应该走同步更新
		ensureRootIsScheduled(root);
		return;
	}
	if (__DEV__) {
		console.warn('render 阶段开始');
	}
	// 初始化
	prepareFreshStack(root, lane);

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
	// render 阶段结束
	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;
	root.finishedLane = lane;
	wipRootRenderLane = NoLane;

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
	const lane = root.finishedLane;
	if (lane === NoLane && __DEV__) {
		console.error('commit 阶段 finishedLane 不应该是 NoLane');
	}
	// 重置
	root.finishedWork = null;
	root.finishedLane = NoLane;
	markRootFinished(root, lane);

	if (
		(finishedWork.flags & PassiveMask) !== NoFlages ||
		(finishedWork.subtreeFlags & PassiveMask) !== NoFlages
	) {
		// 说明函数组件中存在的需要执行的 useEffect 副作用
		if (!rootDoseHasPassiveEffects) {
			// 防止对次执行副作用
			rootDoseHasPassiveEffects = true;
			// 调度副作用
			scheduleCallback(NormalPriority, () => {
				// 执行副作用
				flushPassiveEffect(root.pendingPassiveEffects);
				return;
			});
		}
	}

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
		commitMutationEffects(finishedWork, root);
		// layout 阶段
	} else {
		// 不存在对应的操作
		root.current = finishedWork;
	}

	rootDoseHasPassiveEffects = false;
	ensureRootIsScheduled(root);
}

function workLoop() {
	while (workInProgress !== null) {
		preformUnitOfWork(workInProgress);
	}
}

function preformUnitOfWork(fiber: FiberNode) {
	// next 是当前 fiber 的子节点
	const next = beginWork(fiber, wipRootRenderLane);

	// 将计算后的 props 储存
	fiber.memoizedProps = fiber.pendingProps;
	// next 为 null 时，表明 DFS 走到了叶子节点（也就是到头了）
	if (next === null) {
		completeUnitOfWork(fiber); // 按照现在的逻辑，每切换一次 workInProgress 就会重新循环一次，
	} else {
		workInProgress = next;
	}
}

function flushPassiveEffect(pendingPassiveEffects: PendingPassiveEffects) {
	pendingPassiveEffects.unmount.forEach((effect) => {
		commitHookEffectListUnmount(Passive, effect);
	});

	pendingPassiveEffects.unmount = [];

	pendingPassiveEffects.update.forEach((effect) => {
		commitHookEffectListDestroy(Passive | HookHasEffect, effect);
	});

	pendingPassiveEffects.update.forEach((effect) => {
		commitHookEffectListCreate(Passive | HookHasEffect, effect);
	});

	pendingPassiveEffects.update = [];
	flushSyncCallbacks();
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
