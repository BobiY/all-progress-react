/**
 * File: root.ts
 * Created Date: 2023-03-20 21:28:39
 * Author: yao
 * Last Modified: 2023-03-25 11:15:30
 * describe：
 */

import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/fiberReconciler';
import { ReactElementType } from 'shared/ReactTypes';
import { Container } from './hostConfig';
export function createRoot(container: Container) {
	const root = createContainer(container);

	return {
		render(element: ReactElementType) {
			return updateContainer(element, root);
		}
	};
}
