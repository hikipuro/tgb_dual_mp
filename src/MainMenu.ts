import * as Electron from "electron";
import * as path from "path";
import * as url from "url";
import * as fs from "fs";

import { EventEmitter } from "events";
import { MenuItem, ipcMain, IpcMessageEvent } from "electron";
import { Config } from "./config/Config";

module Settings {
	export const Content: string = "../config/AppMenu.json";
}

class MenuTemplate {
	public data: Electron.MenuItemConstructorOptions[] = null;
	protected _itemCache: object = {};

	constructor() {
	}

	public load(path: string): void {
		if (!fs.existsSync(path)) {
			return;
		}
		this.data = JSON.parse(fs.readFileSync(path, "utf8"));
		this._itemCache = {};
	}

	public build(): Electron.Menu {
		if (this.data == null) {
			return null;
		}
		return Electron.Menu.buildFromTemplate(this.data);
	}
	
	public translateText(languageJson: any): void {
		if (this.data == null || languageJson == null) {
			return;
		}
		this.translateSubMenuText(this.data, languageJson);
	}

	public translateSubMenuText(submenu: Electron.MenuItemConstructorOptions[], languageJson: any): void {
		if (submenu == null || languageJson == null) {
			return;
		}
		submenu.every((options: Electron.MenuItemConstructorOptions, index: number): boolean => {
			const text: string = languageJson.menu[options.id];
			if (text == null || text === "") {
				return true;
			}
			options.label = text;
			this.translateSubMenuText(
				options.submenu as Electron.MenuItemConstructorOptions[],
				languageJson
			);
			return true;
		});
	}

	public setClickEventAllMenuItems(
		clickHandler: (item: Electron.MenuItem, focusedWindow: Electron.BrowserWindow, event: Event) => void
	): void {
		if (this.data == null) {
			return;
		}
		this.setClickEventMenuItems(this.data, clickHandler);
	}
	
	public setClickEventMenuItems(
		templateMenu: Electron.MenuItemConstructorOptions[],
		clickHandler: (item: Electron.MenuItem, focusedWindow: Electron.BrowserWindow, event: Event) => void
	): void {
		if (templateMenu == null) {
			return;
		}
		templateMenu.every((options: Electron.MenuItemConstructorOptions, index: number): boolean => {
			options.click = clickHandler;
			this.setClickEventMenuItems(
				options.submenu as Electron.MenuItemConstructorOptions[],
				clickHandler
			);
			return true;
		});
	}

	public getItemById(id: string): Electron.MenuItemConstructorOptions {
		if (id == null || id === "") {
			return null;
		}
		if (this._itemCache[id] != null) {
			return this._itemCache[id];
		}
		const item = this._getItemById(this.data, id);
		if (item != null) {
			this._itemCache[id] = item;
		}
		return item;
	}
	
	protected _getItemById(
		templateMenu: Electron.MenuItemConstructorOptions[],
		id: string
	): Electron.MenuItemConstructorOptions {
		if (id == null || id === "") {
			return null;
		}
		for (let i = 0; i < templateMenu.length; i++) {
			const item = templateMenu[i];
			if (item.id === id) {
				return item;
			}
			if (item.submenu == null) {
				continue;
			}
			const subItem = this._getItemById(
				item.submenu as Electron.MenuItemConstructorOptions[],
				id
			);
			if (subItem != null) {
				return subItem;
			}
		}
		return null;
	}
}

export class MainMenu extends EventEmitter {
	public static Instance: MainMenu = null;
	protected _menu: Electron.Menu = null;
	protected _template: MenuTemplate = null;

	constructor() {
		super();
		MainMenu.Instance = this;
		this.addIpcEvents();
	}

	public static call(methodName: string, ...args: any[]): void {
		ipcMain.emit("App.menu.call", methodName, ...args);
	}

	public createMenu(): void {
		const appMenuFile = path.join(__dirname, Settings.Content);
		const languageJson = Config.getLanguageJson();

		this._template = new MenuTemplate();
		this._template.load(appMenuFile);
		this._template.translateText(languageJson);
		this._template.setClickEventAllMenuItems(this.onClickMenuItem);

		this._menu = this._template.build();
		this.emit("update", this._menu);
	}

	public rebuild(): void {
		this._menu = this._template.build();
		this.emit("update", this._menu);
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

	public disableAllSaveLoadState(): void {
		for (let i = 1; i < 10; i++) {
			const loadItemId = "file.load-state." + i;
			const loadItem = this._template.getItemById(loadItemId);
			const saveItemId = "file.save-state." + i;
			const saveItem = this._template.getItemById(saveItemId);
			if (loadItem == null || saveItem == null) {
				continue;
			}
			loadItem.enabled = false;
			saveItem.enabled = false;
		}
		this.rebuild();
	}

	public checkItem(id: string, checked: boolean): void {
		const menuItem = this._template.getItemById(id);
		if (menuItem == null) {
			return;
		}
		menuItem.checked = checked;
		this.rebuild();
	}

	public enableItem(id: string, enabled: boolean): void {
		const menuItem = this._template.getItemById(id);
		if (menuItem == null) {
			return;
		}
		menuItem.enabled = enabled;
		this.rebuild();
	}

	public selectGBType(menuItem: MenuItem): void {
		const gb = this._template.getItemById("option.type.gb");
		const gbc = this._template.getItemById("option.type.gbc");
		const gba = this._template.getItemById("option.type.gba");
		const auto = this._template.getItemById("option.type.auto");

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
		this.rebuild();
	}

	protected onClickMenuItem = (item: MenuItem, focusedWindow: Electron.BrowserWindow, event: Event): void => {
		ipcMain.emit("App.menu.click", item, focusedWindow, event);
	}

}
