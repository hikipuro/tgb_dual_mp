import * as Electron from "electron";
import * as path from "path";
import * as url from "url";

import { ipcMain, IpcMessageEvent } from "electron";
import { EventEmitter } from "events";
import { KeyConfig } from "../config/KeyConfig";
import { KeyCode } from "../KeyCode";

module Settings {
	export const Width: number = 340;
	export const Height: number = 248;
}

export class KeyConfigWindow extends EventEmitter {
	public browserWindow: Electron.BrowserWindow = null;
	public keyConfig: KeyConfig = new KeyConfig();

	constructor(parent: Electron.BrowserWindow = null, keyConfig: KeyConfig = null) {
		super();

		if (keyConfig != null) {
			this.keyConfig = keyConfig;
		}

		this.browserWindow = new Electron.BrowserWindow({
			parent: parent,
			title: "Key Config",
			type: "toolbar",
			useContentSize: true,
			width: Settings.Width,
			height: Settings.Height,
			acceptFirstMouse: true,
			//titleBarStyle: "hidden",
			minimizable: false,
			maximizable: false,
			resizable: false,
			//skipTaskbar: true,
			fullscreenable: false,
			autoHideMenuBar: true,
			show: false
		});
		this.browserWindow.setMenu(null);
		this.browserWindow.loadURL(url.format({
			pathname: path.join(__dirname, "../../html/KeyConfig.html"),
			protocol: "file:",
			slashes: true
		}));
		this.browserWindow.on("close", () => {
			ipcMain.removeAllListeners("KeyConfigWindow.Init");
			ipcMain.removeAllListeners("KeyConfigWindow.Result");
		});
		ipcMain.on("KeyConfigWindow.init", (event: IpcMessageEvent, arg: any): void => {
			event.returnValue = this.keyConfig;
		});
		ipcMain.on("KeyConfigWindow.Result", (event: IpcMessageEvent, arg: any): void => {
			this.keyConfig = arg;
			this.emit("close", this.keyConfig);
			this.browserWindow.close();
		});
	}

	public show(): void {
		this.browserWindow.show();
	}

	public destroy(): void {
		this.browserWindow.destroy();
		ipcMain.removeAllListeners("KeyConfigWindow.init");
		ipcMain.removeAllListeners("KeyConfigWindow.Result");
	}
}