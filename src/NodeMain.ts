import * as Electron from "electron";

import { ipcMain, IpcMessageEvent } from "electron";
import { MainMenu } from "./MainMenu";
import { MainWindow } from "./windows/MainWindow";
import { KeyConfigWindow } from "./windows/KeyConfigWindow";
import { SoundConfigWindow } from "./windows/SoundConfigWindow";
import { SpeedConfigWindow } from "./windows/SpeedConfigWindow";
import { PathConfigWindow } from "./windows/PathConfigWindow";
import { LogWindow } from "./windows/LogWindow";
import { VersionWindow } from "./windows/VersionWindow";

class NodeMain {
	protected _app: Electron.App = null;
	protected _mainMenu: MainMenu = null;
	protected _mainWindow: MainWindow = null;

	constructor(app: Electron.App) {
		this._app = app;
		//this._app.disableHardwareAcceleration();
		//this._app.commandLine.appendSwitch("js-flags", "--expose-gc");
		this.addAppEvents();
	}

	protected addAppEvents(): void {
		const app = this._app;
		app.once("ready", this.onReady);
		app.once("window-all-closed", this.onWindowAllClosed);
		app.on("browser-window-focus", (e: Event, window: Electron.BrowserWindow) => {
			if (this._mainWindow == null) {
				return;
			}
			this._mainWindow.send("MainWindow.focus");
		});
		app.on("browser-window-blur", () => {
			if (this._mainWindow == null) {
				return;
			}
			const window = Electron.BrowserWindow.getFocusedWindow();
			if (window == null) {
				this._mainWindow.send("MainWindow.blur");
			}
		});
	}
	
	protected removeAppEvents(): void {
		const app = this._app;
		app.removeAllListeners("ready");
		app.removeAllListeners("window-all-closed");
		app.removeAllListeners("browser-window-focus");
		app.removeAllListeners("browser-window-blur");
	}

	protected addIpcEvents(): void {
		// this log event can use in all windows
		ipcMain.on("App.log", (event: IpcMessageEvent, ...args: any[]) => {
			if (this._mainWindow != null) {
				this._mainWindow.log(...args);
			}
			if (event != null) {
				event.returnValue = null;
			}
		});
	}

	protected removeIpcEvents(): void {
		ipcMain.removeAllListeners("App.log");
	}

	protected onReady = () => {
		this.addIpcEvents();
		//*
		this._mainMenu = new MainMenu();
		this._mainMenu.on("update", (menu: Electron.Menu) => {
			Electron.Menu.setApplicationMenu(menu);
		});
		this._mainMenu.createMenu();
		//*/

		//*
		this._mainWindow = new MainWindow();
		this._mainWindow.browserWindow.once("ready-to-show", () => {
			this._mainWindow.show();
		});
		this._mainWindow.browserWindow.once("closed", () => {
			this._mainWindow.destroy();
		});
		//*/

		/*
		const keyConfig = new KeyConfigWindow();
		keyConfig.browserWindow.once("closed", () => {
			this._app.quit();
		});
		keyConfig.browserWindow.webContents.openDevTools();
		keyConfig.show();
		//*/

		/*
		const soundConfig = new SoundConfigWindow();
		soundConfig.browserWindow.once("closed", () => {
			this._app.quit();
		});
		soundConfig.browserWindow.webContents.openDevTools();
		soundConfig.show();
		//*/

		/*
		const speedConfig = new SpeedConfigWindow();
		speedConfig.browserWindow.once("closed", () => {
			this._app.quit();
		});
		speedConfig.browserWindow.webContents.openDevTools();
		speedConfig.show();
		//*/

		/*
		const pathConfig = new PathConfigWindow();
		pathConfig.browserWindow.once("closed", () => {
			this._app.quit();
		});
		pathConfig.browserWindow.webContents.openDevTools();
		pathConfig.show();
		//*/
		
		/*
		const log = new LogWindow();
		log.browserWindow.once("closed", () => {
			this._app.quit();
		});
		log.browserWindow.webContents.openDevTools();
		log.show();
		//*/

		/*
		const version = new VersionWindow();
		version.browserWindow.once("closed", () => {
			this._app.quit();
		});
		version.browserWindow.webContents.openDevTools();
		version.show();
		//*/
	}

	protected onWindowAllClosed = () => {
		this.removeAppEvents();
		this.removeIpcEvents();
		//if (process.platform != "darwin") {
			this._app.quit();
		//}
	}
}

let main: NodeMain;
main = new NodeMain(Electron.app);
