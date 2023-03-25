/**
 * File: babel.config.js
 * Created Date: 2023-03-25 11:08:47
 * Author: yao
 * Last Modified: 2023-03-25 11:09:48
 * describe：
 */

module.exports = {
	presets: ['@babel/preset-env'],
	plugins: [['@babel/plugin-transform-react-jsx', { throwIfNamespace: true }]]
};
