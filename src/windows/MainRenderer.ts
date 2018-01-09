import * as Electron from "electron";
import { ipcRenderer, MenuItem } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as nodeZip from "node-zip";

import { KeyCode } from "../KeyCode";
import { TgbDual } from "../TgbDual";
import { Config } from "../config/Config";
import { Gamepads } from "../Gamepads";
import { MainWindow } from "../windows/MainWindow";
import { ScreenConfig } from "../config/ScreenConfig";
import { SoundConfig } from "../config/SoundConfig";

declare module "electron" {
	interface MenuItem {
		id: string;
	}
}

export class MainRenderer {
	protected tgbDual: TgbDual;
	protected config: Config;
	protected readonly defaultTitle: string = MainWindow.Settings.Title;
	protected gamePads: Gamepads = new Gamepads();
	protected commandLineArgs: string[] = [];
	protected mainElement: HTMLElement;
	protected messageOuterElement: HTMLElement;
	protected messageElement: HTMLElement;
	
	constructor(commandLineArgs: string[]) {
		this.commandLineArgs = commandLineArgs;
		this.mainElement = document.getElementById("main");
		this.messageOuterElement = document.getElementById("message-outer");
		this.messageElement = document.getElementById("message");
		this.messageElement.addEventListener("webkitAnimationEnd", () => {
			this.messageElement.classList.remove("show");
		});

		this.initIPC();
		this.initWindowEvents();
		this.initDocumentEvents();
		this.config = ipcRenderer.sendSync("MainWindow.getConfig");

		console.log("TgbDual.isInitialized: ", TgbDual.isInitialized);
		if (TgbDual.isInitialized) {
			this.createNewTgbDual();
		} else {
			TgbDual.oninit = () => {
				console.log("*** oninit");
				this.createNewTgbDual();
			};
		}
	}

	protected createNewTgbDual(): void {
		this.tgbDual = new TgbDual();
		this.tgbDual.element.style.width = "100%";
		this.tgbDual.element.style.height = "100%";
		this.mainElement.insertBefore(
			this.tgbDual.element,
			this.mainElement.firstChild
		);
		this.tgbDual.pathConfig = this.config.path;
		this.tgbDual.on("start", () => {
			this.updateScreenConfig(this.config.screen);
			this.updateSoundConfig(this.config.sound);
		});
		this.tgbDual.on("update", this.updateGamepad);
		this.adjustScreenSize();
		this.updateScreenSmoothing();

		if (this.commandLineArgs != null) {
			//console.log("commandLineArgs", this.commandLineArgs);
			const length = this.commandLineArgs.length;
			for (let i = 0; i < length; i++) {
				const arg = this.commandLineArgs[i];
				if (arg == null || arg === "") {
					continue;
				}
				const pathInfo = path.parse(arg);
				const ext = pathInfo.ext.toLowerCase();
				if (ext != ".gb" && ext != ".gbc") {
					continue;
				}
				if (!fs.existsSync(arg)) {
					continue;
				}
				this.loadFile(arg);
				break;
			}
		}
	}

