import { FiberRootNode } from './fiber';
/**
 * File: fiberLanes.ts
 * Created Date: 2023-04-05 17:00:30
 * Author: yao
 * Last Modified: 2023-04-05 22:06:04
 * describe：Lane 模型，二进制位，代表优先级
 */

export type Lane = number;
export type Lanes = number;

export const SyncLane = 0b0001;
export const NoLane = 0b0000;
export const NoLanes = 0b0000;

export function mergeLanes(laneA: Lane, laneB: Lane): Lanes {
	return laneA | laneB;
}

export function requestUpdateLane() {
	return SyncLane;
}

// 获取优先级最高的 lane
// lane 越小，优先级越高
export function getHighestProiorityLane(lanes: Lanes): Lane {
	return lanes & -lanes;
}

export function markRootFinished(root: FiberRootNode, lane: Lane) {
	root.pendingLanes &= ~lane;
}
