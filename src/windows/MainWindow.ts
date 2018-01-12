import * as Electron from "electron";
import * as path from "path";
import * as url from "url";
import * as fs from "fs";

import { MenuItem, ipcMain, IpcMessageEvent, MenuItemConstructorOptions } from "electron";
import { Constants } from "../Constants";
import { Config } from "../config/Config";
import { KeyConfig } from "../config/KeyConfig";
import { GamepadConfig } from "../config/GamepadConfig";
import { SoundConfig } from "../config/SoundConfig";
import { SpeedConfig } from "../config/SpeedConfig";
import { PathConfig } from "../config/PathConfig";
import { MainMenu } from "../MainMenu";
import { OpenDialog } from "../dialogs/OpenDialog";
import { KeyConfigWindow } from "./KeyConfigWindow";
import { SoundConfigWindow } from "./SoundConfigWindow";
import { SpeedConfigWindow } from "./SpeedConfigWindow";
import { PathConfigWindow } from "./PathConfigWindow";
import { VersionWindow } from "./VersionWindow";

module Settings {
	export const Title: string = "TGB Dual MP [no file loaded]";
	export const Content: string = "../../html/Main.html";
	export const DevTools: boolean = true;
}

declare module "electron" {
	interface MenuItem {
		id: string;
		submenu: Electron.Menu;
	}
}

export class MainWindow {
	public static Settings = Settings;
	public browserWindow: Electron.BrowserWindow = null;
	protected _keyConfigWindow: KeyConfigWindow;
	protected _soundConfigWindow: SoundConfigWindow;
	protected _speedConfigWindow: SpeedConfigWindow;
	protected _pathConfigWindow: PathConfigWindow;
	protected _versionWindow: VersionWindow;
	protected _config: Config;

	constructor(parent: Electron.BrowserWindow = null) {
		// load config.json
		this._config = Config.load();

		this.initWindow(parent);
		this.initMenu();
		this.addIpcEvents();
	}

	public show(): void {
		this.browserWindow.show();
		if (Config.isDevMode() && Settings.DevTools) {
			this.browserWindow.webContents.openDevTools();
		}
	}

	public destroy(): void {
		this.browserWindow.destroy();
	}

	public log(...args: any[]): void {
		this.send("MainWindow.log", ...args);
	}

	public send(channel: string, ...args: any[]): void {
		if (this.browserWindow.isDestroyed()) {
			return;
		}
		const webContents = this.browserWindow.webContents;
		webContents.send(channel, ...args);
	}
	
	protected initWindow(parent: Electron.BrowserWindow): void {
		this.browserWindow = new Electron.BrowserWindow({
			title: Settings.Title,
			useContentSize: true,
			width: this._config.window.width,
			height: this._config.window.height,
			x: this._config.window.x,
			y: this._config.window.y,
			minWidth: Constants.ScreenWidth,
			minHeight: Constants.ScreenHeight,
			acceptFirstMouse: true,
			//titleBarStyle: "hidden",
			show: false,
			//icon: "../icon.png",
			webPreferences: {
				//webgl: false,
				//experimentalFeatures: true,
				//experimentalCanvasFeatures: true
				//nodeIntegration: false
			}
		});

		this.browserWindow.loadURL(url.format({
			pathname: path.join(__dirname, Settings.Content),
			protocol: "file:",
			slashes: true,
		}), {
			/*
			postData: [{
				type: "rawData",
				bytes: Buffer.from("hello=world")
			}],
			*/
		});

		// resize
		this.browserWindow.on("resize", () => {
			if (this.browserWindow.isFullScreen()) {
				return;
			}
			if (this.browserWindow.isMaximized()) {
				return;
			}
			const size = this.browserWindow.getContentSize();
			this._config.window.width = size[0];
			this._config.window.height = size[1];
		});

		// fullscreen
		this.browserWindow.on("enter-full-screen", () => {
			this.browserWindow.setAutoHideMenuBar(true);
			//this.browserWindow.setMenuBarVisibility(false);
		});
		this.browserWindow.on("leave-full-screen", () => {
			this.browserWindow.setAutoHideMenuBar(false);
			this.browserWindow.setMenuBarVisibility(true);
		});

		/*
		// suspend / resume
		Electron.powerMonitor.on("suspend", () => {
			this.send("suspend");
		});
		Electron.powerMonitor.on("resume", () => {
			this.send("resume");
		});

		// lock
		this.browserWindow.on("hide", () => {
			this.send("hide");
		});
		this.browserWindow.on("show", () => {
			this.send("show");
		});
		//*/
		this.browserWindow.once("close", () => {
			this.removeIpcEvents();

			// save config.json
			this.saveWindowPosition();
			this._config.save();
		});
	}

