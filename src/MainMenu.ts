import * as Electron from "electron";
import * as path from "path";
import * as url from "url";
import * as fs from "fs";

import { MenuItem, ipcMain, IpcMessageEvent, MenuItemConstructorOptions } from "electron";
import { Config } from "./config/Config";

module Settings {
	export const Content: string = "../config/AppMenu.json";
}

export class MainMenu {
	public static Instance: MainMenu = null;

	constructor() {
		MainMenu.Instance = this;
		this.addIpcEvents();
	}

	public static call(methodName: string, ...args: any[]): void {
		ipcMain.emit("App.menu.call", methodName, ...args);
	}

	public createMenu(): Electron.Menu {
		const appMenuFile = path.join(__dirname, Settings.Content);
		const templateMenu = JSON.parse(fs.readFileSync(appMenuFile, "utf8"));
		const languageJson = Config.getLanguageJson();

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

	public findMenuItemById(id: string): Electron.MenuItem {
		if (id == null || id === "") {
			return null;
		}
		const menu = Electron.Menu.getApplicationMenu();
		if (menu == null) {
			return null;
		}
		return this._findMenuItemById(menu.items, id);
	}
	
	protected _findMenuItemById(menuItems: Electron.MenuItem[], id: string): Electron.MenuItem {
		if (menuItems == null) {
			return null;
		}
		const length = menuItems.length;
		for (let i = 0; i < length; i++) {
			const item = menuItems[i];
			if (item.id === id) {
				return item;
			}
			if (item.submenu != null) {
				const foundItem = this._findMenuItemById(item.submenu.items, id);
				if (foundItem == null) {
					continue;
				}
				return foundItem;
			}
		}
	}
	
	public disableAllSaveLoadState(): void {
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

	public checkItem(id: string, checked: boolean): void {
		const menuItem = this.findMenuItemById(id);
		if (menuItem == null) {
			return;
		}
		menuItem.checked = checked;
	}

	public selectGBType(menuItem: MenuItem): void {
		const gb = this.findMenuItemById("option.type.gb");
		const gbc = this.findMenuItemById("option.type.gbc");
		const gba = this.findMenuItemById("option.type.gba");
		const auto = this.findMenuItemById("option.type.auto");

		gb.checked = false;
		gbc.checked = false;
		gba.checked = false;
		auto.checked = false;

		switch (menuItem.id) {
		case gb.id:
			gb.checked = true;
			break;
		case gbc.id:
			gbc.checked = true;
			break;
		case gba.id:
			gba.checked = true;
			break;
		case auto.id:
			auto.checked = true;
			break;
		}
	}

	protected onClickMenuItem = (item: MenuItem, focusedWindow: Electron.BrowserWindow, event: Event): void => {
		ipcMain.emit("App.menu.click", item, focusedWindow, event);
	}

}
