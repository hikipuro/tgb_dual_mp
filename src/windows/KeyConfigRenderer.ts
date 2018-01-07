import { KeyConfig } from "../config/KeyConfig";
import { ipcRenderer, IpcMessageEvent } from "electron";

class KeyInputElements {
	public focusElement: HTMLInputElement = null;
	public a: HTMLInputElement = null;
	public b: HTMLInputElement = null;
	public start: HTMLInputElement = null;
	public select: HTMLInputElement = null;
	public up: HTMLInputElement = null;
	public down: HTMLInputElement = null;
	public left: HTMLInputElement = null;
	public right: HTMLInputElement = null;
	public elements: HTMLInputElement[] = [];

	protected _id: string = "";

	constructor(id: string) {
		this._id = id.replace("#", "");
		this.a = document.querySelector(id + "a");
		this.b = document.querySelector(id + "b");
		this.start = document.querySelector(id + "start");
		this.select = document.querySelector(id + "select");
		this.up = document.querySelector(id + "up");
		this.down = document.querySelector(id + "down");
		this.left = document.querySelector(id + "left");
		this.right = document.querySelector(id + "right");

		this.elements.push(
			this.a, this.b, this.start, this.select,
			this.up, this.down, this.left, this.right
		);

		this.elements.forEach((element: HTMLInputElement) => {
			element.addEventListener("focus", this.onFocusInput);
			element.addEventListener("blur", this.onBlurInput);
		});
	}

	public setLabel(keyConfig: KeyConfig): void {
		this.a.value = keyConfig.a.label;
		this.b.value = keyConfig.b.label;
		this.start.value = keyConfig.start.label;
		this.select.value = keyConfig.select.label;
		this.up.value = keyConfig.up.label;
		this.down.value = keyConfig.down.label;
		this.left.value = keyConfig.left.label;
		this.right.value = keyConfig.right.label;
	}

	public indexOf(element: HTMLInputElement): number {
		return this.elements.indexOf(element);
	}

	public focus(index: number): boolean {
		const element = this.elements[index];
		if (element == null) {
			return false;
		}
		element.focus();
		return true;
	}

	public focusNext(): boolean {
		const element = this.focusElement;
		const index = this.indexOf(element);
		return this.focus(index + 1);
	}

	public blur(): void {
		if (this.focusElement == null) {
			return;
		}
		this.focusElement.blur();
		this.focusElement = null;
	}

	public getFocusElementSubId(): string {
		if (this.focusElement == null) {
			return "";
		}
		let id = this.focusElement.id;
		id = id.replace(this._id, "");
		return id;
	}

	protected onFocusInput = (e: Event): void => {
		this.focusElement = e.srcElement as HTMLInputElement;
	}

	protected onBlurInput = (e: Event): void => {
		this.focusElement = null;
	}
}

class SystemKeyInputElements {
	public focusElement: HTMLInputElement = null;
	public fast: HTMLInputElement = null;
	public elements: HTMLInputElement[] = [];

	constructor() {
		this.fast = document.querySelector("#fast");

		this.elements.push(
			this.fast
		);

		this.elements.forEach((element: HTMLInputElement) => {
			element.addEventListener("focus", this.onFocusInput);
			element.addEventListener("blur", this.onBlurInput);
		});
	}

	public setLabel(keyConfig: KeyConfig): void {
		this.fast.value = keyConfig.fast.label;
	}

	public indexOf(element: HTMLInputElement): number {
		return this.elements.indexOf(element);
	}

	public focus(index: number): boolean {
		const element = this.elements[index];
		if (element == null) {
			return false;
		}
		element.focus();
		return true;
	}

	public focusNext(): boolean {
		const element = this.focusElement;
		const index = this.indexOf(element);
		return this.focus(index + 1);
	}

	public blur(): void {
		if (this.focusElement == null) {
			return;
		}
		this.focusElement.blur();
		this.focusElement = null;
	}

	public getFocusElementSubId(): string {
		if (this.focusElement == null) {
			return "";
		}
		let id = this.focusElement.id;
		//id = id.replace(this._id, "");
		return id;
	}

	protected onFocusInput = (e: Event): void => {
		this.focusElement = e.srcElement as HTMLInputElement;
	}

	protected onBlurInput = (e: Event): void => {
		this.focusElement = null;
	}
}

export class KeyConfigRenderer {
	constructor(keyConfig: KeyConfig) {
		keyConfig = KeyConfig.fromJSON(keyConfig);
		const buttonOK = document.querySelector("#ok");
		const keySlot1 = new KeyInputElements("#slot1-");
		const systemKey = new SystemKeyInputElements();

		console.log("keyConfig", keyConfig);
		keySlot1.setLabel(keyConfig);
		systemKey.setLabel(keyConfig);

		buttonOK.addEventListener("click", () => {
			ipcRenderer.send("KeyConfigWindow.Result", keyConfig);
			//var window = remote.getCurrentWindow();
			//window.close();
		});

		document.addEventListener("keydown", (e: KeyboardEvent) => {
			e.preventDefault();
			if (e.repeat) {
				return;
			}
			const key = this.capitalize(e.key);
			if (keySlot1.focusElement != null) {
				let id = keySlot1.getFocusElementSubId();
				keyConfig.setValue(id, e.keyCode, key);
				//keyConfig["label" + this.capitalize(id)] = key;
				//console.log(keyConfig);
				keySlot1.focusElement.value = key;
				if (!keySlot1.focusNext()) {
					keySlot1.blur();
					systemKey.fast.focus();
				}
			} else if (systemKey.focusElement != null) {
				let id = systemKey.getFocusElementSubId();
				keyConfig.setValue(id, e.keyCode, key);
				systemKey.focusElement.value = key;
				if (!systemKey.focusNext()) {
					systemKey.blur();
				}
			}
		});
		document.addEventListener("keyup", (e: KeyboardEvent) => {
			e.preventDefault();
		});
		document.addEventListener("keypress", (e: KeyboardEvent) => {
			e.preventDefault();
		});
	}

	protected capitalize(text: string): string {
		return text.charAt(0).toUpperCase() + text.slice(1);
	}
}