	protected initMenu(): void {
		const menu = MainMenu.Instance;
		menu.checkItem("option.screen.aspect-ratio", this._config.screen.fixedAspectRatio);
		menu.checkItem("option.screen.smoothing", this._config.screen.smoothing);
		menu.checkItem("option.screen.bg", this._config.screen.bg);
		menu.checkItem("option.screen.window", this._config.screen.window);
		menu.checkItem("option.screen.sprite", this._config.screen.sprite);

		menu.checkItem("option.type.gb", this._config.misc.type === "gb");
		menu.checkItem("option.type.gbc", this._config.misc.type === "gbc");
		menu.checkItem("option.type.gba", this._config.misc.type === "gba");
		menu.checkItem("option.type.auto", this._config.misc.type === "auto");

		menu.checkItem("option.emulator.pause", this._config.misc.pauseWhenInactive);
	}

	protected addIpcEvents(): void {
		ipcMain.on("App.menu.click", this.onClickMenuItem);
		ipcMain.on("MainWindow.init", (event: IpcMessageEvent, arg: any) => {
			this.send("MainWindow.init", process.argv);
			event.returnValue = process.argv;
		});
		ipcMain.on("MainWindow.getConfig", (event: IpcMessageEvent, arg: any) => {
			event.sender.send("MainWindow.getConfig", this._config);
			event.returnValue = this._config;
		});
		ipcMain.on("MainWindow.updateSaveLoadStateMenu", (event: IpcMessageEvent, arg: any) => {
			if (arg == null || arg === "") {
				MainMenu.Instance.disableAllSaveLoadState();
				return;
			}
			let filePath: string = arg;
			const pathInfo = path.parse(filePath);
			filePath = pathInfo.name + ".";
			filePath = path.join(this._config.path.save, filePath);

			const menu = Electron.Menu.getApplicationMenu();
			if (menu == null) {
				MainMenu.Instance.disableAllSaveLoadState();
				return;
			}

			for (let i = 1; i < 10; i++) {
				const loadItemId = "file.load-state." + i;
				const loadItem = menu.getMenuItemById(loadItemId);
				const saveItemId = "file.save-state." + i;
				const saveItem = menu.getMenuItemById(saveItemId);
				if (loadItem == null || saveItem == null) {
					continue;
				}
				saveItem.enabled = true;
				const saveFile = filePath + "sv" + i;
				if (!fs.existsSync(saveFile)) {
					loadItem.enabled = false;
					continue;
				}
				loadItem.enabled = true;
			}
		});
	}

	protected removeIpcEvents(): void {
		ipcMain.removeListener("App.menu.click", this.onClickMenuItem);
		ipcMain.removeAllListeners("MainWindow.init");
		ipcMain.removeAllListeners("MainWindow.getConfig");
		ipcMain.removeAllListeners("MainWindow.updateSaveLoadStateMenu");
	}

