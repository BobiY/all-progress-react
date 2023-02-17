/**
 * File: ReactSymbols.ts
 * Created Date: 2023-02-16 20:48:23
 * Author: yao
 * Last Modified: 2023-02-16 20:51:44
 * describe：防止滥用 $$typeof 字段，将其设置为独一无二的值
 */
const supportSymbol = typeof Symbol == 'function' && Symbol.for;

export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for('react.element')
	: 0xeac7;
