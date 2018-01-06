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

	public setValue(id: string, code: number, label: string): void {
		console.log(this[id]);
		this[id].set(code, label);
	}

	public static fromJSON(json: any): KeyConfig {
		const keyConfig = new KeyConfig();
		
		let keyInfo: KeyInfo;
		
		keyInfo = KeyInfo.fromJSON(json.a);
		if (keyInfo != null) { keyConfig.a = keyInfo; }

		keyInfo = KeyInfo.fromJSON(json.b);
		if (keyInfo != null) { keyConfig.b = keyInfo; }

		keyInfo = KeyInfo.fromJSON(json.start);
		if (keyInfo != null) { keyConfig.start = keyInfo; }

		keyInfo = KeyInfo.fromJSON(json.select);
		if (keyInfo != null) { keyConfig.select = keyInfo; }

		keyInfo = KeyInfo.fromJSON(json.up);
		if (keyInfo != null) { keyConfig.up = keyInfo; }

		keyInfo = KeyInfo.fromJSON(json.down);
		if (keyInfo != null) { keyConfig.down = keyInfo; }

		keyInfo = KeyInfo.fromJSON(json.left);
		if (keyInfo != null) { keyConfig.left = keyInfo; }

		keyInfo = KeyInfo.fromJSON(json.right);
		if (keyInfo != null) { keyConfig.right = keyInfo; }

		keyInfo = KeyInfo.fromJSON(json.fast);
		if (keyInfo != null) { keyConfig.fast = keyInfo; }
		return keyConfig;
	}
}
