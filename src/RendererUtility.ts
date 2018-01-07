import * as Electron from "electron";

export module RendererUtility {
	export function overrideConsoleLog(): void {
		if (process.type !== "renderer") {
			return;
		}
		console.log = function (...args: any[]) {
			Electron.ipcRenderer.send("log", ...args);
		};
	}
}
