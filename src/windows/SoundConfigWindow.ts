import * as Electron from "electron";
import * as path from "path";
import * as url from "url";

import { ipcMain, IpcMessageEvent } from "electron";
import { EventEmitter } from "events";
import { SoundConfig } from "../config/SoundConfig";

module Settings {
	export const Width: number = 175;
	export const Height: number = 260;
	export const Title: string = "Sound Settings";
	export const Content: string = "../../html/SoundConfig.html";
}

export class SoundConfigWindow extends EventEmitter {
	public static Settings = Settings;
	public browserWindow: Electron.BrowserWindow = null;
	public soundConfig: SoundConfig = new SoundConfig();

	constructor(parent: Electron.BrowserWindow = null, soundConfig: SoundConfig = null) {
		super();

		if (soundConfig != null) {
			this.soundConfig = soundConfig;
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
			minimizable: false,
			maximizable: false,
			resizable: false,
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
		ipcMain.once("SoundConfigWindow.init", (event: IpcMessageEvent, arg: any): void => {
			event.returnValue = this.soundConfig;
		});
		ipcMain.on("SoundConfigWindow.update", (event: IpcMessageEvent, arg: any): void => {
			this.soundConfig = arg;
			this.emit("update", this.soundConfig);
			event.returnValue = null;
		});
	}

	protected removeIpcEvents(): void {
		ipcMain.removeAllListeners("SoundConfigWindow.init");
		ipcMain.removeAllListeners("SoundConfigWindow.update");
	}
}
