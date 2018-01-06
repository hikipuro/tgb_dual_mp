import * as Electron from "electron";
import * as path from "path";
import * as url from "url";
import * as fs from "fs";

import { MenuItem, ipcMain, IpcMessageEvent } from "electron";
import { Constants } from "../Constants";
import { Config } from "../config/Config";
import { KeyConfig } from "../config/KeyConfig";
import { OpenDialog } from "../dialogs/OpenDialog";
import { KeyConfigWindow } from "./KeyConfigWindow";
import { VersionWindow } from "./VersionWindow";

module Settings {
	export const Width: number = 800;
	export const Height: number = 600;
	export const MinWidth: number = 400;
	export const MinHeight: number = 300;
	export const DevTools: boolean = true;
}

const templateMenu: Electron.MenuItemConstructorOptions[] = [
	{
		label: "ファイル (&F)",
		submenu: [
			{
				label: "Slot1に読み込み (&1)",
				click(item, focusedWindow) {
					MainWindow.instance.onClickLoadSlot1Menu(item, focusedWindow);
				}
			},
			{
				label: "Slot1リセット (&R)",
				click(item, focusedWindow) {
					MainWindow.instance.onClickResetSlot1Menu(item, focusedWindow);
				}
			},
			{
				label: "状態保存 (&S)",
				enabled: false,
				submenu: [
					{
						label: "0: ----/--/-- --:--:--",
					},
					{
						label: "1: ----/--/-- --:--:--",
					},
					{
						label: "2: ----/--/-- --:--:--",
					},
					{
						label: "3: ----/--/-- --:--:--",
					},
					{
						label: "4: ----/--/-- --:--:--",
					},
					{
						label: "5: ----/--/-- --:--:--",
					},
					{
						label: "6: ----/--/-- --:--:--",
					},
					{
						label: "7: ----/--/-- --:--:--",
					},
					{
						label: "8: ----/--/-- --:--:--",
					},
					{
						label: "9: ----/--/-- --:--:--",
					}
				]
			},
			{
				label: "状態復元 (&L)",
				enabled: false,
				submenu: [
					{
						label: "0: ----/--/-- --:--:--",
					},
					{
						label: "1: ----/--/-- --:--:--",
					},
					{
						label: "2: ----/--/-- --:--:--",
					},
					{
						label: "3: ----/--/-- --:--:--",
					},
					{
						label: "4: ----/--/-- --:--:--",
					},
					{
						label: "5: ----/--/-- --:--:--",
					},
					{
						label: "6: ----/--/-- --:--:--",
					},
					{
						label: "7: ----/--/-- --:--:--",
					},
					{
						label: "8: ----/--/-- --:--:--",
					},
					{
						label: "9: ----/--/-- --:--:--",
					}
				]
			},
			{
				label: "一時停止 (&P)",
				click(item, focusedWindow) {
					MainWindow.instance.onClickPauseMenu(item, focusedWindow);
				}
			},
			{
				label: "Slot1解放 (&F)",
				click(item, focusedWindow) {
					MainWindow.instance.onClickFreeSlot1Menu(item, focusedWindow);
				}
			},
			{
				type: "separator",
			},
			{
				label: "Slot2に読み込み (&2)",
				enabled: false
			},
			{
				label: "Slot2リセット (&E)",
				enabled: false
			},
			{
				label: "Slot2解放 (&Q)",
				enabled: false
			},
			{
				type: "separator",
			},
			{
				label: "通信対戦 (&T)",
				enabled: false
			},
			{
				type: "separator",
			},
			{
				label: "終了 (&X)",
				role: "quit",
			},
		]
	},
	{
		label: "オプション (&O)",
		submenu: [
			{
				label: "キーコンフィグ (&K)",
				click(item, focusedWindow) {
					MainWindow.instance.onClickKeyConfigMenu(item, focusedWindow);
				}
			},
			{
				label: "サウンド設定 (&A)",
				enabled: false
			},
			{
				label: "速度設定 (&S)",
				enabled: false
			},
			{
				label: "画面設定 (&L)",
				submenu: [
					{
						label: "フルスクリーン",
						role: "togglefullscreen"
					},
					{
						type: "separator"
					},
					{
						label: "x1",
						click(item, focusedWindow) {
							MainWindow.instance.onClickScreenSizeMenu(item, focusedWindow, 1);
						}
					},
					{
						label: "x2",
						click(item, focusedWindow) {
							MainWindow.instance.onClickScreenSizeMenu(item, focusedWindow, 2);
						}
					},
					{
						label: "x3",
						click(item, focusedWindow) {
							MainWindow.instance.onClickScreenSizeMenu(item, focusedWindow, 3);
						}
					},
					{
						label: "x4",
						click(item, focusedWindow) {
							MainWindow.instance.onClickScreenSizeMenu(item, focusedWindow, 4);
						}
					},
					{
						label: "x5",
						click(item, focusedWindow) {
							MainWindow.instance.onClickScreenSizeMenu(item, focusedWindow, 5);
						}
					},
					{
						label: "x6",
						click(item, focusedWindow) {
							MainWindow.instance.onClickScreenSizeMenu(item, focusedWindow, 6);
						}
					},
					{
						type: "separator"
					},
					{
						label: "BG Layer",
						type: "checkbox",
						checked: true,
						enabled: false
					},
					{
						label: "Window Layer",
						type: "checkbox",
						checked: true,
						enabled: false
					},
					{
						label: "Sprite Layer",
						type: "checkbox",
						checked: true,
						enabled: false
					},
					{
						type: "separator"
					},
					{
						label: "フィルタ係数 (&F)",
						enabled: false
					},
				]
			},
			{
				label: "機種設定 (&G)",
				enabled: false
			},
			{
				label: "エミュレータ設定 (&E)",
				enabled: false
			},
			{
				label: "ディレクトリ設定 (&D)",
				enabled: false
			},
			{
				type: "separator",
			},
			{
				label: "PARもどき (&P)",
				enabled: false
			},
			{
				label: "記録 (&R)",
				enabled: false
			},
			{
				label: "特殊 (&S)",
				enabled: false
			},
			{
				label: "周辺機器 (&E)",
				enabled: false
			},
			{
				type: "separator",
			},
			{
				label: "ログ表示 (&L)",
				enabled: false
			}
		]
	},
	{
		label: "ヘルプ (&H)",
		submenu: [
			{
				label: "アプリのフォルダを開く (&O)",
				click(item, focusedWindow) {
					Electron.shell.openExternal(process.cwd());
				}
			},
			{
				type: "separator",
			},
			{
				label: "バージョン情報 (&V)",
				click(item, focusedWindow) {
					MainWindow.instance.onClickVersionMenu(item, focusedWindow);
				}
			}
		]
	}
];