	protected onClickMenuItem = (item: MenuItem, focusedWindow: Electron.BrowserWindow, event: Event): void => {
		const id: string = item.id;
		if (id == null) {
			return;
		}

		switch (id) {
			case "file.load-slot1":
				this.showOpenFileDialog();
				return;
			case "option.key":
				this.showKeyConfigWindow();
				return;
			case "option.sound":
				this.showSoundConfigWindow();
				return;
			case "option.speed":
				this.showSpeedConfigWindow();
				return;
			case "option.screen.aspect-ratio":
				this._config.screen.fixedAspectRatio = item.checked;
				this.send("MainWindow.menu", item);
				return;
			case "option.screen.smoothing":
				this._config.screen.smoothing = item.checked;
				this.send("MainWindow.menu", item);
				return;
			case "option.emulator.pause":
				this._config.misc.pauseWhenInactive = item.checked;
				this.send("MainWindow.menu", item);
				return;
			case "option.directory":
				this.showPathConfigWindow();
				return;
			case "help.open-app-folder":
				Electron.shell.openItem(Config.getCurrentPath());
				return;
			case "help.version":
				this.showVersionWindow();
				return;
		}

		if (id.indexOf("option.screen.x") === 0) {
			const scale = Number(id.substr(-1, 1));
			const width = Constants.ScreenWidth * scale;
			const height = Constants.ScreenHeight * scale;
			this.setWindowSize(width, height);
			return;
		}
		
		if (id.indexOf("option.screen.") === 0) {
			const layerName = id.split(".", 3)[2];
			if (this._config.screen[layerName] == null) {
				this.send("MainWindow.menu", item);
				return;
			}
			this._config.screen[layerName] = item.checked;
			this.send("MainWindow.screenConfig", this._config);
			return;
		}

		if (id.indexOf("option.type.") === 0) {
			MainMenu.Instance.selectGBType(item);
			const typeName = id.split(".", 3)[2];
			this._config.misc.type = typeName;
			this.send("MainWindow.miscConfig.type", this._config);
			return;
		}

		this.send("MainWindow.menu", item);
	}

	protected setWindowSize(width: number, height: number): void {
		this.browserWindow.setContentSize(width, height, false);
	}

	protected saveWindowPosition(): void {
		const position = this.browserWindow.getPosition();
		this._config.window.x = position[0];
		this._config.window.y = position[1];

		this.saveKeyConfigWindowPosition();
		this.saveSoundConfigWindowPosition();
		this.saveSpeedConfigWindowPosition();
		this.savePathConfigWindowPosition();
	}

	protected saveKeyConfigWindowPosition() {
		if (this._keyConfigWindow == null) {
			return;
		}
		const position = this._keyConfigWindow.browserWindow.getPosition();
		this._config.window.keyX = position[0];
		this._config.window.keyY = position[1];
	}

	protected saveSoundConfigWindowPosition() {
		if (this._soundConfigWindow == null) {
			return;
		}
		const position = this._soundConfigWindow.browserWindow.getPosition();
		this._config.window.soundX = position[0];
		this._config.window.soundY = position[1];
	}

	protected saveSpeedConfigWindowPosition() {
		if (this._speedConfigWindow == null) {
			return;
		}
		const position = this._speedConfigWindow.browserWindow.getPosition();
		this._config.window.speedX = position[0];
		this._config.window.speedY = position[1];
	}

	protected savePathConfigWindowPosition() {
		if (this._pathConfigWindow == null) {
			return;
		}
		const position = this._pathConfigWindow.browserWindow.getPosition();
		this._config.window.pathX = position[0];
		this._config.window.pathY = position[1];
	}

	protected showOpenFileDialog() {
		let dialog = new OpenDialog();

		const romsPath = this._config.path.roms;
		if (romsPath == null || !fs.existsSync(romsPath)) {
			dialog.defaultPath = Config.getCurrentPath();
		} else {
			dialog.defaultPath = romsPath;
		}

		dialog.addFilter("Game Boy Rom Image", ["gb", "gbc", "zip"]);
		dialog.addFilter("All Files", ["*"]);
		dialog.on("select", (filenames: string[]) => {
			if (filenames.length <= 0) {
				return;
			}
			this._config.path.roms = path.dirname(filenames[0]);
			this.send("MainWindow.load", filenames[0]);
			dialog = null;
		});
		dialog.show();
	}

