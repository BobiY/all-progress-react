/**
 * File: ReactTypes.ts
 * Created Date: 2023-02-16 20:56:36
 * Author: yao
 * Last Modified: 2023-02-22 19:33:22
 * describe： React Element 类型定义文件
 */

export type Type = any;
export type Key = any;
export type Ref = any;
export type Props = any;
export type ElementType = any;

export interface ReactElementType {
	$$typeof: symbol | number;
	type: ElementType;
	key: Key;
	ref: Ref;
	props: Props;
	__mark: string;
}

// this.setState({xxx}) or this.setState((state) => state)
export type Action<State> = State | ((prevState: State) => State);
