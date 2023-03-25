/**
 * File: dev.config.js
 * Created Date: 2023-03-20 21:11:21
 * Author: yao
 * Last Modified: 2023-03-20 21:12:15
 * describe：
 */

import reactDomConfig from './react-dom.config';
import reactConfig from './react.config';

export default () => {
	return [...reactConfig, ...reactDomConfig];
};
