import * as vscode from 'vscode';
import AppPanel from './AppPanel';

let panel: AppPanel = null;

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('mc.startDashboard', () => {
			panel = new AppPanel(context, 'MarketCarpenter Dashboard');
			panel.register('app:start', message => {
				console.log('I was registered');
				console.log(message);
			});
		})
	);
}

export function deactivate() {
	if (panel) {
		panel.dispose();
	}
}