import * as Electron from "electron";
import * as path from "path";
import * as url from "url";
import * as fs from "fs";

import { MenuItem, ipcMain, IpcMessageEvent, MenuItemConstructorOptions } from "electron";
import { Constants } from "../Constants";
import { Config } from "../config/Config";
import { KeyConfig } from "../config/KeyConfig";
import { OpenDialog } from "../dialogs/OpenDialog";
import { KeyConfigWindow } from "./KeyConfigWindow";
import { VersionWindow } from "./VersionWindow";

module Settings {
	export const DevTools: boolean = true;
}

declare module "electron" {
	interface MenuItem {
		id: string;
	}
}

export class MainWindow {
	public browserWindow: Electron.BrowserWindow = null;
	protected _keyConfigWindow: KeyConfigWindow;
	protected _versionWindow: VersionWindow;
	protected _config: Config;

	constructor() {
		this._config = Config.load();

		ipcMain.on("Get.Config", (event: IpcMessageEvent, arg: any) => {
			//event.returnValue = this._keyConfig;
			event.sender.send("Get.Config", this._config);
		});

		this.browserWindow = new Electron.BrowserWindow({
			title: "TGB Dual MP [no file loaded]",
			useContentSize: true,
			width: Constants.ScreenWidth * 3,
			height: Constants.ScreenHeight * 3,
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

		const templateMenu = JSON.parse(fs.readFileSync("./config/AppMenu.json", "utf8"));
		const languageJson = this.getLanguageJson();

		this.translateMenuText(templateMenu, languageJson);
		this.addClickEventAllMenuItems(templateMenu);
		const menu = Electron.Menu.buildFromTemplate(templateMenu);
		Electron.Menu.setApplicationMenu(menu);

		this.browserWindow.on("enter-full-screen", () => {
			this.browserWindow.setAutoHideMenuBar(true);
			//this.browserWindow.setMenuBarVisibility(false);
		});
		this.browserWindow.on("leave-full-screen", () => {
			this.browserWindow.setAutoHideMenuBar(false);
			this.browserWindow.setMenuBarVisibility(true);
		});

		this.browserWindow.on("unresponsive", () => {
			this.send("blur");
		});
		this.browserWindow.on("close", () => {
			// save settings
			this._config.save();
		});

		this.browserWindow.loadURL(url.format({
			pathname: path.join(__dirname, "../../html/Main.html"),
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

		if (Settings.DevTools) {
			this.browserWindow.webContents.openDevTools();
		}
	}

	public show(): void {
		this.browserWindow.show();
	}

	public send(channel: string, ...args: any[]): void {
		const argArray = [channel].concat(args);
		const webContents = this.browserWindow.webContents;
		webContents.send.apply(webContents, argArray);
	}

	protected getLanguageJson(): any {
		const locale: string = Electron.app.getLocale();
		const languageFile: string = "./languages/" + locale + ".json";
		if (!fs.existsSync(languageFile)) {
			return null;
		}
		return JSON.parse(fs.readFileSync(languageFile, "utf8"));
	}

	protected translateMenuText(templateMenu: MenuItemConstructorOptions[], languageJson: any): void {
		if (templateMenu == null || languageJson == null) {
			return;
		}
		templateMenu.every((options: MenuItemConstructorOptions, index: number): boolean => {
			const text: string = languageJson.menu[options.id];
			if (text == null || text === "") {
				return true;
			}
			options.label = text;
			this.translateMenuText(options.submenu as MenuItemConstructorOptions[], languageJson);
			return true;
		});
	}

	protected addClickEventAllMenuItems(templateMenu: MenuItemConstructorOptions[]): void {
		if (templateMenu == null) {
			return;
		}
		templateMenu.every((options: MenuItemConstructorOptions, index: number): boolean => {
			options.click = this.onClickMenuItem;
			this.addClickEventAllMenuItems(options.submenu as MenuItemConstructorOptions[]);
			return true;
		});
	}

	protected onClickMenuItem = (item: MenuItem, focusedWindow: Electron.BrowserWindow) => {
		const id: string = item.id;

		switch (id) {
			case "file.load-slot1":
				this.openFileOpenDialog();
				return;
			case "option.key":
				this.openKeyConfigWindow();
				return;
			case "help.open-app-folder":
				Electron.shell.openItem(process.cwd());
				return;
			case "help.version":
				this.openVersionWindow();
				return;
		}

		if (id.indexOf("option.screen.x") == 0) {
			const scale = Number(id.substr(-1, 1));
			const width = Constants.ScreenWidth * scale;
			const height = Constants.ScreenHeight * scale;
			this.setWindowSize(width, height);
			return;
		}
		this.send("menu", item);
	}

	protected setWindowSize(width: number, height: number): void {
		this.browserWindow.setContentSize(width, height, false);
	}

	protected openFileOpenDialog() {
		const dialog = new OpenDialog();
		dialog.defaultPath = __dirname;
		dialog.addFilter("Game Boy Rom Image", ["gb", "gbc", "zip"]);
		dialog.addFilter("All Files", ["*"]);
		dialog.on("select", (filenames) => {
			if (filenames.length <= 0) {
				return;
			}
			this.send("load", filenames[0]);
		});
		dialog.show();
	}

	public openKeyConfigWindow(): void {
		if (this._keyConfigWindow != null) {
			this._keyConfigWindow.show();
			return;
		}

		this._keyConfigWindow = new KeyConfigWindow(this.browserWindow, this._config.key);
		this._keyConfigWindow.on("close", (keyConfig: KeyConfig) => {
			this._config.key = keyConfig;
			this.send("Get.Config", this._config);
		});
		this._keyConfigWindow.browserWindow.on("close", () => {
			this._keyConfigWindow.browserWindow.destroy();
			this._keyConfigWindow = null;
		});
		this._keyConfigWindow.browserWindow.on("ready-to-show", () => {
			this._keyConfigWindow.show();
		});
	}

	protected openVersionWindow(): void {
		if (this._versionWindow != null) {
			this._versionWindow.show();
			return;
		}

		this._versionWindow = new VersionWindow(this.browserWindow);
		this._versionWindow.browserWindow.on("close", () => {
			this._versionWindow.browserWindow.destroy();
			this._versionWindow = null;
		});
		this._versionWindow.browserWindow.on("ready-to-show", () => {
			this._versionWindow.show();
		});
	}
}