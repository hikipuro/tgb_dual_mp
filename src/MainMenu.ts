import * as Electron from "electron";
import * as path from "path";
import * as url from "url";
import * as fs from "fs";

import { MenuItem, ipcMain, IpcMessageEvent, MenuItemConstructorOptions } from "electron";

module Settings {
	export const Content: string = "../config/AppMenu.json";
	export const LanguagesPath: string = "../languages/";
}

export class MainMenu {
	constructor() {
		this.addIpcEvents();
	}

	public static call(methodName: string, ...args: any[]): void {
		ipcMain.emit("App.menu.call", methodName, ...args);
	}

	public createMenu(): Electron.Menu {
		const appMenuFile = path.join(__dirname, Settings.Content);
		const templateMenu = JSON.parse(fs.readFileSync(appMenuFile, "utf8"));
		const languageJson = this.getLanguageJson();

		this.translateMenuText(templateMenu, languageJson);
		this.addClickEventAllMenuItems(templateMenu, this.onClickMenuItem);
		const menu = Electron.Menu.buildFromTemplate(templateMenu);
		return menu;
	}

	protected addIpcEvents(): void {
		ipcMain.on("App.menu.call", (methodName: string, ...args: any[]) => {
			const method = this[methodName];
			if (method != null && typeof method === "function") {
				method(...args);
			}
		});
	}

	protected removeIpcEvents(): void {
		ipcMain.removeAllListeners("App.menu.call");
	}
	
	protected getLanguageJson(): any {
		const locale: string = Electron.app.getLocale();
		const languageFile: string = path.join(__dirname, Settings.LanguagesPath, locale + ".json");
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

	protected addClickEventAllMenuItems(
		templateMenu: MenuItemConstructorOptions[],
		clickHandler: (item: MenuItem, focusedWindow: Electron.BrowserWindow, event: Event) => void
	): void {
		if (templateMenu == null) {
			return;
		}
		templateMenu.every((options: MenuItemConstructorOptions, index: number): boolean => {
			options.click = clickHandler;
			this.addClickEventAllMenuItems(
				options.submenu as MenuItemConstructorOptions[],
				clickHandler
			);
			return true;
		});
	}
	
	protected disableAllSaveLoadState(): void {
		const menu = Electron.Menu.getApplicationMenu();
		if (menu == null) {
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
			loadItem.enabled = false;
			saveItem.enabled = false;
		}
	}

	protected onClickMenuItem = (item: MenuItem, focusedWindow: Electron.BrowserWindow, event: Event): void => {
		ipcMain.emit("App.menu.click", item, focusedWindow, event);
	}

}