	protected initIPC(): void {
		ipcRenderer.on("MainWindow.log", (event: Electron.IpcMessageEvent, ...args) => {
			console.log(...args);
		});
		ipcRenderer.on("MainWindow.menu", (event: Electron.IpcMessageEvent, menu: MenuItem) => {
			console.log("MainWindow.menu", menu);

			const id = menu.id;
			
			if (id.indexOf("file.save-state.") === 0) {
				if (this.tgbDual.isPaused) {
					return;
				}
				const fileNumber = Number(id.substr(-1, 1));
				console.log("save", fileNumber);
				this.tgbDual.saveState(fileNumber);
				ipcRenderer.send("MainWindow.updateSaveLoadStateMenu", this.tgbDual.romPath);
				this.showMessage("Save state: " + fileNumber);
				return;
			}

			if (id.indexOf("file.load-state.") === 0) {
				if (this.tgbDual.isPaused) {
					return;
				}
				const fileNumber = Number(id.substr(-1, 1));
				console.log("restore", fileNumber);
				this.tgbDual.restoreState(fileNumber);
				this.showMessage("Load state: " + fileNumber);
				return;
			}

			switch (id) {
			case "file.reset-slot1":
				if (this.tgbDual.isFileLoaded) {
					this.tgbDual.reset();
					this.updateScreenConfig(this.config.screen);
					this.updateSoundConfig(this.config.sound);
					this.showMessage("Reset");
				}
				break;
			case "file.pause":
				if (this.tgbDual.isFileLoaded) {
					this.tgbDual.pause();
					if (this.tgbDual.isPaused) {
						this.showMessage("Pause");
					} else {
						this.showMessage("Resume");
					}
				}
				break;
			case "file.release-slot1":
				if (this.tgbDual.isFileLoaded) {
					this.tgbDual.stop();
					document.title = this.defaultTitle;
					ipcRenderer.send("MainWindow.updateSaveLoadStateMenu", null);
					this.showMessage("Release");
				}
				break;
			case "option.screen.aspect-ratio":
				this.config.screen.fixedAspectRatio = menu.checked;
				this.adjustScreenSize();
				break;
			case "option.screen.smoothing":
				this.config.screen.smoothing = menu.checked;
				this.updateScreenSmoothing();
				break;
			case "option.record.screen":
				this.screenshot();
				break;
			case "option.record.sound":
				this.recordSound();
				break;
			}
		});
		ipcRenderer.on("MainWindow.load", (event: Electron.IpcMessageEvent, arg: any) => {
			this.loadFile(arg);
		});
		ipcRenderer.on("MainWindow.getConfig", (event: Electron.IpcMessageEvent, arg: any) => {
			this.config = Config.fromJSON(arg);
			this.tgbDual.pathConfig = this.config.path;
			console.log("MainWindow.getConfig", this.config);
		});
		ipcRenderer.on("MainWindow.screenConfig", (event: Electron.IpcMessageEvent, arg: any) => {
			console.log("MainWindow.screenConfig", arg.screen);
			this.config = Config.fromJSON(arg);
			this.updateScreenConfig(this.config.screen);
		});
		ipcRenderer.on("MainWindow.soundConfig", (event: Electron.IpcMessageEvent, arg: any) => {
			console.log("MainWindow.soundConfig", arg.sound);
			this.config = Config.fromJSON(arg);
			this.updateSoundConfig(this.config.sound);
		});
		ipcRenderer.on("MainWindow.pathConfig", (event: Electron.IpcMessageEvent, arg: any) => {
			console.log("MainWindow.pathConfig", arg.path);
			this.config = Config.fromJSON(arg);
			this.tgbDual.pathConfig = this.config.path;
		});
		ipcRenderer.on("MainWindow.miscConfig.type", (event: Electron.IpcMessageEvent, arg: any) => {
			console.log("MainWindow.miscConfig.type", arg);
			this.config = Config.fromJSON(arg);
			this.tgbDual.setGBType(this.config.misc.type);
		});
		/*
		ipcRenderer.on("blur", (event: Electron.IpcMessageEvent, arg: any) => {
			console.log("blur");
		});

		ipcRenderer.on("suspend", (event: Electron.IpcMessageEvent, arg: any) => {
			console.log("suspend");
		});
		ipcRenderer.on("resume", (event: Electron.IpcMessageEvent, arg: any) => {
			console.log("resume");
		});
		ipcRenderer.on("hide", (event: Electron.IpcMessageEvent, arg: any) => {
			console.log("hide");
		});
		ipcRenderer.on("show", (event: Electron.IpcMessageEvent, arg: any) => {
			console.log("show");
		});
		//*/
	}

