import * as Electron from "electron";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";

import { ipcMain, IpcMessageEvent } from "electron";
import { EventEmitter } from "events";
import { Config } from "../config/Config";
import { PathConfig } from "../config/PathConfig";
import { OpenDialog } from "../dialogs/OpenDialog";

module Settings {
	export const Width: number = 370;
	export const Height: number = 106;
	export const Title: string = "Directory Settings";
	export const Content: string = "../../html/PathConfig.html";
}

export class PathConfigWindow extends EventEmitter {
	public static Settings = Settings;
	public browserWindow: Electron.BrowserWindow = null;
	public pathConfig: PathConfig = new PathConfig();
	public newPathConfig: PathConfig = new PathConfig();

	constructor(parent: Electron.BrowserWindow = null, config: Config = null) {
		super();

		if (config != null && config.path != null) {
			this.pathConfig = config.path;
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

	public send(channel: string, ...args: any[]): void {
		if (this.browserWindow.isDestroyed()) {
			return;
		}
		const webContents = this.browserWindow.webContents;
		webContents.send(channel, ...args);
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
			x: config.window.pathX,
			y: config.window.pathY,
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
		ipcMain.once("PathConfigWindow.init", (event: IpcMessageEvent, arg: any): void => {
			const languageJson = Config.getLanguageJson();
			event.returnValue = {
				languageJson: languageJson,
				pathConfig: this.pathConfig
			};
		});
		ipcMain.on("PathConfigWindow.close", (event: IpcMessageEvent, arg: any): void => {
			this.newPathConfig = arg;
			if (fs.existsSync(this.newPathConfig.save)) {
				this.pathConfig.save = this.newPathConfig.save;
			}
			if (fs.existsSync(this.newPathConfig.media)) {
				this.pathConfig.media = this.newPathConfig.media;
			}
			this.emit("close", this.pathConfig);
			this.browserWindow.close();
			event.returnValue = null;
		});
		ipcMain.on("PathConfigWindow.selectSavePath", (event: IpcMessageEvent, arg: any): void => {
			this.newPathConfig = arg;
			let dialog = new OpenDialog();
	
			dialog.defaultPath = this.newPathConfig.save;
			dialog.properties.openDirectory = true;
			dialog.on("select", (filenames: string[]) => {
				if (filenames.length <= 0) {
					return;
				}
				const path = filenames[0];
				this.newPathConfig.save = path;
				this.send("PathConfigWindow.selectSavePath", this.newPathConfig);
				dialog = null;
			});
			dialog.show();
			event.returnValue = null;
		});
		ipcMain.on("PathConfigWindow.selectMediaPath", (event: IpcMessageEvent, arg: any): void => {
			this.newPathConfig = arg;
			let dialog = new OpenDialog();
	
			dialog.defaultPath = this.newPathConfig.save;
			dialog.properties.openDirectory = true;
			dialog.on("select", (filenames: string[]) => {
				if (filenames.length <= 0) {
					return;
				}
				const path = filenames[0];
				this.newPathConfig.media = path;
				this.send("PathConfigWindow.selectMediaPath", this.newPathConfig);
				dialog = null;
			});
			dialog.show();
			event.returnValue = null;
		});
	}

	protected removeIpcEvents(): void {
		ipcMain.removeAllListeners("PathConfigWindow.init");
		ipcMain.removeAllListeners("PathConfigWindow.close");
		ipcMain.removeAllListeners("PathConfigWindow.selectSavePath");
		ipcMain.removeAllListeners("PathConfigWindow.selectMediaPath");
	}
}
