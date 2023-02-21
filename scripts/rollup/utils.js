/**
 * File: utils.js
 * Created Date: 2023-02-20 19:39:52
 * Author: yao
 * Last Modified: 2023-02-20 20:06:51
 * describe：
 */
import path from "path";
import fs from "fs";
import cjs from "@rollup/plugin-commonjs";
import ts from "rollup-plugin-typescript2";

const pkgPath = path.resolve(__dirname, '../../packages')
const distPath = path.resolve(__dirname, '../../dist/node_modules')

export function resolvePkgPath(pkgName, isDist) {
    if(isDist){
        return `${distPath}/${pkgName}`
    }

    return `${pkgPath}/${pkgName}`
}

export function getPackageJSON(pkgName) {
    // ... 包路径
    const path = `${resolvePkgPath(pkgName)}/package.json`
    const str = fs.readFileSync(path, { encoding: 'utf-8' })
    return JSON.parse(str)
}

// 获取 rollup 的基础代码
export function getBaseRollupPlugin(
    {typescript = {}} = {}
) {
    return [
        cjs(),
        ts(typescript)
    ]   
}