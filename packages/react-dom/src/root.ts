/**
 * File: root.ts
 * Created Date: 2023-03-20 21:28:39
 * Author: yao
 * Last Modified: 2023-03-26 16:16:36
 * describe：
 */

import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/fiberReconciler';
import { ReactElementType } from 'shared/ReactTypes';
import { Container } from './hostConfig';
import { initEvent } from './syntheticEvent';
export function createRoot(container: Container) {
	const root = createContainer(container);

	return {
		render(element: ReactElementType) {
			initEvent(container, 'click');
			return updateContainer(element, root);
		}
	};
}
