import * as Electron from "electron";
import * as path from "path";
import * as url from "url";

import { ipcMain, IpcMessageEvent } from "electron";
import { EventEmitter } from "events";
import { Config } from "../config/Config";
import { SpeedConfig } from "../config/SpeedConfig";

module Settings {
	export const Width: number = 230;
	export const Height: number = 250;
	export const Title: string = "Speed Settings";
	export const Content: string = "../../html/SpeedConfig.html";
}

export class SpeedConfigWindow extends EventEmitter {
	public static Settings = Settings;
	public browserWindow: Electron.BrowserWindow = null;
	public speedConfig: SpeedConfig = new SpeedConfig();

	constructor(parent: Electron.BrowserWindow = null, config: Config = null) {
		super();

		if (config != null && config.speed != null) {
			this.speedConfig = config.speed;
		}
		
		this.initWindow(parent, config);
		this.addIpcEvents();
	}

	public show(): void {
		this.browserWindow.show();
	}

	public destroy(): void {
		this.browserWindow.destroy();
	}

	protected initWindow(parent: Electron.BrowserWindow, config: Config): void {
		if (config == null) {
			config = new Config();
		}
		this.browserWindow = new Electron.BrowserWindow({
			parent: parent,
			title: Settings.Title,
			type: "toolbar",
			useContentSize: true,
			width: Settings.Width,
			height: Settings.Height,
			x: config.window.speedX,
			y: config.window.speedY,
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
			const languageJson = Config.getLanguageJson();
			event.returnValue = {
				languageJson: languageJson,
				speedConfig: this.speedConfig
			};
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