export class MainWindow {
	public static instance: MainWindow = null;
	public browserWindow: Electron.BrowserWindow = null;
	protected _keyConfigWindow: KeyConfigWindow;
	protected _versionWindow: VersionWindow;
	protected _config: Config;

	constructor() {
		if (MainWindow.instance != null) {
			throw new Error("duplicate MainWindow");
		}
		MainWindow.instance = this;

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
		//const config = Config.readText("nodemain.json");
		//const configJSON = JSON.parse(config);
		//this.browserWindow = new Electron.BrowserWindow(configJSON.mainWindow);

		const menu = Electron.Menu.buildFromTemplate(templateMenu);
		Electron.Menu.setApplicationMenu(menu);

		this.browserWindow.on("enter-full-screen", () => {
			this.browserWindow.setAutoHideMenuBar(true);
			//this.browserWindow.setAutoHideCursor(true);
		});
		this.browserWindow.on("leave-full-screen", () => {
			this.browserWindow.setAutoHideMenuBar(false);
			this.browserWindow.setMenuBarVisibility(true);
			//this.browserWindow.setAutoHideCursor(false);
		});
		
		this.browserWindow.on("unresponsive", () => {
			this.send("blur");
		});
		this.browserWindow.on("close", () => {
			// save settings
			this._config.save();
			/*
			fs.writeFileSync(path.join(
				process.cwd(),
				"config.json"
			), JSON.stringify(this._config.keyConfig, null, 2));
			*/
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
	
	public onClickLoadSlot1Menu = (item: MenuItem, focusedWindow: Electron.BrowserWindow) => {
		console.log(item);
		const dialog = new OpenDialog();
		dialog.defaultPath = __dirname;
		dialog.addFilter("Game Boy Rom Image", ["gb", "gbc", "zip"]);
		dialog.addFilter("All Files", ["*"]);
		dialog.on("select", (filenames) => {
			if (filenames.length <= 0) {
				return;
			}
			this.send("Menu.LoadSlot1", filenames[0]);
		});
		dialog.show();
	}
	
	public onClickFreeSlot1Menu = (item: MenuItem, focusedWindow: Electron.BrowserWindow) => {
		this.send("Menu.FreeSlot1");
	}
	
	public onClickResetSlot1Menu = (item: MenuItem, focusedWindow: Electron.BrowserWindow) => {
		this.send("Menu.ResetSlot1");
	}

	public onClickPauseMenu = (item: MenuItem, focusedWindow: Electron.BrowserWindow) => {
		this.send("Menu.Pause");
	}

	public onClickKeyConfigMenu = (item: MenuItem, focusedWindow: Electron.BrowserWindow) => {
		if (this._keyConfigWindow != null) {
			this._keyConfigWindow.show();
			return;
		}

		this._keyConfigWindow = new KeyConfigWindow(this.browserWindow, this._config.keyConfig);
		this._keyConfigWindow.on("close", (keyConfig: KeyConfig) => {
			this._config.keyConfig = keyConfig;
			this.send("Get.KeyConfig", keyConfig);
		});
		this._keyConfigWindow.browserWindow.on("close", () => {
			this._keyConfigWindow.browserWindow.destroy();
			this._keyConfigWindow = null;
		});
		this._keyConfigWindow.browserWindow.on("ready-to-show", () => {
			this._keyConfigWindow.show();
		});
	}

	public onClickScreenSizeMenu = (item: MenuItem, focusedWindow: Electron.BrowserWindow, scale: number) => {
		const width = Constants.ScreenWidth * scale;
		const height = Constants.ScreenHeight * scale;
		this.browserWindow.setContentSize(width, height, false);
	}

	public onClickVersionMenu = (item: MenuItem, focusedWindow: Electron.BrowserWindow) => {
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