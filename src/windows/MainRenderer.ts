import * as Electron from "electron";
import { ipcRenderer, MenuItem } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as nodeZip from "node-zip";

import { KeyCode } from "../KeyCode";
import { TgbDual } from "../TgbDual";
import { Config } from "../config/Config";
import { Gamepads } from "../Gamepads";

let tgbDual: TgbDual;
let config: Config;
const defaultTitle: string = document.title;

// uncaught exception
window.onerror = function (message, filename, lineno, colno, error) {
	console.log("window.onerror", message);
	tgbDual.stop();
}

document.addEventListener("DOMContentLoaded", () => {
	ipcRenderer.on("menu", (event: Electron.IpcMessageEvent, menu: MenuItem) => {
		console.log("menu", menu);
		switch (menu.id) {
		case "file.reset-slot1":
			tgbDual.reset();
			break;
		case "file.pause":
			tgbDual.pause();
			break;
		case "file.release-slot1":
			tgbDual.stop();
			document.title = defaultTitle;
			break;
		}
	});
	ipcRenderer.on("load", (event: Electron.IpcMessageEvent, arg: any) => {
		loadFile(arg);
	});
	ipcRenderer.on("Get.Config", (event: Electron.IpcMessageEvent, arg: any) => {
		config = Config.fromJSON(arg);
		tgbDual.pathConfig = config.pathConfig;
		console.log("Get.Config", config);
	});
	ipcRenderer.on("blur", (event: Electron.IpcMessageEvent, arg: any) => {
		console.log("blur");
	});
	ipcRenderer.send("Get.Config");

	TgbDual.oninit = () => {
		console.log("*** oninit");
		tgbDual = new TgbDual();

		document.body.appendChild(tgbDual.element);
		tgbDual.on("update", updateGamepad);
	};

	// close
	window.onbeforeunload = (e: BeforeUnloadEvent) => {
		tgbDual.stop();
		tgbDual.destroy();
	};

	// window resize
	window.onresize = () => {
		const width = window.innerWidth;
		const height = window.innerHeight;
		const ratio = width / height;
		const style = tgbDual.element.style;

		if (TgbDual.ScreenRatio <= ratio) {
			style.width = null;
			style.height = "100%";
		} else {
			style.width = "100%";
			style.height = null;
		}
	}
	
	// drag & drop
	document.body.ondragover = () => {
		return false;
	};
	document.body.ondragleave = () => {
		return false;
	}
	document.body.ondragend = () => {
		return false;
	}
	document.body.ondrop = (e) => {
		console.log("*************** ondrop");
		e.preventDefault();
		if (!TgbDual.isInitialized) {
			return;
		}
		const file = e.dataTransfer.files[0];
		loadFile(file.path);
	}

	function loadFile(filePath: string): void {
		const ext = path.extname(filePath).toLowerCase();
		console.log(filePath, "ext:" + ext);

		if (ext === ".zip") {
			loadZipFile(filePath);
			return;
		}

		if (ext === ".gb" || ext === ".gbc") {
			tgbDual.stop();
			tgbDual.loadFile(filePath);
			tgbDual.start();
			const romInfo = tgbDual.getInfo();
			document.title = romInfo.cartName;
			console.log("romInfo", romInfo, romInfo.cartName.length);
		}
	}

	function loadZipFile(zipPath: string): void {
		if (!fs.existsSync(zipPath)) {
			return;
		}
		const zipData = fs.readFileSync(zipPath);
		if (zipData == null) {
			return;
		}
		const zip = new nodeZip(zipData, {
			base64: false,
			checkCRC32: true
		});
		for (let file in zip.files) {
			const ext = path.extname(file).toLowerCase();
			console.log("zip", file, ext);
			if (ext !== ".gb" && ext !== ".gbc") {
				continue;
			}
			const data = zip.files[file].asNodeBuffer();
			tgbDual.stop();
			tgbDual.romPath = zipPath;
			tgbDual.loadRom(data);
			tgbDual.start();

			const romInfo = tgbDual.romInfo;
			document.title = romInfo.cartName;
			break;
		}
	}

	// key input
	document.onkeydown = (e: KeyboardEvent) => {
		const keyConfig = config.keyConfig;
		const keyState = tgbDual.keyState;
		switch (e.keyCode) {
			case keyConfig.up.code:		keyState.Up = true; break;
			case keyConfig.down.code:	keyState.Down = true; break;
			case keyConfig.left.code:	keyState.Left = true; break;
			case keyConfig.right.code:	keyState.Right = true; break;
			case keyConfig.start.code:	keyState.Start = true; break;
			case keyConfig.select.code:	keyState.Select = true; break;
			case keyConfig.b.code:		keyState.B = true; break;
			case keyConfig.a.code:		keyState.A = true; break;
			case keyConfig.fast.code:	tgbDual.isFastMode = true; break;

			case KeyCode.D0:
				tgbDual.saveState();
				break;
			case KeyCode.D9:
				tgbDual.restoreState();
				break;
		}
	};
	document.onkeyup = (e: KeyboardEvent) => {
		const keyConfig = config.keyConfig;
		const keyState = tgbDual.keyState;
		switch (e.keyCode) {
			case keyConfig.up.code:		keyState.Up = false; break;
			case keyConfig.down.code:	keyState.Down = false; break;
			case keyConfig.left.code:	keyState.Left = false; break;
			case keyConfig.right.code:	keyState.Right = false; break;
			case keyConfig.start.code:	keyState.Start = false; break;
			case keyConfig.select.code:	keyState.Select = false; break;
			case keyConfig.b.code:		keyState.B = false; break;
			case keyConfig.a.code:		keyState.A = false; break;
			case keyConfig.fast.code:	tgbDual.isFastMode = false; break;
		}
	};
	let gamePads: Gamepads = new Gamepads();

	function updateGamepad() {
		const keyState = tgbDual.keyState;
		gamePads.update();
		if (gamePads.isKeyDown(0, 1)) {
			keyState.A = true;
		} else if (gamePads.isKeyUp(0, 1)) {
			keyState.A = false;
		}
		
		if (gamePads.isKeyDown(0, 0)) {
			keyState.B = true;
		} else if (gamePads.isKeyUp(0, 0)) {
			keyState.B = false;
		}
		
		if (gamePads.isKeyDown(0, 2)) {
			keyState.Select = true;
		} else if (gamePads.isKeyUp(0, 2)) {
			keyState.Select = false;
		}
		
		if (gamePads.isKeyDown(0, 3)) {
			keyState.Start = true;
		} else if (gamePads.isKeyUp(0, 3)) {
			keyState.Start = false;
		}
		
		if (gamePads.isKeyDown(0, 12)) {
			keyState.Up = true;
		} else if (gamePads.isKeyUp(0, 12)) {
			keyState.Up = false;
		}
		
		if (gamePads.isKeyDown(0, 13)) {
			keyState.Down = true;
		} else if (gamePads.isKeyUp(0, 13)) {
			keyState.Down = false;
		}
		
		if (gamePads.isKeyDown(0, 14)) {
			keyState.Left = true;
		} else if (gamePads.isKeyUp(0, 14)) {
			keyState.Left = false;
		}
		
		if (gamePads.isKeyDown(0, 15)) {
			keyState.Right = true;
		} else if (gamePads.isKeyUp(0, 15)) {
			keyState.Right = false;
		}
	};
	//*/

	window.addEventListener("gamepadconnected", (e: GamepadEvent) => {
		console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
		e.gamepad.index, e.gamepad.id,
		e.gamepad.buttons.length, e.gamepad.axes.length);
	});
});
