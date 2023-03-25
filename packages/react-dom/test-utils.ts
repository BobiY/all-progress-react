import { ReactElementType } from 'shared/ReactTypes';
// @ts-ignore
import { createRoot } from 'react-dom';
/**
 * File: test-utils.ts
 * Created Date: 2023-03-25 10:37:53
 * Author: yao
 * Last Modified: 2023-03-25 11:14:54
 * describe：react 的测试工具
 */

export function renderIntoDocument(element: ReactElementType) {
	const div = document.createElement('div');

	return createRoot(div).render(element);
}
