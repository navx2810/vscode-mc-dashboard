import React from 'react';
import vscode from './utils/vscode';

const App: React.FC = () => {
	const handleClick = () => {
		vscode.emit('app:start', { msg: 'Greetings User' });
	};
	return (
		<div className="App">
			<header className="App-header">
				<p>
					Edit <code>src/App.tsx</code> and save to reload.
				</p>
				<a
					className="App-link"
					href="https://reactjs.org"
					target="_blank"
					rel="noopener noreferrer"
				>
					Learn React
				</a>
				<div>
					<button onClick={handleClick}>Test Submission</button>
				</div>
			</header>
		</div>
	);
};

export default App;
