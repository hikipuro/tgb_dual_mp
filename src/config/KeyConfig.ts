import { KeyCode } from "../KeyCode";

class KeyInfo {
	public code: number;
	public label: string;
	constructor(code: number, label: string) {
		this.set(code, label);
	}
	public set(code: number, label: string) {
		this.code = code;
		this.label = label;
	}
	public static fromJSON(json: any): KeyInfo {
		if (json == null || json.code == null || json.label == null) {
			return null;
		}
		return new KeyInfo(json.code, json.label);
	}
}

export class KeyConfig {
	public a: KeyInfo = new KeyInfo(KeyCode.X, "X");
	public b: KeyInfo = new KeyInfo(KeyCode.Z, "Z");
	public start: KeyInfo = new KeyInfo(KeyCode.Enter, "Enter");
	public select: KeyInfo = new KeyInfo(KeyCode.Shift, "Shift");
	public up: KeyInfo = new KeyInfo(KeyCode.Up, "ArrowUp");
	public down: KeyInfo = new KeyInfo(KeyCode.Down, "ArrowDown");
	public left: KeyInfo = new KeyInfo(KeyCode.Left, "ArrowLeft");
	public right: KeyInfo = new KeyInfo(KeyCode.Right, "ArrowRight");
	public fast: KeyInfo = new KeyInfo(KeyCode.Tab, "Tab");
	public autoFire: KeyInfo = new KeyInfo(KeyCode.A, "A");
	public pause: KeyInfo = new KeyInfo(KeyCode.P, "P");

	public setValue(id: string, code: number, label: string): void {
		if (id == null || !this.hasOwnProperty(id)) {
			return;
		}
		this[id].set(code, label);
	}

	public static fromJSON(json: any): KeyConfig {
		const keyConfig = new KeyConfig();
		if (json == null) {
			return keyConfig;
		}

		for (var name in keyConfig) {
			if (!keyConfig.hasOwnProperty(name)) {
				continue;
			}
			if (json[name] == null) {
				continue;
			}
			const keyInfo = KeyInfo.fromJSON(json[name]);
			if (keyInfo != null) {
				keyConfig[name] = keyInfo;
			}
		}
		return keyConfig;
	}
}
