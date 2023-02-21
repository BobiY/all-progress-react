/**
 * File: react.config.js
 * Created Date: 2023-02-20 19:38:19
 * Author: yao
 * Last Modified: 2023-02-20 20:19:00
 * describe：
 */
import { getPackageJSON, resolvePkgPath, getBaseRollupPlugin } from "./utils";
import packageJson from "rollup-plugin-generate-package-json";

const { name, module } = getPackageJSON('react')

// react 包的路径
const pkgPath = resolvePkgPath(name)

// react 产物的路径
const pkgDistPath = resolvePkgPath(name, true)

export default [
    // react 包
    {
        input: `${pkgPath}/${module}`,
        output: {
            file: `${pkgDistPath}/index.js`,
            name: 'index.js',
            format: 'umd'
        },
        plugins: [
            ...getBaseRollupPlugin(),
            packageJson({
                inputFolder: pkgPath,
                outputFolder: pkgDistPath,
                baseContents:({name, description, version}) => {
                    return {
                        name,
                        description,
                        version,
                        main: 'index.js'
                    }
                }
            })
        ]
    },
    {
        input: `${pkgPath}/src/jsx.ts`,
        output:[
            // jsx-runtime
            {
                file: `${pkgDistPath}/jsx-runtime.js`,
                name: 'jsx-runtime.js',
                format: 'umd'
            },
            // jsx-devr-untime
            {
                file: `${pkgDistPath}/jsx-dev-runtime.js`,
                name: 'jsx-dev-runtime.js',
                format: 'umd'
            },
        ],
        plugins: [
            ...getBaseRollupPlugin()
        ]
    }
]