/**
 * File: react.config.js
 * Created Date: 2023-02-20 19:38:19
 * Author: yao
 * Last Modified: 2023-03-25 10:47:00
 * describe：
 */
import { getPackageJSON, resolvePkgPath, getBaseRollupPlugin } from './utils';
import packageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';
const { name, module, peerDependencies } = getPackageJSON('react-dom');

// react 包的路径
const pkgPath = resolvePkgPath(name);

// react 产物的路径
const pkgDistPath = resolvePkgPath(name, true);

export default [
	// react 包
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				file: `${pkgDistPath}/index.js`,
				name: 'reactDOM',
				format: 'umd'
			},
			{
				file: `${pkgDistPath}/client.js`,
				name: 'reactDOM',
				format: 'umd'
			},
			{
				file: `${pkgDistPath}/test-utils.js`,
				name: 'testUtils',
				format: 'umd'
			}
		],
		external: [...Object.keys(peerDependencies)],
		plugins: [
			...getBaseRollupPlugin(),
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/hostConfig.ts`
				}
			}),
			packageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => {
					return {
						name,
						description,
						version,
						peerDependencies: {
							react: version
						},
						main: 'index.js'
					};
				}
			})
		]
	},
	{
		input: `${pkgPath}/test-utils.ts`,
		output: [
			{
				file: `${pkgDistPath}/test-utils.js`,
				name: 'testUtils',
				format: 'umd'
			}
		],
		external: ['react-dom', 'react'],
		plugins: [
			...getBaseRollupPlugin(),
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/hostConfig.ts`
				}
			})
		]
	}
];
