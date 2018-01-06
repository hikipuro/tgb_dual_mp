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

const templateMenu: Electron.MenuItemConstructorOptions[] = [
	{
		id: "file",
		label: "ファイル (&F)",
		submenu: [
			{
				id: "file.load-slot1",
				label: "Slot1に読み込み (&1)"
			},
			{
				id: "file.reset-slot1",
				label: "Slot1リセット (&R)"
			},
			{
				id: "file.save-state",
				label: "状態保存 (&S)",
				enabled: false,
				submenu: [
					{
						id: "file.save-state.0",
						label: "0: ----/--/-- --:--:--"
					},
					{
						id: "file.save-state.1",
						label: "1: ----/--/-- --:--:--"
					},
					{
						id: "file.save-state.2",
						label: "2: ----/--/-- --:--:--"
					},
					{
						id: "file.save-state.3",
						label: "3: ----/--/-- --:--:--"
					},
					{
						id: "file.save-state.4",
						label: "4: ----/--/-- --:--:--"
					},
					{
						id: "file.save-state.5",
						label: "5: ----/--/-- --:--:--"
					},
					{
						id: "file.save-state.6",
						label: "6: ----/--/-- --:--:--"
					},
					{
						id: "file.save-state.7",
						label: "7: ----/--/-- --:--:--"
					},
					{
						id: "file.save-state.8",
						label: "8: ----/--/-- --:--:--"
					},
					{
						id: "file.save-state.9",
						label: "9: ----/--/-- --:--:--"
					}
				]
			},
			{
				id: "file.load-state",
				label: "状態復元 (&L)",
				enabled: false,
				submenu: [
					{
						id: "file.load-state.0",
						label: "0: ----/--/-- --:--:--"
					},
					{
						id: "file.load-state.1",
						label: "1: ----/--/-- --:--:--"
					},
					{
						id: "file.load-state.2",
						label: "2: ----/--/-- --:--:--"
					},
					{
						id: "file.load-state.3",
						label: "3: ----/--/-- --:--:--"
					},
					{
						id: "file.load-state.4",
						label: "4: ----/--/-- --:--:--"
					},
					{
						id: "file.load-state.5",
						label: "5: ----/--/-- --:--:--"
					},
					{
						id: "file.load-state.6",
						label: "6: ----/--/-- --:--:--"
					},
					{
						id: "file.load-state.7",
						label: "7: ----/--/-- --:--:--"
					},
					{
						id: "file.load-state.8",
						label: "8: ----/--/-- --:--:--"
					},
					{
						id: "file.load-state.9",
						label: "9: ----/--/-- --:--:--"
					}
				]
			},
			{
				id: "file.pause",
				label: "一時停止 (&P)"
			},
			{
				id: "file.release-slot1",
				label: "Slot1解放 (&F)"
			},
			{
				type: "separator"
			},
			{
				id: "file.load-slot2",
				label: "Slot2に読み込み (&2)",
				enabled: false
			},
			{
				id: "file.reset-slot2",
				label: "Slot2リセット (&E)",
				enabled: false
			},
			{
				id: "file.release-slot2",
				label: "Slot2解放 (&Q)",
				enabled: false
			},
			{
				type: "separator"
			},
			{
				id: "file.net",
				label: "通信対戦 (&T)",
				enabled: false
			},
			{
				type: "separator"
			},
			{
				id: "file.quit",
				label: "終了 (&X)",
				role: "quit"
			},
		]
	},
	{
		id: "option",
		label: "オプション (&O)",
		submenu: [
			{
				id: "option.key",
				label: "キーコンフィグ (&K)"
			},
			{
				id: "option.sound",
				label: "サウンド設定 (&A)",
				enabled: false
			},
			{
				id: "option.speed",
				label: "速度設定 (&S)",
				enabled: false
			},
			{
				id: "option.screen",
				label: "画面設定 (&L)",
				submenu: [
					{
						id: "option.screen.fullscreen",
						label: "フルスクリーン",
						role: "togglefullscreen"
					},
					{
						type: "separator"
					},
					{
						id: "option.screen.x1",
						label: "x1"
					},
					{
						id: "option.screen.x2",
						label: "x2"
					},
					{
						id: "option.screen.x3",
						label: "x3"
					},
					{
						id: "option.screen.x4",
						label: "x4"
					},
					{
						id: "option.screen.x5",
						label: "x5"
					},
					{
						id: "option.screen.x6",
						label: "x6"
					},
					{
						type: "separator"
					},
					{
						id: "option.screen.bg",
						label: "BG Layer",
						type: "checkbox",
						checked: true,
						enabled: false
					},
					{
						id: "option.screen.window",
						label: "Window Layer",
						type: "checkbox",
						checked: true,
						enabled: false
					},
					{
						id: "option.screen.sprite",
						label: "Sprite Layer",
						type: "checkbox",
						checked: true,
						enabled: false
					},
					{
						type: "separator"
					},
					{
						id: "option.screen.filter",
						label: "フィルタ係数 (&F)",
						enabled: false
					},
				]
			},
			{
				id: "option.type",
				label: "機種設定 (&G)",
				enabled: false
			},
			{
				id: "option.emulator",
				label: "エミュレータ設定 (&E)",
				enabled: false
			},
			{
				id: "option.directory",
				label: "ディレクトリ設定 (&D)",
				enabled: false
			},
			{
				type: "separator"
			},
			{
				id: "option.par",
				label: "PARもどき (&P)",
				enabled: false
			},
			{
				id: "option.record",
				label: "記録 (&R)",
				enabled: false
			},
			{
				id: "option.special",
				label: "特殊 (&S)",
				enabled: false
			},
			{
				id: "option.peripheral",
				label: "周辺機器 (&E)",
				enabled: false
			},
			{
				type: "separator"
			},
			{
				id: "option.log",
				label: "ログ表示 (&L)",
				enabled: false
			}
		]
	},
	{
		id: "help",
		label: "ヘルプ (&H)",
		submenu: [
			{
				id: "help.open-app-folder",
				label: "アプリのフォルダを開く (&O)"
			},
			{
				type: "separator"
			},
			{
				id: "help.version",
				label: "バージョン情報 (&V)"
			}
		]
	}
];

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
		}));

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
				Electron.shell.openExternal(process.cwd());
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

		this._keyConfigWindow = new KeyConfigWindow(this.browserWindow, this._config.keyConfig);
		this._keyConfigWindow.on("close", (keyConfig: KeyConfig) => {
			this._config.keyConfig = keyConfig;
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