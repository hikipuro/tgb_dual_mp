import { EventEmitter } from "events";
import * as electron from "electron";
import { remote } from "electron";
const BrowserWindow = remote.BrowserWindow;

export class SaveDialog extends EventEmitter {
	public title: string = null;
	public defaultPath: string = null;
	
	/**
	 * Custom label for the confirmation button,
	 * when left empty the default label will be used.
	 */
	public buttonLabel: string = null;
	public filters: Electron.FileFilter[] = [];
	
	/**
	 * macOS - Message to display above input boxes.
	 */
	public message: string = null;

	/**
	 * macOS - Custom label for the text 
	 * displayed in front of the filename text field.
	 */
	public nameFieldLabel: string = null;

	/**
	 * macOS - Show the tags input box, defaults to true.
	 */
	public showsTagField: boolean = true;

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
		remote.dialog.showSaveDialog(null, options, this.callback);
	}

	public show(): void {
		const options = this.createOptions();
		const browserWindow = this.getFocusedWindow();
		remote.dialog.showSaveDialog(browserWindow, options, this.callback);
	}

	protected callback = (filename: string) => {
		if (filename == null) {
			this.emit(SaveDialog.Events.Cancel);
			return;
		}
		this.emit(SaveDialog.Events.Select, filename);
	}

	protected getFocusedWindow(): Electron.BrowserWindow {
		let browserWindow = BrowserWindow.getFocusedWindow();
		if (browserWindow == null) {
			const windows = BrowserWindow.getAllWindows();
			if (windows != null && windows.length >= 1) {
				browserWindow = windows[0];
			}
		}
		return browserWindow;
	}

	protected createOptions(): Electron.OpenDialogOptions {
		const options: electron.SaveDialogOptions = {
			title: this.title,
			defaultPath: this.defaultPath,
			buttonLabel: this.buttonLabel,
			filters: this.filters,
			message: this.message,
			nameFieldLabel: this.nameFieldLabel,
			showsTagField: this.showsTagField
		};
		return options;
	}
}

export module SaveDialog {
	export module Events {
		export const Select: string = "select";
		export const Cancel: string = "cancel";
	}
}