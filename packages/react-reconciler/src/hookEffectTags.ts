/**
 * File: hookEffectTags.ts
 * Created Date: 2023-04-12 22:10:06
 * Author: yao
 * Last Modified: 2023-04-12 22:18:52
 * describe：
 */

export const Passive = 0b0010; //代指 useEffect 对应的 effect

export const HookHasEffect = 0b0001; // 代表当前 effect 本次更新存在副作用
