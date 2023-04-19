/**
 * File: synctTaskQueue.ts
 * Created Date: 2023-04-05 18:01:18
 * Author: yao
 * Last Modified: 2023-04-10 21:05:07
 * describe：调用同步任务
 */

let syncQueue: ((...args: any) => void)[] | null = null;
let isFlushingSyncQueue = false;

// 调度同步更新
export function scheduleSyncCallback(callback: (...args: any) => void) {
	if (syncQueue === null) {
		// 需要同步调度的第一个回调函数
		syncQueue = [callback];
	} else {
		syncQueue.push(callback);
	}
}

// 执行同步更新
export function flushSyncCallbacks() {
	if (!isFlushingSyncQueue && syncQueue) {
		isFlushingSyncQueue = true;
		try {
			console.log('running1');
			syncQueue.forEach((callback) => callback());
		} catch (error) {
			if (__DEV__) {
				console.error('flushSyncCallbacks 报错', error);
			}
		} finally {
			isFlushingSyncQueue = false;
			syncQueue = null;
			console.log('running2');
		}
	}
}
