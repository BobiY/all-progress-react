import { Container } from 'hostConfig';
import { Props } from './../../shared/ReactTypes';
/**
 * File: syntheticEvent.ts
 * Created Date: 2023-03-26 15:32:28
 * Author: yao
 * Last Modified: 2023-03-29 14:21:13
 * describe：合成事件相关实现
 */

export const elementPropKey = '__yao__props__';
const validEventTypeList = ['click'];

type EventCallback = (e: Event) => void;

interface SyntheticEvent extends Event {
	__stopPropagation: boolean;
}

interface Paths {
	capture: EventCallback[];
	bubble: EventCallback[];
}

export interface DOMElement extends Element {
	[elementPropKey]: Props;
}

// dom[xxx] = react Element Props
export function updateFiberProps(node: DOMElement, props: Props) {
	node[elementPropKey] = props;
}

export function initEvent(container: Container, eventType: string) {
	if (!validEventTypeList.includes(eventType)) {
		console.warn('当前不支持的event type', event);
	}

	if (__DEV__) {
		console.log('初始化事件：', eventType);
	}

	container.addEventListener(eventType, (e) => {
		dispatchEvent(container, eventType, e);
	});
}

function dispatchEvent(container: Container, eventType: string, e: Event) {
	// todo 遍历 captue 事件捕获阶段
	// todo 遍历 bubble 事件冒泡阶段
	const targetElement = e.target;
	if (targetElement === null) {
		console.warn('事件不存在 target', e);
		return;
	}

	// 1. 收集沿途的事件
	const { bubble, capture } = collectPaths(
		targetElement as DOMElement,
		container,
		eventType
	);

	// 2. 构造合成事件
	const se = createSyntheticEvent(e);

	// 3. 遍历 captue 事件捕获阶段
	triggerEventFlow(capture, se);

	if (!se.__stopPropagation) {
		// 4. 遍历 bubble 事件冒泡阶段
		triggerEventFlow(bubble, se);
	}
}

function triggerEventFlow(paths: EventCallback[], se: SyntheticEvent) {
	for (let i = 0; i < paths.length; i++) {
		const callback = paths[i];
		callback.call(null, se);

		if (se.__stopPropagation) {
			// 阻止冒泡
			break;
		}
	}
}

function getEventCallbackNameFromEventType(
	eventType: string
): string[] | undefined {
	return {
		click: ['onClickCapture', 'onClick']
	}[eventType];
}

function createSyntheticEvent(e: Event) {
	const synrheticEvent = e as SyntheticEvent;
	synrheticEvent.__stopPropagation = false;
	const originStopPropagayion = e.stopPropagation;

	synrheticEvent.stopPropagation = () => {
		synrheticEvent.__stopPropagation = true;
		if (originStopPropagayion) {
			originStopPropagayion.call(e);
		}
	};

	return synrheticEvent;
}

function collectPaths(
	targetElement: DOMElement,
	container: Container,
	eventType: string
) {
	const paths: Paths = {
		capture: [],
		bubble: []
	};

	while (targetElement && targetElement !== container) {
		// 收集的过程
		const elementProps = targetElement[elementPropKey];
		if (elementProps) {
			// click -> onClick onClickCapture
			const callbackNameList = getEventCallbackNameFromEventType(eventType);
			if (callbackNameList) {
				callbackNameList.forEach((callbackName, i) => {
					const eventCallback = elementProps[callbackName];
					if (eventCallback) {
						if (i === 0) {
							// 捕获阶段
							paths.capture.unshift(eventCallback);
						} else {
							// 冒泡阶段
							paths.bubble.push(eventCallback);
						}
					}
				});
			}
		}
		targetElement = targetElement.parentNode as DOMElement;
	}

	return paths;
}
