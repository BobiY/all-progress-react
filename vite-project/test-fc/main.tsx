import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

window.a1 = 0;
window.a2 = 0;
function App() {
	const [num, setNum] = useState(100);

	const arr =
		num % 2 === 0
			? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
			: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];
	return (
		<div
			onClick={(e) => {
				console.log('e', e);
				e.stopPropagation();
				// debugger;
				setNum(num + 1);
			}}
		>
			{arr}
		</div>
	);
}

function A1(params: type) {
	window.a1++;
	return <span>a1</span>;
}

function A2(params: type) {
	return <span>a2</span>;
}

// debugger;
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
