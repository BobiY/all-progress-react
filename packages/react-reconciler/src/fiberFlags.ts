/**
 * File: fiberFlags.ts
 * Created Date: 2023-02-21 20:55:40
 * Author: yao
 * Last Modified: 2023-04-12 22:19:35
 * describe：fiber 的 DOM 操作标记
 */
export type Flags = number;
export const NoFlages = 0b00000000;
export const Placement = 0b0000001;
export const Update = 0b0000010;
export const ChildDeletion = 0b0000100;

export const PassiveEffect = 0b0001000; // 代表当前 fiber 本次更新存在副作用

export const MutationMask = Placement | Update | ChildDeletion;

export const PassiveMask = PassiveEffect | ChildDeletion;
