import * as Electron from "electron";
import * as path from "path";
import * as url from "url";

import { ipcMain, IpcMessageEvent } from "electron";

module Settings {
	export const Width: number = 260;
	export const Height: number = 156;
}

export class VersionWindow {
	public browserWindow: Electron.BrowserWindow = null;

	constructor(parent: Electron.BrowserWindow = null) {
		this.browserWindow = new Electron.BrowserWindow({
			parent: parent,
			title: "TGB Dual MP Version",
			type: "toolbar",
			useContentSize: true,
			width: Settings.Width,
			height: Settings.Height,
			acceptFirstMouse: true,
			minimizable: false,
			maximizable: false,
			resizable: false,
			fullscreenable: false,
			autoHideMenuBar: true,
			show: false
		});
		this.browserWindow.setMenu(null);
		this.browserWindow.loadURL(url.format({
			pathname: path.join(__dirname, "../../html/Version.html"),
			protocol: "file:",
			slashes: true
		}));
		this.browserWindow.on("close", () => {
			ipcMain.removeAllListeners("VersionWindow.Result");
		});
		ipcMain.on("VersionWindow.Result", (event: IpcMessageEvent, arg: any): void => {
			this.browserWindow.close();
		});
	}

	public show(): void {
		this.browserWindow.show();
	}

	public destroy(): void {
		this.browserWindow.destroy();
		ipcMain.removeAllListeners("VersionWindow.Result");
	}
}