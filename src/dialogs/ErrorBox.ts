import { EventEmitter } from "events";
import * as electron from "electron";
import { remote } from "electron";

export class ErrorBox {
	/**
	 * The title to display in the error box.
	 */
	public title: string = "";

	/**
	 * The text content to display in the error box.
	 */
	public content: string = "";

	constructor() {
	}

	public show(): void {
		remote.dialog.showErrorBox(this.title, this.content);
	}
}