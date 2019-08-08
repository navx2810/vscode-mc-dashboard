import * as vscode from 'vscode';
import { join } from 'path';
import nonce from './nonce';

let currentPanel: vscode.WebviewPanel = null;
const directory_prefix = 'out/app';

function AppHTML(appName: string = 'React App'): string {
	const manifest = require(join(
		this._extensionPath,
		directory_prefix,
		'asset-manifest.json'
	));
	const mainScript = manifest['main.js'];
	const mainStyle = manifest['main.css'];
	const scriptPathOnDisk = vscode.Uri.file(
		join(this._extensionPath, directory_prefix, mainScript)
	);
	const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
	const stylePathOnDisk = vscode.Uri.file(
		join(this._extensionPath, directory_prefix, mainStyle)
	);
	const styleUri = stylePathOnDisk.with({ scheme: 'vscode-resource' });
	const id = nonce();

	return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
				<title>${appName}</title>
				<link rel="stylesheet" type="text/css" href="${styleUri}">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${id}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
				<base href="${vscode.Uri.file(join(this._extensionPath, 'build')).with({
					scheme: 'vscode-resource',
				})}/">
			</head>
			<body>
				<noscript>You need to enable JavaScript to run this app.</noscript>
				<div id="root"></div>
				<script nonce="${id}" src="${scriptUri}"></script>
			</body>
			</html>`;
}

function createReactPanel(
	extensionPath: string,
	appName: string,
	column: vscode.ViewColumn
): vscode.WebviewPanel {
	const panel = vscode.window.createWebviewPanel('react', appName, column, {
		enableScripts: true,
		enableCommandUris: true,
		localResourceRoots: [
			vscode.Uri.file(join(extensionPath, directory_prefix)),
		],
	});

	// todo: set the icon path.
	// panel.iconPath

	panel.webview.html = AppHTML(appName);

	return panel;
}

export default function(
	ctx: vscode.ExtensionContext,
	appName: string = 'React App'
) {
	const column = vscode.window.activeTextEditor
		? vscode.window.activeTextEditor.viewColumn
		: null;
	if (currentPanel === null) {
		currentPanel = createReactPanel(ctx.extensionPath, appName, column);
	} else {
		currentPanel.reveal(column);
	}
}
