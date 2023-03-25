/**
 * File: jest.config.js
 * Created Date: 2023-03-25 10:51:43
 * Author: yao
 * Last Modified: 2023-03-25 10:54:14
 * describe：
 */

const { defaults } = require('jest-config');

module.exports = {
	...defaults,
	rootDir: process.cwd(),
	modulePathIgnorePatterns: ['<rootDir>/.history'],
	moduleDirectories: [
		// 对于 react 和 reactdom
		'dist/node_modules',
		// 对于第三方依赖
		...defaults.moduleDirectories
	],
	testEnvironment: 'jsdom'
};
