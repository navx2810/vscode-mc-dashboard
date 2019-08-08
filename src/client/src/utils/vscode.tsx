type MessageEvent = { command: string } & { [key: string]: any };
type ListenerEvent = (event: any) => void;
declare var acquireVsCodeApi: () => {
	postMessage: (object: MessageEvent) => any;
};

const vscode = acquireVsCodeApi();

export default new (class {
	private listeners: { [key: string]: ListenerEvent } = {};

	constructor() {
		window.addEventListener('message', event => {
			const message = event.data as MessageEvent;
			if (message.command && message.command in this.listeners) {
				this.listeners[message.command](message);
			}
		});
	}

	emit(command: string, data: any) {
		vscode.postMessage({ command, ...data });
	}

	throwError(exception: string) {
		this.emit('error', { ex: exception });
	}

	register(key: string, handler: ListenerEvent) {
		if (key in this.listeners) {
			this.throwError(
				'The key is "${key}" is already being listened to.'
			);
		} else {
			this.listeners[key] = handler;
		}
	}
})();