	protected initWindowEvents(): void {
		// uncaught exception
		window.onerror = (message, filename, lineno, colno, error) => {
			console.log("window.onerror", message);
			if (this.tgbDual != null) {
				this.tgbDual.stop();
			}
		}
		
		// window resize
		window.onresize = () => {
			this.adjustScreenSize();
		}
		
		// window close
		window.onbeforeunload = (e: BeforeUnloadEvent) => {
			if (this.tgbDual == null) {
				return;
			}
			this.tgbDual.stop();
			this.tgbDual.destroy();
		};

		// gamepad (debug)
		window.addEventListener("gamepadconnected", (e: GamepadEvent) => {
			console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
			e.gamepad.index, e.gamepad.id,
			e.gamepad.buttons.length, e.gamepad.axes.length);
		});
	}

	protected initDocumentEvents(): void {
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
			this.loadFile(file.path);
		}
		
		// keyboard input
		document.onkeydown = (e: KeyboardEvent) => {
			//e.preventDefault();
			if (e.repeat) {
				return;
			}
			const keyConfig = this.config.key;
			const keyState = this.tgbDual.keyState;
			switch (e.keyCode) {
			case keyConfig.up.code:		keyState.Up = true; break;
			case keyConfig.down.code:	keyState.Down = true; break;
			case keyConfig.left.code:	keyState.Left = true; break;
			case keyConfig.right.code:	keyState.Right = true; break;
			case keyConfig.start.code:	keyState.Start = true; break;
			case keyConfig.select.code:	keyState.Select = true; break;
			case keyConfig.b.code:		keyState.B = true; break;
			case keyConfig.a.code:		keyState.A = true; break;
			case keyConfig.fast.code:
				this.tgbDual.isFastMode = true;
				this.showMessage("Fast mode: on");
				break;
			case keyConfig.pause.code:
				this.tgbDual.pause();
				if (this.tgbDual.isPaused) {
					this.showMessage("Pause");
				} else {
					this.showMessage("Resume");
				}
				break;
			}
		};
		document.onkeyup = (e: KeyboardEvent) => {
			//e.preventDefault();
			if (e.repeat) {
				return;
			}
			const keyConfig = this.config.key;
			const keyState = this.tgbDual.keyState;
			switch (e.keyCode) {
			case keyConfig.up.code:		keyState.Up = false; break;
			case keyConfig.down.code:	keyState.Down = false; break;
			case keyConfig.left.code:	keyState.Left = false; break;
			case keyConfig.right.code:	keyState.Right = false; break;
			case keyConfig.start.code:	keyState.Start = false; break;
			case keyConfig.select.code:	keyState.Select = false; break;
			case keyConfig.b.code:		keyState.B = false; break;
			case keyConfig.a.code:		keyState.A = false; break;
			case keyConfig.fast.code:
				this.tgbDual.isFastMode = false;
				this.showMessage("Fast mode: off");
				break;
			}
		};
	}

	protected adjustScreenSize(): void {
		const width = window.innerWidth;
		const height = window.innerHeight;
		const ratio = width / height;
		const style = this.mainElement.style;

		this.adjustMessageTextSize();

		if (!this.config.screen.fixedAspectRatio) {
			style.width = "100%";
			style.height = "100%";
			return;
		}

		if (TgbDual.ScreenRatio <= ratio) {
			style.width = ((TgbDual.ScreenRatio / ratio) * 100) + "%";
			style.height = "100%";
		} else {
			style.width = "100%";
			style.height = ((ratio / TgbDual.ScreenRatio) * 100) + "%";
		}
	}

	protected adjustMessageTextSize(): void {
		const width = window.innerWidth;
		const height = window.innerHeight;
		const ratio = width / height;
		//const outerStyle = this.messageOuterElement.style;
		const style = this.messageElement.style;

		const baseFontSize = 12;
		const heightScale = 1.4;
		let fontSize = baseFontSize;
		if (TgbDual.ScreenRatio <= ratio) {
			fontSize = ((width / (ratio * TgbDual.Width)) * baseFontSize);
			style.fontSize = fontSize + "px";
			style.padding = "0 " + (fontSize) + "px";
			style.height = (fontSize * heightScale) + "px";
			//outerStyle.margin = (fontSize / baseFontSize) + "px";
			//outerStyle.margin = "1px auto";
			style.borderRadius = (fontSize / 1.5) + "px";
			style.bottom = fontSize + "px";
		} else {
			fontSize = ((height / ((TgbDual.ScreenRatio / ratio) * TgbDual.Width)) * baseFontSize);
			style.fontSize = fontSize + "px";
			style.padding = "0 " + (fontSize) + "px";
			style.height = (fontSize * heightScale) + "px";
			//outerStyle.margin = (fontSize / baseFontSize) + "px";
			//outerStyle.margin = "1px auto";
			style.borderRadius = (fontSize / 1.5) + "px";
			style.bottom = fontSize + "px";
		}
	}

	protected showMessage(text: string) {
		if (text == null || text === "") {
			return;
		}
		this.messageElement.innerText = text;
		this.messageElement.classList.remove("show");
		// reset animation
		this.messageElement.offsetWidth;
		this.messageElement.classList.add("show");
	}

	protected updateScreenSmoothing(): void {
		const style = this.tgbDual.element.style;
		if (this.config.screen.smoothing) {
			style["imageRendering"] = "auto";
		} else {
			style["imageRendering"] = "pixelated";
		}
	}

	protected updateScreenConfig(screenConfig: ScreenConfig): void {
		this.tgbDual.enableScreenLayer(0, this.config.screen.bg);
		this.tgbDual.enableScreenLayer(1, this.config.screen.window);
		this.tgbDual.enableScreenLayer(2, this.config.screen.sprite);
	}

	protected updateSoundConfig(soundConfig: SoundConfig): void {
		this.tgbDual.setSound(
			soundConfig.master,
			soundConfig.square1,
			soundConfig.square2,
			soundConfig.wave,
			soundConfig.noise
		);
		this.tgbDual.setSoundFilter(
			soundConfig.echo,
			soundConfig.lowPass
		);
	}

	protected loadFile(filePath: string): void {
		const ext = path.extname(filePath).toLowerCase();
		console.log(filePath, "ext:" + ext);

		if (ext === ".zip") {
			this.loadZipFile(filePath);
			return;
		}

		if (ext === ".gb" || ext === ".gbc") {
			this.tgbDual.stop();
			this.tgbDual.setGBType(this.config.misc.type);
			if (this.tgbDual.loadFile(filePath)) {
				this.tgbDual.start();
				const romInfo = this.tgbDual.getInfo();
				document.title = romInfo.cartName;
				console.log("romInfo", romInfo, romInfo.cartName.length);
				ipcRenderer.send("MainWindow.updateSaveLoadStateMenu", filePath);
			}
		}
	}
	
	protected loadZipFile(zipPath: string): boolean {
		if (!fs.existsSync(zipPath)) {
			return false;
		}
		const zipData = fs.readFileSync(zipPath);
		if (zipData == null) {
			return false;
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
			this.tgbDual.stop();
			this.tgbDual.romPath = zipPath;
			this.tgbDual.setGBType(this.config.misc.type);
			this.tgbDual.loadRom(data);
			this.tgbDual.start();

			const romInfo = this.tgbDual.romInfo;
			document.title = romInfo.cartName;
			ipcRenderer.send("MainWindow.updateSaveLoadStateMenu", zipPath);
			return true;
		}
		return false;
	}

	protected screenshot(): void {
		let pathObject = this.getScreenshotFilePath();
		if (pathObject == null) {
			return;
		}
		const buffer = this.tgbDual.screenshot();
		fs.writeFile(pathObject.path, buffer, (err) => {
			this.showMessage("Screenshot: " + pathObject.number);
		});
	}

	protected getScreenshotFilePath(): any {
		const romPath = this.tgbDual.romPath;
		if (romPath == null || romPath === "") {
			return null;
		}
		const pathInfo = path.parse(romPath);
		for (let i = 0; i < 1000; i++) {
			const num = ("000" + i).slice(-3);
			let imagePath = pathInfo.name + "_" + num + ".png";
			imagePath = path.join(this.config.path.save, imagePath);
			if (!fs.existsSync(imagePath)) {
				return {
					path: imagePath,
					number: i
				};
			}
		}
		return null;
	}

	protected recordSound(): void {
		if (this.tgbDual.isSoundRecording) {
			this.tgbDual.stopSoundRecording();
			this.showMessage("Stop sound recording");
			return;
		}
		let pathObject = this.getSoundRecordFilePath();
		if (pathObject == null) {
			return;
		}
		console.log(pathObject.path);
		this.tgbDual.startSoundRecording(pathObject.path);
		this.showMessage("Start sound recording: " + pathObject.number);
	}

	protected getSoundRecordFilePath(): any {
		const romPath = this.tgbDual.romPath;
		if (romPath == null || romPath === "") {
			return null;
		}
		const pathInfo = path.parse(romPath);
		for (let i = 0; i < 1000; i++) {
			const num = ("000" + i).slice(-3);
			let soundPath = pathInfo.name + "_" + num + ".wav";
			soundPath = path.join(this.config.path.save, soundPath);
			if (!fs.existsSync(soundPath)) {
				return {
					path: soundPath,
					number: i
				};
			}
		}
		return null;
	}
	
	protected updateGamepad = (): void => {
		const keyState = this.tgbDual.keyState;
		const gamePads = this.gamePads;

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
}
