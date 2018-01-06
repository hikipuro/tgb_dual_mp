import { EventEmitter } from "events";
import * as electron from "electron";
import { remote, NativeImage } from "electron";
const BrowserWindow = remote.BrowserWindow;

export class MessageBox extends EventEmitter {
	/**
	 * Can be "none", "info", "error", "question" or "warning".
	 * On Windows, "question" displays the same icon as "info",
	 * unless you set an icon using the "icon" option.
	 * On macOS, both "warning" and "error" display the same warning icon.
	 */
	public type: string = null;

	/**
	 * Array of texts for buttons.
	 * On Windows, an empty array will result in one button labeled "OK".
	 */
	public buttons: string[] = null;

	/**
	 * Index of the button in the buttons array
	 * which will be selected by default when the message box opens.
	 */
	public defaultId: number = null;

	/**
	 * Title of the message box, some platforms will not show it.
	 */
	public title: string = null;

	/**
	 * Content of the message box.
	 */
	public message: string = "";

	/**
	 * Extra information of the message.
	 */
	public detail: string = null;

	/**
	 * If provided, the message box will include a checkbox with the given label.
	 * The checkbox state can be inspected only when using callback.
	 */
	public checkboxLabel: string = null;

	/**
	 * Initial checked state of the checkbox.
	 * false by default.
	 */
	public checkboxChecked: boolean = null;

	public icon: NativeImage = null;
	
	/**
	 * The index of the button to be used to cancel the dialog, via the Esc key.
	 * By default this is assigned to the first button with "cancel" or "no" as the label.
	 * If no such labeled buttons exist and this option is not set,
	 * 0 will be used as the return value or callback response.
	 * This option is ignored on Windows.
	 */
	public cancelId: number = null;

	/**
	 * On Windows Electron will try to figure out
	 * which one of the buttons are common buttons (like "Cancel" or "Yes"),
	 * and show the others as command links in the dialog.
	 * This can make the dialog appear in the style of modern Windows apps.
	 * If you don't like this behavior, you can set noLink to true.
	 */
	public noLink: boolean = null;

	/**
	 * Normalize the keyboard access keys across platforms.
	 * Default is false.
	 * Enabling this assumes & is used in the button labels
	 * for the placement of the keyboard shortcut access key and labels
	 * will be converted so they work correctly on each platform,
	 * & characters are removed on macOS,
	 * converted to _ on Linux, and left untouched on Windows.
	 * For example, a button label of Vie&w will be converted to Vie_w
	 * on Linux and View on macOS and can be selected via Alt-W on Windows and Linux.
	 */
	public normalizeAccessKeys: boolean = null;
	
	constructor() {
		super();
	}

	public addButton(text: string): void {
		if (this.buttons == null) {
			this.buttons = [];
		}
		this.buttons.push(text);
	}

	public showModeless(): void {
		var options = this.createOptions();
		remote.dialog.showMessageBox(null, options, this.callback);
	}

	public show(): void {
		var options = this.createOptions();
		var browserWindow = this.getFocusedWindow();
		remote.dialog.showMessageBox(browserWindow, options, this.callback);
	}

	protected callback = (response: number, checkboxChecked: boolean) => {
		this.emit(MessageBox.Events.Select, response, checkboxChecked);
	}

	protected getFocusedWindow(): Electron.BrowserWindow {
		var browserWindow = BrowserWindow.getFocusedWindow();
		if (browserWindow == null) {
			const windows = BrowserWindow.getAllWindows();
			if (windows != null && windows.length >= 1) {
				browserWindow = windows[0];
			}
		}
		return browserWindow;
	}

	protected createOptions(): Electron.MessageBoxOptions {
		const options: electron.MessageBoxOptions = {
			type: this.type,
			buttons: this.buttons,
			defaultId: this.defaultId,
			title: this.title,
			message: this.message,
			detail: this.detail,
			checkboxLabel: this.checkboxLabel,
			checkboxChecked: this.checkboxChecked,
			icon: this.icon,
			cancelId: this.cancelId,
			noLink: this.noLink,
			normalizeAccessKeys: this.normalizeAccessKeys
		};
		return options;
	}
}

export module MessageBox {
	export module Events {
		export const Select: string = "select";
	}
}