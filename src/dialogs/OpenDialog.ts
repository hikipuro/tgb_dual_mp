import { EventEmitter } from "events";
import * as Electron from "electron";

export class OpenDialog extends EventEmitter {
	public title: string = null;
	public defaultPath: string = null;

	/**
	 * Custom label for the confirmation button,
	 * when left empty the default label will be used.
	 */
	public buttonLabel: string = null;
	public filters: Electron.FileFilter[] = [];
	public properties: OpenDialog.Properties = new OpenDialog.Properties();

	/**
	 * macOS - Message to display above input boxes.
	 */
	public message: string = null;

	constructor() {
		super();
	}

	public addFilter(name: string, extensions: string[]) {
		this.filters.push({
			name: name,
			extensions: extensions
		});
	}

	public showModeless(): void {
		const options = this.createOptions();
		if (process.type === "renderer") {
			Electron.remote.dialog.showOpenDialog(null, options, this.callback);
		} else {
			Electron.dialog.showOpenDialog(null, options, this.callback);
		}
	}

	public show(): void {
		const options = this.createOptions();
		const browserWindow = this.getFocusedWindow();
		if (process.type === "renderer") {
			Electron.remote.dialog.showOpenDialog(browserWindow, options, this.callback);
		} else {
			Electron.dialog.showOpenDialog(browserWindow, options, this.callback);
		}
	}

	protected callback = (filenames: string[]) => {
		if (filenames == null) {
			this.emit(OpenDialog.Events.Cancel);
			return;
		}
		this.emit(OpenDialog.Events.Select, filenames);
	}

	protected getFocusedWindow(): Electron.BrowserWindow {
		let browserWindow = Electron.BrowserWindow.getFocusedWindow();
		if (browserWindow == null) {
			const windows = Electron.BrowserWindow.getAllWindows();
			if (windows != null && windows.length >= 1) {
				browserWindow = windows[0];
			}
		}
		return browserWindow;
	}

	protected createOptions(): Electron.OpenDialogOptions {
		const options: Electron.OpenDialogOptions = {
			title: this.title,
			defaultPath: this.defaultPath,
			buttonLabel: this.buttonLabel,
			filters: this.filters,
			properties: this.createProperties(),
			message: this.message
		};
		return options;
	}

	protected createProperties(): any {
		let properties: string[] = [];
		if (this.properties.openFile) {
			properties.push("openFile");
		}
		if (this.properties.openDirectory) {
			properties.push("openDirectory");
		}
		if (this.properties.multiSelections) {
			properties.push("multiSelections");
		}
		if (this.properties.showHiddenFiles) {
			properties.push("showHiddenFiles");
		}
		if (this.properties.createDirectory) {
			properties.push("createDirectory");
		}
		if (this.properties.promptToCreate) {
			properties.push("promptToCreate");
		}
		if (this.properties.noResolveAliases) {
			properties.push("noResolveAliases");
		}
		if (this.properties.treatPackageAsDirectory) {
			properties.push("treatPackageAsDirectory");
		}
		return properties;
	}
}

export module OpenDialog {
	export module Events {
		export const Select: string = "select";
		export const Cancel: string = "cancel";
	}

	export class Properties {
		/**
		 * Allow files to be selected.
		 * @default true
		 */
		public openFile: boolean = true;

		/**
		 * Allow directories to be selected.
		 * @default false
		 */
		public openDirectory: boolean = false;
		
		/**
		 * Allow multiple paths to be selected.
		 * @default false
		 */
		public multiSelections: boolean = false;
		
		/**
		 * Show hidden files in dialog.
		 * @default false
		 */
		public showHiddenFiles: boolean = false;
		
		/**
		 * macOS - Allow creating new directories from dialog.
		 * @default false
		 */
		public createDirectory: boolean = false;
		
		/**
		 * Windows - Prompt for creation if the file path entered
		 * in the dialog does not exist.
		 * This does not actually create the file at the path
		 * but allows non-existent paths to be returned
		 * that should be created by the application.
		 * @default false
		 */
		public promptToCreate: boolean = false;
		
		/**
		 * macOS - Disable the automatic alias (symlink) path resolution.
		 * Selected aliases will now return the alias path instead of their target path.
		 * @default false
		 */
		public noResolveAliases: boolean = false;

		/**
		 * macOS - Treat packages, such as .app folders,
		 * as a directory instead of a file.
		 * @default false
		 */
		public treatPackageAsDirectory: boolean = false;
	}
}