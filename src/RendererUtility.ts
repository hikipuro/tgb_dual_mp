import * as Electron from "electron";

export module RendererUtility {
	export function overrideConsoleLog(): void {
		if (process.type !== "renderer") {
			return;
		}
		const consoleLog = console.log;
		console.log = function (...args: any[]) {
			Electron.ipcRenderer.send("log", ...args);
			consoleLog(...args);
		};
	}
}
