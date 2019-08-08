import * as vscode from 'vscode';
import { join } from 'path';
import nonce from './nonce';

export default class {
	private panel: vscode.WebviewPanel;
	private readonly appPath: string;
	private readonly column: vscode.ViewColumn;
	private disposables: vscode.Disposable[] = [];
	private listeners: { [key: string]: (message: any) => void } = {};

	/**
	 *
	 * @param ctx The extension's context.
	 * @param appName The name of the app that will display on the tab.
	 * @param remainActive A flag to let the application continue running if the tab is inactive.
	 */
	constructor(
		ctx: vscode.ExtensionContext,
		private appName: string = 'React App',
		private remainActive: boolean = false
	) {
		this.column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;
		this.appPath = join(ctx.extensionPath, 'out', 'app');

		if (this.panel) {
			this.panel.reveal();
		} else {
			this.panel = this.initialize();
		}
	}

	/**
	 * Disposes the elements of this pane.
	 */
	public dispose() {
		this.panel.dispose();

		while (this.disposables.length) {
			const disposable = this.disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}

	/**
	 * Register a command to run when the web-app fires an event notifaction.
	 * @param key The command name passed through the client-app.
	 * @param handler The function that is run when the command is executed.
	 */
	public register(key: string, handler: (message: { command: string } & { [key: string]: any }) => void) {
		if (this.listeners[key]) {
			this.throwException(
				`A command was already registered for "${key}".`
			);
		} else {
			this.listeners[key] = handler;
		}
	}

	/**
	 * Sends an event to the client app.
	 * @param command The command name to emit.
	 * @param data The data being sent along to the client.
	 */
	public emit(command: string, data: any = {}) {
		this.panel.webview.postMessage({ command, ...data })
	}

	/**
	 * Boostraps the webview with the appropriate data.
	 */
	private initialize() {
		const panel = vscode.window.createWebviewPanel(
			'react',
			this.appName,
			this.column,
			{
				/*
					todo: figure out if we want to give them this option!
					This will let the app continue rendering and working when not focused, so if another tab is on the screen.
					If not, it's recreated each time.
				*/
				retainContextWhenHidden: this.remainActive,
				enableScripts: true,
				enableCommandUris: true,
				localResourceRoots: [
					vscode.Uri.file(this.appPath),
					vscode.Uri.file(join(this.appPath, 'static')),
					vscode.Uri.file(join(this.appPath, 'static', 'media')),
				],
			}
		);

		panel.webview.html = this.buildHTML();

		panel.onDidDispose(this.dispose, null, this.disposables);
		panel.webview.onDidReceiveMessage(
			msg => this.handleMessageReceived(msg),
			null,
			this.disposables
		);

		return panel;
	}

	/**
	 * Reads the file path for the given key from the asset-manifest.json file.
	 * @param key The object key of the file.
	 */
	private readFromManifest(key: string) {
		const manifest = require(join(this.appPath, 'asset-manifest.json'));
		if (!manifest || !manifest.files) {
			this.throwException('The asset-manifest.json file was not found!');
		}
		if (key in manifest.files) {
		} else {
			this.throwException(
				`The key "${key}" was not found in the asset-manifest.json.`
			);
		}
		const filePath = manifest.files[key];
		return vscode.Uri.file(join(this.appPath, filePath)).with({
			scheme: 'vscode-resource',
		});
	}

	/**
	 * Assembles the html for the webview to render.
	 */
	private buildHTML() {
		const random = nonce();
		const script = this.readFromManifest('main.js');
		const style = this.readFromManifest('main.css');

		return `
        <!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
				<title>${this.appName}</title>
				<link rel="stylesheet" type="text/css" href="${style}">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${random}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
				<base href="${vscode.Uri.file(this.appPath).with({
					scheme: 'vscode-resource',
				})}/">
			</head>

			<body>
				<noscript>You need to enable JavaScript to run this app.</noscript>
				<div id="root"></div>
				
				<script nonce="${random}" src="${script}"></script>
			</body>
        </html>`;
	}

	private throwException(msg: string) {
		vscode.window.showErrorMessage(msg);
	}

	/**
	 * Handles the messages received from the webview and passes them onto the registered listeners if any are available.
	 * @param message The message sent back from the webview.
	 */
	private handleMessageReceived(message) {
		if (message.command && message.command in this.listeners) {
			this.listeners[message.command](message);
		} else {
			this.throwException(
				`No command registered for ${message.command}.`
			);
		}
	}
}