	protected showKeyConfigWindow(): void {
		if (this._keyConfigWindow != null) {
			this._keyConfigWindow.show();
			return;
		}

		this._keyConfigWindow = new KeyConfigWindow(this.browserWindow, this._config);
		this._keyConfigWindow.browserWindow.once("ready-to-show", () => {
			this._keyConfigWindow.show();
		});
		this._keyConfigWindow.browserWindow.once("close", () => {
			this._keyConfigWindow.removeAllListeners("apply");
			this.saveKeyConfigWindowPosition();

			this._keyConfigWindow.destroy();
			this._keyConfigWindow = null;
		});
		this._keyConfigWindow.on("apply", (keyConfig: KeyConfig, gamepadConfig: GamepadConfig) => {
			this._config.key = keyConfig;
			this._config.gamepad = gamepadConfig;
			this.send("MainWindow.getConfig", this._config);
		});
	}

	protected showSoundConfigWindow(): void {
		if (this._soundConfigWindow != null) {
			this._soundConfigWindow.show();
			return;
		}

		this._soundConfigWindow = new SoundConfigWindow(this.browserWindow, this._config);
		this._soundConfigWindow.browserWindow.once("ready-to-show", () => {
			this._soundConfigWindow.show();
		});
		this._soundConfigWindow.browserWindow.once("close", () => {
			this._soundConfigWindow.removeAllListeners("apply");
			this.saveSoundConfigWindowPosition();

			this._soundConfigWindow.destroy();
			this._soundConfigWindow = null;
		});
		this._soundConfigWindow.on("apply", (soundConfig: SoundConfig) => {
			this._config.sound = soundConfig;
			this.send("MainWindow.soundConfig", this._config);
		});
	}

	protected showSpeedConfigWindow(): void {
		if (this._speedConfigWindow != null) {
			this._speedConfigWindow.show();
			return;
		}

		this._speedConfigWindow = new SpeedConfigWindow(this.browserWindow, this._config);
		this._speedConfigWindow.browserWindow.once("ready-to-show", () => {
			this._speedConfigWindow.show();
		});
		this._speedConfigWindow.browserWindow.once("close", () => {
			this._speedConfigWindow.removeAllListeners("apply");
			this.saveSpeedConfigWindowPosition();

			this._speedConfigWindow.destroy();
			this._speedConfigWindow = null;
		});
		this._speedConfigWindow.on("apply", (speedConfig: SpeedConfig) => {
			this._config.speed = speedConfig;
			this.send("MainWindow.speedConfig", this._config);
		});
	}

	protected showPathConfigWindow(): void {
		if (this._pathConfigWindow != null) {
			this._pathConfigWindow.show();
			return;
		}

		this._pathConfigWindow = new PathConfigWindow(this.browserWindow, this._config);
		this._pathConfigWindow.browserWindow.once("ready-to-show", () => {
			this._pathConfigWindow.show();
		});
		this._pathConfigWindow.browserWindow.once("close", () => {
			this._pathConfigWindow.removeAllListeners("close");
			this.savePathConfigWindowPosition();

			this._pathConfigWindow.destroy();
			this._pathConfigWindow = null;
		});
		this._pathConfigWindow.on("close", (pathConfig: PathConfig) => {
			this._config.path = pathConfig;
			this.send("MainWindow.pathConfig", this._config);
		});
	}

	protected showVersionWindow(): void {
		if (this._versionWindow != null) {
			this._versionWindow.show();
			return;
		}

		this._versionWindow = new VersionWindow(this.browserWindow);
		this._versionWindow.browserWindow.once("ready-to-show", () => {
			this._versionWindow.show();
		});
		this._versionWindow.browserWindow.once("close", () => {
			this._versionWindow.destroy();
			this._versionWindow = null;
		});
	}
}