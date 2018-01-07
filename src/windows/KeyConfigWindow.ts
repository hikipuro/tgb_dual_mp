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
	export const Title: string = "Key Config";
	export const Content: string = "../../html/KeyConfig.html";
}

export class KeyConfigWindow extends EventEmitter {
	public browserWindow: Electron.BrowserWindow = null;
	public keyConfig: KeyConfig = new KeyConfig();

	constructor(parent: Electron.BrowserWindow = null, keyConfig: KeyConfig = null) {
		super();

		if (keyConfig != null) {
			this.keyConfig = keyConfig;
		}
		
		this.initWindow(parent);
		this.addIpcEvents();
	}

	public show(): void {
		this.browserWindow.show();
	}

	public destroy(): void {
		this.browserWindow.destroy();
	}

	protected initWindow(parent: Electron.BrowserWindow): void {
		this.browserWindow = new Electron.BrowserWindow({
			parent: parent,
			title: Settings.Title,
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
			pathname: path.join(__dirname, Settings.Content),
			protocol: "file:",
			slashes: true
		}));
		this.browserWindow.once("close", () => {
			this.removeIpcEvents();
		});
	}
	
	protected addIpcEvents(): void {
		ipcMain.on("KeyConfigWindow.init", (event: IpcMessageEvent, arg: any): void => {
			event.returnValue = this.keyConfig;
		});
		ipcMain.on("KeyConfigWindow.close", (event: IpcMessageEvent, arg: any): void => {
			this.keyConfig = arg;
			this.emit("close", this.keyConfig);
			this.browserWindow.close();
			event.returnValue = null;
		});
	}

	protected removeIpcEvents(): void {
		ipcMain.removeAllListeners("KeyConfigWindow.init");
		ipcMain.removeAllListeners("KeyConfigWindow.close");
	}
}