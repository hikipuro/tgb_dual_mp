import { ipcRenderer, IpcMessageEvent } from "electron";
import { KeyConfig } from "../config/KeyConfig";
import { GamepadConfig } from "../config/GamepadConfig";
import { RendererUtility } from "../RendererUtility";

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

	public initKeyboard(keyConfig: KeyConfig): void {
		this.a.value = keyConfig.a.label;
		this.b.value = keyConfig.b.label;
		this.start.value = keyConfig.start.label;
		this.select.value = keyConfig.select.label;
		this.up.value = keyConfig.up.label;
		this.down.value = keyConfig.down.label;
		this.left.value = keyConfig.left.label;
		this.right.value = keyConfig.right.label;
	}

	public initGamepad(gamepadConfig: GamepadConfig): void {
		this.a.value = gamepadConfig.a.label;
		this.b.value = gamepadConfig.b.label;
		this.start.value = gamepadConfig.start.label;
		this.select.value = gamepadConfig.select.label;
		this.up.value = gamepadConfig.up.label;
		this.down.value = gamepadConfig.down.label;
		this.left.value = gamepadConfig.left.label;
		this.right.value = gamepadConfig.right.label;
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
	public autoFire: HTMLInputElement = null;
	public pause: HTMLInputElement = null;
	public elements: HTMLInputElement[] = [];

	constructor() {
		this.fast = document.querySelector("#fast");
		this.autoFire = document.querySelector("#autoFire");
		this.pause = document.querySelector("#pause");

		this.elements.push(
			this.fast,
			this.autoFire,
			this.pause
		);

		this.elements.forEach((element: HTMLInputElement) => {
			element.addEventListener("focus", this.onFocusInput);
			element.addEventListener("blur", this.onBlurInput);
		});
	}

	public initKeyboard(keyConfig: KeyConfig): void {
		this.fast.value = keyConfig.fast.label;
		this.autoFire.value = keyConfig.autoFire.label;
		this.pause.value = keyConfig.pause.label;
	}
	
	public initGamepad(gamepadConfig: GamepadConfig): void {
		this.fast.value = gamepadConfig.fast.label;
		this.autoFire.value = gamepadConfig.autoFire.label;
		this.pause.value = gamepadConfig.pause.label;
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
	constructor(languageJson: any, keyConfig: KeyConfig, gamepadConfig: GamepadConfig) {
		RendererUtility.overrideConsoleLog();
		keyConfig = KeyConfig.fromJSON(keyConfig);
		gamepadConfig = GamepadConfig.fromJSON(gamepadConfig);
		this.translateText(languageJson);

		let isKeyboard = true;
		const keyboard = document.querySelector("#keyboard") as HTMLInputElement;
		const gamepad = document.querySelector("#gamepad") as HTMLInputElement;
		const keySlot1 = new KeyInputElements("#slot1-");
		const systemKey = new SystemKeyInputElements();

		keySlot1.initKeyboard(keyConfig);
		systemKey.initKeyboard(keyConfig);

		function initLabel() {
			if (isKeyboard) {
				keySlot1.initKeyboard(keyConfig);
				systemKey.initKeyboard(keyConfig);
			} else {
				keySlot1.initGamepad(gamepadConfig);
				systemKey.initGamepad(gamepadConfig);
			}
		}

		keyboard.addEventListener("change", () => {
			isKeyboard = keyboard.checked;
			initLabel();
		});
		gamepad.addEventListener("change", () => {
			isKeyboard = keyboard.checked;
			initLabel();
		});

		document.addEventListener("keydown", (e: KeyboardEvent) => {
			e.preventDefault();
			if (!isKeyboard) {
				return;
			}
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
				updateConfig();
			} else if (systemKey.focusElement != null) {
				let id = systemKey.getFocusElementSubId();
				keyConfig.setValue(id, e.keyCode, key);
				systemKey.focusElement.value = key;
				if (!systemKey.focusNext()) {
					systemKey.blur();
				}
				updateConfig();
			}
		});
		document.addEventListener("keyup", (e: KeyboardEvent) => {
			e.preventDefault();
		});
		document.addEventListener("keypress", (e: KeyboardEvent) => {
			e.preventDefault();
		});
		
		function updateConfig(): void {
			ipcRenderer.send("KeyConfigWindow.apply", keyConfig, gamepadConfig);
		}
		
		// gamepad (debug)
		window.addEventListener("gamepadconnected", (e: GamepadEvent) => {
			console.log("2 Gamepad connected at index %d: %s. %d buttons, %d axes.",
				e.gamepad.index, e.gamepad.id,
				e.gamepad.buttons.length, e.gamepad.axes.length);
			startGamepadPolling();
		});

		let timerId = null;
		function startGamepadPolling(): void {
			timerId = setInterval(checkGamepadButtonPressed, 50);
		}

		function restartGamepadPolling(wait: number = 200): void {
			if (timerId != null) {
				clearInterval(timerId);
			}
			setTimeout(() => {
				startGamepadPolling();
			}, wait);
		}

		function checkGamepadButtonPressed(): void {
			if (isKeyboard) {
				return;
			}
			const gamepads = navigator.getGamepads();
			for (let id = 0; id < gamepads.length; id++) {
				if (gamepads[id] == null) {
					continue;
				}
				const buttons = gamepads[id].buttons;
				for (let b = 0; b < buttons.length; b++) {
					if (!buttons[b].pressed) {
						continue;
					}
					onPressGamepadButton(id, b);
					restartGamepadPolling();
					return;
				}
			}
		}

		function onPressGamepadButton(gamepadId: number, button: number): void {
			if (keySlot1.focusElement != null) {
				let id = keySlot1.getFocusElementSubId();
				gamepadConfig.setValue(id, gamepadId, button);
				keySlot1.focusElement.value = gamepadConfig[id].label;
				if (!keySlot1.focusNext()) {
					keySlot1.blur();
					systemKey.fast.focus();
				}
				updateConfig();
			} else if (systemKey.focusElement != null) {
				let id = systemKey.getFocusElementSubId();
				gamepadConfig.setValue(id, gamepadId, button);
				systemKey.focusElement.value = gamepadConfig[id].label;
				if (!systemKey.focusNext()) {
					systemKey.blur();
				}
				updateConfig();
			}
		}
		
		// disable drag & drop
		document.body.ondragover = () => {
			return false;
		};
		document.body.ondragleave = () => {
			return false;
		}
		document.body.ondragend = () => {
			return false;
		}
		document.body.ondrop = () => {
			return false;
		}
	}

	protected capitalize(text: string): string {
		return text.charAt(0).toUpperCase() + text.slice(1);
	}
	
	protected translateText(languageJson: any): void {
		if (languageJson == null || languageJson.key == null) {
			return;
		}

		const json = languageJson.key;
		if (json.title != null) {
			document.title = json.title;
		}
		
		const elements = {
			slot1: document.querySelector("#slot1-label"),
			a1: document.querySelector("#slot1-a-label"),
			b1: document.querySelector("#slot1-b-label"),
			start1: document.querySelector("#slot1-start-label"),
			select1: document.querySelector("#slot1-select-label"),
			up1: document.querySelector("#slot1-up-label"),
			down1: document.querySelector("#slot1-down-label"),
			left1: document.querySelector("#slot1-left-label"),
			right1: document.querySelector("#slot1-right-label"),
			system: document.querySelector("#system-label"),
			fast: document.querySelector("#fast-label"),
			autoFire: document.querySelector("#autoFire-label"),
			pause: document.querySelector("#pause-label")
		};
		
		for (const name in elements) {
			console.log(name, json[name]);
			if (json[name] == null) {
				continue;
			}
			elements[name].innerText = json[name];
		}
	}
}
