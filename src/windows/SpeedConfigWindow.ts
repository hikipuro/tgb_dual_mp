import * as Electron from "electron";
import * as path from "path";
import * as url from "url";

import { ipcMain, IpcMessageEvent } from "electron";
import { EventEmitter } from "events";
import { SpeedConfig } from "../config/SpeedConfig";

module Settings {
	export const Width: number = 200;
	export const Height: number = 235;
	export const Title: string = "Speed Settings";
	export const Content: string = "../../html/SpeedConfig.html";
}

export class SpeedConfigWindow extends EventEmitter {
	public static Settings = Settings;
	public browserWindow: Electron.BrowserWindow = null;
	public speedConfig: SpeedConfig = new SpeedConfig();

	constructor(parent: Electron.BrowserWindow = null, speedConfig: SpeedConfig = null) {
		super();

		if (speedConfig != null) {
			this.speedConfig = speedConfig;
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
		ipcMain.once("SpeedConfigWindow.init", (event: IpcMessageEvent, arg: any): void => {
			event.returnValue = this.speedConfig;
		});
		ipcMain.on("SpeedConfigWindow.apply", (event: IpcMessageEvent, arg: any): void => {
			this.speedConfig = arg;
			this.emit("apply", this.speedConfig);
			//this.browserWindow.close();
			event.returnValue = null;
		});
	}

	protected removeIpcEvents(): void {
		ipcMain.removeAllListeners("SpeedConfigWindow.init");
		ipcMain.removeAllListeners("SpeedConfigWindow.apply");
	}
}
