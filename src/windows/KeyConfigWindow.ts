import * as Electron from "electron";
import * as path from "path";
import * as url from "url";

import { ipcMain, IpcMessageEvent } from "electron";
import { EventEmitter } from "events";
import { Config } from "../config/Config";
import { KeyConfig } from "../config/KeyConfig";
import { GamepadConfig } from "../config/GamepadConfig";
import { KeyCode } from "../KeyCode";

module Settings {
	export const Width: number = 340;
	export const Height: number = 272;
	export const Title: string = "Key Settings";
	export const Content: string = "../../html/KeyConfig.html";
}

export class KeyConfigWindow extends EventEmitter {
	public static Settings = Settings;
	public browserWindow: Electron.BrowserWindow = null;
	public keyConfig: KeyConfig = new KeyConfig();
	public gamepadConfig: GamepadConfig = new GamepadConfig();

	constructor(parent: Electron.BrowserWindow = null, config: Config = null) {
		super();

		if (config != null && config.key != null) {
			this.keyConfig = config.key;
		}
		if (config != null && config.gamepad != null) {
			this.gamepadConfig = config.gamepad;
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
			x: config.window.keyX,
			y: config.window.keyY,
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
		ipcMain.once("KeyConfigWindow.init", (event: IpcMessageEvent, arg: any): void => {
			const languageJson = Config.getLanguageJson();
			event.returnValue = {
				languageJson: languageJson,
				keyConfig: this.keyConfig,
				gamepadConfig: this.gamepadConfig
			};
		});
		ipcMain.on("KeyConfigWindow.apply", (event: IpcMessageEvent, keyConfig: KeyConfig, gamepadConfig: GamepadConfig): void => {
			this.keyConfig = keyConfig;
			this.gamepadConfig = gamepadConfig;
			this.emit("apply", this.keyConfig, this.gamepadConfig);
			//this.browserWindow.close();
			event.returnValue = null;
		});
	}

	protected removeIpcEvents(): void {
		ipcMain.removeAllListeners("KeyConfigWindow.init");
		ipcMain.removeAllListeners("KeyConfigWindow.apply");
	}
}