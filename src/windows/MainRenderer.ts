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

class Messages {
	public saveState: string = "Save state: ";
	public loadState: string = "Load state: ";
	public reset: string = "Reset";
	public pause: string = "Pause";
	public resume: string = "Resume";
	public release: string = "Release";
	public fastOn: string = "Fast mode: on";
	public fastOff: string = "Fast mode: off";
	public autoFireOn: string = "Auto fire: on";
	public autoFireOff: string = "Auto fire: off";
	public screenshot: string = "Screenshot: ";
	public startSoundRecording: string = "Start sound recording: ";
	public stopSoundRecording: string = "Stop sound recording";
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
	protected fpsElement: HTMLElement;
	protected isFastMode: boolean = false;
	protected isPausedWithLostFocus: boolean = false;
	protected messages: Messages;

	constructor(languageJson: any, commandLineArgs: string[]) {
		this.commandLineArgs = commandLineArgs;
		this.mainElement = document.getElementById("main");
		this.messageOuterElement = document.getElementById("message-outer");
		this.messageElement = document.getElementById("message");
		this.messageElement.addEventListener("webkitAnimationEnd", () => {
			this.messageElement.classList.remove("show");
		});
		this.fpsElement = document.getElementById("fps");

		this.addIpcEvents();
		this.initWindowEvents();
		this.initDocumentEvents();
		this.config = ipcRenderer.sendSync("MainWindow.getConfig");

		this.messages = new Messages();
		this.translateMessageText(languageJson, this.messages);

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
			this.updateSpeedConfig();
		});
		this.tgbDual.on("updateAlways", this.updateGamepad);
		this.tgbDual.on("fps", this.updateFps);
		this.tgbDual.on("log", this.onLog);
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

	protected addIpcEvents(): void {
		ipcRenderer.on("MainWindow.log", (event: Electron.IpcMessageEvent, ...args) => {
			console.log(...args);
		});
		ipcRenderer.on("MainWindow.menu", (event: Electron.IpcMessageEvent, menu: MenuItem) => {
			console.log("MainWindow.menu", menu);

			const id = menu.id;

			if (id.indexOf("file.save-state.") === 0) {
				const fileNumber = Number(id.substr(-1, 1));
				console.log("save", fileNumber);
				this.tgbDual.saveState(fileNumber);
				ipcRenderer.send("MainWindow.updateSaveLoadStateMenu", this.tgbDual.romPath);
				this.showMessage(this.messages.saveState + fileNumber);
				return;
			}

			if (id.indexOf("file.load-state.") === 0) {
				const fileNumber = Number(id.substr(-1, 1));
				console.log("restore", fileNumber);
				this.tgbDual.restoreState(fileNumber);
				this.showMessage(this.messages.loadState + fileNumber);
				return;
			}

			switch (id) {
				case "file.reset-slot1":
					if (this.tgbDual.isFileLoaded) {
						this.loadFile(this.tgbDual.romPath);
						this.showMessage(this.messages.reset);
					}
					break;
				case "file.pause":
					if (this.tgbDual.isFileLoaded) {
						this.tgbDual.togglePause();
						if (this.tgbDual.isPaused) {
							this.showMessage(this.messages.pause);
						} else {
							this.showMessage(this.messages.resume);
						}
					}
					break;
				case "file.release-slot1":
					if (this.tgbDual.isFileLoaded) {
						this.tgbDual.stop();
						document.title = this.defaultTitle;
						this.updateFps(0);
						this.fpsElement.style.display = "none";
						ipcRenderer.send("MainWindow.updateSaveLoadStateMenu", null);
						this.showMessage(this.messages.release);
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
				case "option.emulator.pause":
					this.config.misc.pauseWhenInactive = menu.checked;
					if (!menu.checked) {
						this.isPausedWithLostFocus = false;
					}
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
		ipcRenderer.on("MainWindow.speedConfig", (event: Electron.IpcMessageEvent, arg: any) => {
			console.log("MainWindow.speedConfig", arg.speed);
			this.config = Config.fromJSON(arg);
			this.updateSpeedConfig();
		});
		ipcRenderer.on("MainWindow.pathConfig", (event: Electron.IpcMessageEvent, arg: any) => {
			console.log("MainWindow.pathConfig", arg.path);
			this.config = Config.fromJSON(arg);
			this.tgbDual.pathConfig = this.config.path;
			ipcRenderer.send("MainWindow.updateSaveLoadStateMenu", this.tgbDual.romPath);
		});
		ipcRenderer.on("MainWindow.miscConfig.type", (event: Electron.IpcMessageEvent, arg: any) => {
			console.log("MainWindow.miscConfig.type", arg);
			this.config = Config.fromJSON(arg);
			this.tgbDual.setGBType(this.config.misc.type);
		});
		
		ipcRenderer.on("MainWindow.focus", (event: Electron.IpcMessageEvent, arg: any) => {
			console.log("MainWindow.focus");
			if (!this.config.misc.pauseWhenInactive) {
				return;
			}
			if (this.tgbDual.isPaused) {
				if (this.isPausedWithLostFocus) {
					this.tgbDual.togglePause();
				}
			}
			this.isPausedWithLostFocus = false;
		});
		ipcRenderer.on("MainWindow.blur", (event: Electron.IpcMessageEvent, arg: any) => {
			console.log("MainWindow.blur");
			if (!this.config.misc.pauseWhenInactive) {
				return;
			}
			if (!this.tgbDual.isPaused) {
				this.isPausedWithLostFocus = true;
				this.tgbDual.togglePause();
			}
		});
		ipcRenderer.on("MainWindow.showLogWindow", (event: Electron.IpcMessageEvent, arg: any) => {
			console.log("MainWindow.showLogWindow");
			if (!TgbDual.isInitialized) {
				return;
			}
			const log = this.tgbDual.log;
			if (log == null || log === "") {
				return;
			}
			ipcRenderer.send("LogWindow.log", this.tgbDual.log + "\n");
		});

		/*
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

	protected removeIpcEvents(): void {
		ipcRenderer.removeAllListeners("MainWindow.log");
		ipcRenderer.removeAllListeners("MainWindow.menu");
		ipcRenderer.removeAllListeners("MainWindow.load");
		ipcRenderer.removeAllListeners("MainWindow.getConfig");
		ipcRenderer.removeAllListeners("MainWindow.screenConfig");
		ipcRenderer.removeAllListeners("MainWindow.soundConfig");
		ipcRenderer.removeAllListeners("MainWindow.speedConfig");
		ipcRenderer.removeAllListeners("MainWindow.pathConfig");
		ipcRenderer.removeAllListeners("MainWindow.miscConfig.type");
		ipcRenderer.removeAllListeners("MainWindow.focus");
		ipcRenderer.removeAllListeners("MainWindow.blur");
	}

	protected initWindowEvents(): void {
		// uncaught exception
		window.onerror = (message, filename, lineno, colno, error) => {
			console.log("window.onerror", message);
			if (this.tgbDual != null) {
				this.tgbDual.stop();
			}
			this.writeCrashLog(message, filename, lineno, colno, error);
		}

		// window resize
		window.onresize = () => {
			this.adjustScreenSize();
		}

		// window close
		window.onbeforeunload = (e: BeforeUnloadEvent) => {
			this.removeIpcEvents();
			if (this.tgbDual != null) {
				this.tgbDual.stop();
				this.tgbDual.destroy();
			}
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
			if (file == null) {
				return;
			}
			this.loadFile(file.path);
		}

		// mouse
		window.addEventListener("mousemove", (e: MouseEvent) => {
			e.stopPropagation();
		}, true);
		
		// keyboard input
		window.addEventListener("keypress", (e: KeyboardEvent) => {
			e.stopPropagation();
		}, true);
		window.addEventListener("keydown", (e: KeyboardEvent) => {
			//e.preventDefault();
			e.stopPropagation();
			if (e.repeat) {
				return;
			}
			const keyConfig = this.config.key;
			const keyState = this.tgbDual.keyState;
			switch (e.keyCode) {
				case keyConfig.up.code: keyState.up = true; break;
				case keyConfig.down.code: keyState.down = true; break;
				case keyConfig.left.code: keyState.left = true; break;
				case keyConfig.right.code: keyState.right = true; break;
				case keyConfig.start.code: keyState.start = true; break;
				case keyConfig.select.code: keyState.select = true; break;
				case keyConfig.b.code: keyState.b = true; break;
				case keyConfig.a.code: keyState.a = true; break;
				case keyConfig.fast.code:
					if (!this.tgbDual.isPaused) {
						this.isFastMode = true;
						this.updateSpeedConfig();
						this.showMessage(this.messages.fastOn);
					}
					break;
				case keyConfig.autoFire.code:
					keyState.toggleAutoFire();
					if (keyState.autoFire) {
						this.showMessage(this.messages.autoFireOn);
					} else {
						this.showMessage(this.messages.autoFireOff);
					}
					break;
				case keyConfig.pause.code:
					this.isFastMode = false;
					this.updateSpeedConfig();
					this.tgbDual.togglePause();
					if (this.tgbDual.isPaused) {
						this.showMessage(this.messages.pause);
					} else {
						this.showMessage(this.messages.resume);
					}
					break;
			}
		}, true);
		window.addEventListener("keyup", (e: KeyboardEvent) => {
			//e.preventDefault();
			e.stopPropagation();
			if (e.repeat) {
				return;
			}
			const keyConfig = this.config.key;
			const keyState = this.tgbDual.keyState;
			switch (e.keyCode) {
				case keyConfig.up.code: keyState.up = false; break;
				case keyConfig.down.code: keyState.down = false; break;
				case keyConfig.left.code: keyState.left = false; break;
				case keyConfig.right.code: keyState.right = false; break;
				case keyConfig.start.code: keyState.start = false; break;
				case keyConfig.select.code: keyState.select = false; break;
				case keyConfig.b.code: keyState.b = false; break;
				case keyConfig.a.code: keyState.a = false; break;
				case keyConfig.fast.code:
					if (!this.tgbDual.isPaused && this.isFastMode) {
						this.isFastMode = false;
						this.updateSpeedConfig();
						this.showMessage(this.messages.fastOff);
					}
					break;
			}
		}, true);
	}

	protected writeCrashLog(message, filename, lineno, colno, error): void {
		const fd = fs.openSync("crash.log", "a+");
		const newLine = "\r\n";
		const date = new Date();
		fs.writeSync(fd, "[" + date + "]" + newLine);
		fs.writeSync(fd, filename + ", line: " + lineno + ", col: " + colno + newLine);
		fs.writeSync(fd, "error: " + error + newLine);
		fs.writeSync(fd, "message: " + message + newLine);
		fs.writeSync(fd, newLine);
		fs.closeSync(fd);
	}

	protected translateMessageText(languageJson: any, messages: Messages): void {
		if (languageJson == null || languageJson.main == null) {
			return;
		}
		if (languageJson.main.messages == null) {
			return;
		}
		
		const json = languageJson.main.messages;
		for (const name in messages) {
			if (json[name] == null) {
				continue;
			}
			messages[name] = json[name];
		}
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
		const fpsStyle = this.fpsElement.style;

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
			fpsStyle.fontSize = fontSize + "px";
		} else {
			fontSize = ((height / ((TgbDual.ScreenRatio / ratio) * TgbDual.Width)) * baseFontSize);
			style.fontSize = fontSize + "px";
			style.padding = "0 " + (fontSize) + "px";
			style.height = (fontSize * heightScale) + "px";
			//outerStyle.margin = (fontSize / baseFontSize) + "px";
			//outerStyle.margin = "1px auto";
			style.borderRadius = (fontSize / 1.5) + "px";
			style.bottom = fontSize + "px";
			fpsStyle.fontSize = fontSize + "px";
		}
	}

	protected showMessage(text: string) {
		if (text == null || text === "") {
			return;
		}
		text = "<span class='emoji'>" + this.getRandomAnimalEmoji() + "</span> " + text;
		this.messageElement.innerHTML = text;
		this.messageElement.classList.remove("show");
		// reset animation
		this.messageElement.offsetWidth;
		this.messageElement.classList.add("show");
	}

	protected getRandomAnimalEmoji(): string {
		function getRandomInt(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		}
		const list = [
			"🐶", "🐱", "🐭", "🐹", "🐰", "🦊",
			"🐻", "🐼", "🐨", "🐯", "🦁", "🐮",
			"🐷", "🐸", "🐵", "🐺", "🐗", "🐴", "🦄"
		];
		const index = getRandomInt(0, list.length - 1);
		return list[index];
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
		this.tgbDual.setSoundVolume(soundConfig.volume);
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

	protected updateSpeedConfig(): void {
		const speed = this.config.speed;
		if (this.tgbDual.isFileLoaded) {
			this.fpsElement.style.display = speed.showFps ? "block" : "none";
		}
		this.tgbDual.vsync = speed.vsync;
		this.updateFps(this.tgbDual.lastFps);
		if (this.isFastMode) {
			this.tgbDual.vsync = false;
			this.tgbDual.fps = speed.fastFps;
			this.tgbDual.frameSkip = speed.fastFrameSkip;
			return;
		}
		this.tgbDual.fps = speed.fps;
		this.tgbDual.frameSkip = speed.frameSkip;
	}

	protected loadFile(filePath: string): void {
		const ext = path.extname(filePath).toLowerCase();
		//console.log(filePath, "ext:" + ext);

		if (ext === ".zip") {
			this.loadZipFile(filePath);
			this.updateScreenConfig(this.config.screen);
			this.updateSoundConfig(this.config.sound);
			this.updateSpeedConfig();
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
				
				this.updateScreenConfig(this.config.screen);
				this.updateSoundConfig(this.config.sound);
				this.updateSpeedConfig();
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
		if (!fs.existsSync(this.config.path.media)) {
			fs.mkdirSync(this.config.path.media);
		}
		let pathObject = this.getScreenshotFilePath();
		if (pathObject == null) {
			return;
		}
		const buffer = this.tgbDual.screenshot();
		fs.writeFile(pathObject.path, buffer, (err) => {
			this.showMessage(this.messages.screenshot + pathObject.number);
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
			imagePath = path.join(this.config.path.media, imagePath);
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
		if (!fs.existsSync(this.config.path.media)) {
			fs.mkdirSync(this.config.path.media);
		}
		if (this.tgbDual.isSoundRecording) {
			this.tgbDual.stopSoundRecording();
			this.showMessage(this.messages.stopSoundRecording);
			return;
		}
		let pathObject = this.getSoundRecordFilePath();
		if (pathObject == null) {
			return;
		}
		console.log(pathObject.path);
		this.tgbDual.startSoundRecording(pathObject.path);
		this.showMessage(this.messages.startSoundRecording + pathObject.number);
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
			soundPath = path.join(this.config.path.media, soundPath);
			if (!fs.existsSync(soundPath)) {
				return {
					path: soundPath,
					number: i
				};
			}
		}
		return null;
	}

	protected updateFps = (fps: number): void => {
		if (this.fpsElement.style.display === "none") {
			return;
		}
		//const text = "<span class='emoji'>📽</span> " + String(fps);
		this.fpsElement.innerHTML = String(fps);
	}

	protected onLog = (message: string): void => {
		ipcRenderer.send("LogWindow.log", message);
	}

	protected updateGamepad = (): void => {
		if (this.isPausedWithLostFocus) {
			return;
		}
		const keyState = this.tgbDual.keyState;
		const gamePads = this.gamePads;
		const gamepadConfig = this.config.gamepad;

		gamePads.update();

		let id = gamepadConfig.a.id;
		let button = gamepadConfig.a.button;
		if (gamePads.isKeyDown(id, button)) {
			keyState.a = true;
		} else if (gamePads.isKeyUp(id, button)) {
			keyState.a = false;
		}

		id = gamepadConfig.b.id;
		button = gamepadConfig.b.button;
		if (gamePads.isKeyDown(id, button)) {
			keyState.b = true;
		} else if (gamePads.isKeyUp(id, button)) {
			keyState.b = false;
		}

		id = gamepadConfig.select.id;
		button = gamepadConfig.select.button;
		if (gamePads.isKeyDown(id, button)) {
			keyState.select = true;
		} else if (gamePads.isKeyUp(id, button)) {
			keyState.select = false;
		}

		id = gamepadConfig.start.id;
		button = gamepadConfig.start.button;
		if (gamePads.isKeyDown(id, button)) {
			keyState.start = true;
		} else if (gamePads.isKeyUp(id, button)) {
			keyState.start = false;
		}

		id = gamepadConfig.up.id;
		button = gamepadConfig.up.button;
		if (gamePads.isKeyDown(id, button)) {
			keyState.up = true;
		} else if (gamePads.isKeyUp(id, button)) {
			keyState.up = false;
		}

		id = gamepadConfig.down.id;
		button = gamepadConfig.down.button;
		if (gamePads.isKeyDown(id, button)) {
			keyState.down = true;
		} else if (gamePads.isKeyUp(id, button)) {
			keyState.down = false;
		}

		id = gamepadConfig.left.id;
		button = gamepadConfig.left.button;
		if (gamePads.isKeyDown(id, button)) {
			keyState.left = true;
		} else if (gamePads.isKeyUp(id, button)) {
			keyState.left = false;
		}

		id = gamepadConfig.right.id;
		button = gamepadConfig.right.button;
		if (gamePads.isKeyDown(id, button)) {
			keyState.right = true;
		} else if (gamePads.isKeyUp(id, button)) {
			keyState.right = false;
		}

		id = gamepadConfig.fast.id;
		button = gamepadConfig.fast.button;
		if (gamePads.isKeyDown(id, button)) {
			if (!this.tgbDual.isPaused) {
				this.isFastMode = true;
				this.updateSpeedConfig();
				this.showMessage(this.messages.fastOn);
			}
		} else if (gamePads.isKeyUp(id, button)) {
			if (!this.tgbDual.isPaused && this.isFastMode) {
				this.isFastMode = false;
				this.updateSpeedConfig();
				this.showMessage(this.messages.fastOff);
			}
		}

		id = gamepadConfig.autoFire.id;
		button = gamepadConfig.autoFire.button;
		if (gamePads.isKeyDown(id, button)) {
			keyState.toggleAutoFire();
			if (keyState.autoFire) {
				this.showMessage(this.messages.autoFireOn);
			} else {
				this.showMessage(this.messages.autoFireOff);
			}
		}

		id = gamepadConfig.pause.id;
		button = gamepadConfig.pause.button;
		if (gamePads.isKeyDown(id, button)) {
			this.isFastMode = false;
			this.updateSpeedConfig();
			this.tgbDual.togglePause();
			if (this.tgbDual.isPaused) {
				this.showMessage(this.messages.pause);
			} else {
				this.showMessage(this.messages.resume);
			}
		}
	};
}
