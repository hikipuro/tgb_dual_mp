import * as fs from "fs";
import * as path from "path";
import { EventEmitter } from "events";
import { KeyCode } from "./KeyCode";
import { PathConfig } from "./config/PathConfig";
import { CanvasRenderer } from "./CanvasRenderer";
import { SoundPlayer } from "./SoundPlayer";
import { WaveFileWriter } from "./WaveFileWriter";
import { Config } from "./config/Config";
const Module = require("../html/tgb_dual.js");

let _isInitialized = false;

export class TgbDual extends EventEmitter {
	public static AudioBufferSize: number = 256 * 4;
	public static readonly StartDelay: number = 200;

	public keyState: TgbDual.KeyState;
	protected _canvasRenderer: CanvasRenderer;
	protected _soundPlayer: SoundPlayer;
	protected _waveFileWriter: WaveFileWriter;

	public isFastMode: boolean = false;
	protected _prevTime: number = 0;
	//protected _updateCounter: number = 0;

	public romPath: string = "";
	protected _romInfo: TgbDual.RomInfo = null;
	public pathConfig: PathConfig;

	public static get isInitialized(): boolean {
		return _isInitialized;
	}

	public get element(): HTMLCanvasElement {
		return this._canvasRenderer.element;
	}

	public get isPaused(): boolean {
		return this._canvasRenderer.isPaused;
	}

	public get isFileLoaded(): boolean {
		if (this.romPath == null || this.romPath == "") {
			return false;
		}
		return true;
	}

	public get isSoundRecording(): boolean {
		return this._waveFileWriter.isRecording;
	}

	public get romInfo(): TgbDual.RomInfo {
		return this._romInfo;
	}

	constructor() {
		super();
		this.initModuleFS();
		this.keyState = new TgbDual.KeyState();

		this._canvasRenderer = new CanvasRenderer(
			TgbDual.Width, TgbDual.Height
		);
		this._canvasRenderer.handler = this.render;
		this._canvasRenderer.clear();

		this._soundPlayer = new SoundPlayer();
		this._soundPlayer.handler = this.onAudioProcess;
		this._waveFileWriter = new WaveFileWriter();
	}

	public destroy(): void {
		this._waveFileWriter.close();
	}

	public start(): void {
		if (this._canvasRenderer.isStarted) {
			return;
		}
		this._canvasRenderer.isPaused = false;
		//TgbDual.API.setSkip(20);
		
		this._prevTime = performance.now();
		setTimeout(() => {
			this._canvasRenderer.start();
			this._soundPlayer.play(TgbDual.AudioBufferSize);
			this.emit("start");
		}, TgbDual.StartDelay);
	}

	public stop(): void {
		if (!this.isFileLoaded) {
			return;
		}
		if (!this._canvasRenderer.isStarted) {
			return;
		}
		this.pause();
		this.saveSram();

		this._canvasRenderer.stop();
		this._canvasRenderer.clear();
		this._soundPlayer.stop();
		
		this.romPath = "";
		this._romInfo = null;
		TgbDual.API.reset();
	}

	public saveSram(): void {
		if (!this.isFileLoaded) {
			return;
		}
		if (this.pathConfig == null) {
			return;
		}
		if (this.romInfo == null || this.romInfo.ramSize <= 0) {
			return;
		}

		const pathInfo = path.parse(this.romPath);
		const saveFileName = pathInfo.name + ".sav";
		if (saveFileName.length <= 4) {
			return;
		}
		
		if (!fs.existsSync(this.pathConfig.save)) {
			fs.mkdirSync(this.pathConfig.save);
		}

		const pointer = TgbDual.API.getSram();
		const size = 0x2000 * this.romInfo.ramSize;
		const data = Module.HEAPU8.subarray(pointer, pointer + size);
		const saveFilePath = path.join(this.pathConfig.save, saveFileName);
		fs.writeFileSync(saveFilePath, data);
	}
	
	public loadSram(romFileName: string): Buffer {
		if (this.pathConfig == null) {
			return null;
		}

		const pathInfo = path.parse(romFileName);
		const saveFileName = pathInfo.name + ".sav";
		if (saveFileName.length <= 4) {
			return null;
		}
		
		const saveFilePath = path.join(this.pathConfig.save, saveFileName);
		if (!fs.existsSync(saveFilePath)) {
			return null;
		}

		return fs.readFileSync(saveFilePath);
	}

	public reset(): void {
		if (!this.isFileLoaded) {
			return;
		}
		TgbDual.API.reset();
		this._canvasRenderer.isPaused = false;
	}

	public pause(): void {
		if (!this.isFileLoaded) {
			return;
		}
		this._canvasRenderer.togglePause();
		console.log("pause", this._canvasRenderer.isPaused);
	}

	public saveState(index: number): void {
		if (index == null || index < 0 || index > 9) {
			return;
		}
		if (this.romPath == null || this.romPath === "") {
			return;
		}

		index = Math.floor(index);
		TgbDual.API.saveState("/data/save_tmp.sav");
		const data = Module.FS.readFile("/data/save_tmp.sav", {
			encoding: "binary", flags: "r"
		});
		Module.FS.unlink("/data/save_tmp.sav");

		const pathInfo = path.parse(this.romPath);
		const saveFileName = pathInfo.name + ".sv" + index;
		if (saveFileName.length <= 4) {
			return;
		}
		if (!fs.existsSync(this.pathConfig.save)) {
			fs.mkdirSync(this.pathConfig.save);
		}
		const saveFilePath = path.join(this.pathConfig.save, saveFileName);
		fs.writeFileSync(saveFilePath, data);
	}

	public restoreState(index: number): void {
		if (index == null || index < 0 || index > 9) {
			return;
		}
		if (this.romPath == null || this.romPath === "") {
			return;
		}
		
		index = Math.floor(index);
		const pathInfo = path.parse(this.romPath);
		const saveFileName = pathInfo.name + ".sv" + index;
		if (saveFileName.length <= 4) {
			return;
		}

		const saveFilePath = path.join(this.pathConfig.save, saveFileName);
		if (!fs.existsSync(saveFilePath)) {
			return;
		}
		const data = fs.readFileSync(saveFilePath);

		Module.FS.writeFile("/data/load_tmp.sav", data, {
			encoding: "binary", flags: "w"
		});
		TgbDual.API.restoreState("/data/load_tmp.sav");
		Module.FS.unlink("/data/load_tmp.sav");
	}

	public setGBType(type: string): void {
		let typeId: number = 1;
		switch (type) {
		case "gb":
			typeId = 1;
			break;
		case "gbc":
			typeId = 3;
			break;
		case "gba":
			typeId = 4;
			break;
		default:
			typeId = 0;
			break;
		}
		TgbDual.API.setGBType(typeId);
	}

	public screenshot(): Buffer {
		const dataURL = this.element.toDataURL("image/png");
		const image = Electron.nativeImage.createFromDataURL(dataURL);
		return image.toPNG();
	}

	public startSoundRecording(filePath: string): void {
		this._waveFileWriter.start(filePath);
	}

	public stopSoundRecording(): void {
		this._waveFileWriter.close();
	}

	public loadFile(path: string): boolean {
		console.log("loadFile", path);
		if (!fs.existsSync(path)) {
			return false;
		}
		const data = fs.readFileSync(path);
		if (data == null) {
			return false;
		}
		//console.log(data);
		this.romPath = path;
		this.loadRom(data);
		return true;
	}

	public loadRom(data: Buffer): void {
		console.log("loadRom", typeof data);
		const sram = this.loadSram(this.romPath);
		if (sram == null) {
			TgbDual.API.loadRom(data.length, data, 0, []);
		} else {
			TgbDual.API.loadRom(data.length, data, sram.length, sram);
		}
		this._romInfo = this.getInfo();
	}

	public nextFrame(): void {
		TgbDual.API.nextFrame();
	}

	public setKeys(keyState: TgbDual.KeyState): void {
		const down = keyState.Down ? 1 : 0;
		const up = keyState.Up ? 1 : 0;
		const left = keyState.Left ? 1 : 0;
		const right = keyState.Right ? 1 : 0;
		const a = keyState.A ? 1 : 0;
		const b = keyState.B ? 1 : 0;
		const select = keyState.Select ? 1 : 0;
		const start = keyState.Start ? 1 : 0;
		TgbDual.API.setKeys(down, up, left, right, a, b, select, start);
	}

	public setSound(master: boolean, square1: boolean, square2: boolean, wave: boolean, noise: boolean) {
		console.log("setSound", master);
		this._soundPlayer.isMuted = !master;
		TgbDual.API.enableSoundChannel(0, square1);
		TgbDual.API.enableSoundChannel(1, square2);
		TgbDual.API.enableSoundChannel(2, wave);
		TgbDual.API.enableSoundChannel(3, noise);
	}
	
	public setSoundFilter(echo: boolean, lowPass: boolean) {
		TgbDual.API.enableSoundEcho(echo);
		TgbDual.API.enableSoundLowPass(lowPass);
	}
	
	public enableScreenLayer(layer: number | string, enable: boolean) {
		console.log("enableScreenLayer", layer, enable);
		let layerIndex = 0;
		if (typeof layer === "string") {
			switch (layer.toLowerCase()) {
			case "bg":
				layerIndex = 0;
				break;
			case "window":
				layerIndex = 1;
				break;
			case "sprite":
				layerIndex = 2;
				break;
			default:
				return;
			}
		} else {
			layerIndex = layer;
		}
		TgbDual.API.enableScreenLayer(layerIndex, enable);
	}

	public getInfo(): TgbDual.RomInfo {
		const romInfo = new TgbDual.RomInfo();
		romInfo.cartName = TgbDual.API.getCartName();
		romInfo.cartType = TgbDual.API.getCartType();
		romInfo.romSize = TgbDual.API.getRomSize();
		romInfo.ramSize = TgbDual.API.getRamSize();
		romInfo.checkSum = TgbDual.API.getCheckSum();
		romInfo.gbType = TgbDual.API.getGBType();
		return romInfo;
	}

	protected initModuleFS(): void {
		Module.FS.mkdir("/data");
		Module.FS.mount(Module.IDBFS, { }, "/data");
		Module.FS.syncfs(true, (err) => {
			console.log(err);
		});
	}

	protected render = (time: number): boolean => {
		if (this.isFastMode) {
			TgbDual.API.nextFrame();
			if (this._prevTime + 17 >= performance.now()) {
				this.render(time);
				return;
			}
			this.emit("update");
			this.setKeys(this.keyState);
			this.updateScreen();
			this._prevTime = performance.now();
			return;
		}

		this.emit("update");
		this.setKeys(this.keyState);
		TgbDual.API.nextFrame();
		this.updateScreen();
	}

	protected updateScreen(): void {
		let pointer = TgbDual.API.getBytes();
		const len = TgbDual.Width * TgbDual.Height * 4;
		const data = Module.HEAPU8.subarray(pointer, pointer + len);

		let imageData = this._canvasRenderer.createImageData();
		imageData.data.set(data, 0);
		this._canvasRenderer.putImageData(imageData);
		imageData = null;

		/*
		this._updateCounter++;
		if (this._updateCounter > 120) {
			this._updateCounter = 0;
			if (global.gc) {
				global.gc();
			}
		}
		//*/
	}

	protected onAudioProcess = (soundPlayer: SoundPlayer, event: AudioProcessingEvent): void => {
		const bufferSize = TgbDual.AudioBufferSize;

		if (!this._canvasRenderer.isStarted || this._canvasRenderer.isPaused) {
			soundPlayer.writeEmptySound(event.outputBuffer);
			return;
		}

		const result = TgbDual.API.getSoundBytes(bufferSize);
		if (result === 0) {
			soundPlayer.writeEmptySound(event.outputBuffer);
			return;
		}

		let pointer = result;
		const L = event.outputBuffer.getChannelData(0);
		const R = event.outputBuffer.getChannelData(1);

		if (this.isSoundRecording) {
			let buffer = new Buffer(bufferSize * 4);
			for (let i = 0; i < bufferSize; i++) {
				const shortDataL = Module.getValue(pointer, "i16");
				const shortDataR = Module.getValue(pointer + 2, "i16");
				buffer.writeInt16LE(shortDataL, i * 4);
				buffer.writeInt16LE(shortDataR, i * 4 + 2);
				L[i] = shortDataL / 32768;
				R[i] = shortDataR / 32768;
				pointer += 4;
			}
			this._waveFileWriter.write(buffer);
			return;
		}
		
		pointer /= 2;
		const data = Module.HEAP16.subarray(pointer, pointer + bufferSize * 2);
		pointer = 0;
		for (let i = 0; i < bufferSize; i++) {
			const shortDataL = data[pointer];
			const shortDataR = data[pointer + 1];
			L[i] = shortDataL / 32768;
			R[i] = shortDataR / 32768;
			pointer += 2;
		}
	}
}

export module TgbDual {
	export const Width = 160;
	export const Height = 144;
	export const ScreenRatio = TgbDual.Width / TgbDual.Height;

	export function oninit() {
	};

	export class API {
		public static initTgbDual: () => void;
		public static loadRom: (size: number, data: any, sramSize: number, sram: any) => void;
		public static nextFrame: () => void;
		public static getBytes: () => number;
		public static getSoundBytes: (size: number) => number;
		public static setKeys: (down: number, up: number, left: number, right: number, a: number, b: number, select: number, start: number) => void;
		public static reset: () => void;
		public static getCartName: () => string;
		public static getCartType: () => number;
		public static getRomSize: () => number;
		public static getRamSize: () => number;
		public static getCheckSum: () => number;
		public static getGBType: () => number;
		public static saveState: (path: string) => void;
		public static restoreState: (path: string) => void;
		public static setSkip: (frame: number) => void;
		public static getSram: () => number;
		public static enableSoundChannel: (ch: number, enable: boolean) => void;
		public static enableSoundEcho: (enable: boolean) => void;
		public static enableSoundLowPass: (enable: boolean) => void;
		public static enableScreenLayer: (layer: number, enable: boolean) => void;
		public static setGBType: (type: number) => void;

		public static init() {
			this.initTgbDual = Module.cwrap(
				"initTgbDual", "void", []);
			this.loadRom = Module.cwrap(
				"loadRom", "void", ["number", "array", "number", "array"]);
			this.nextFrame = Module.cwrap(
				"nextFrame", "void", []);
			this.getBytes = Module.cwrap(
				"getBytes", "number", []);
			this.getSoundBytes = Module.cwrap(
				"getSoundBytes", "number", ["number"]);
			this.setKeys = Module.cwrap(
				"setKeys", "void", [
					"number", "number", "number", "number",
					"number", "number", "number", "number"
				]);
			this.reset = Module.cwrap(
				"reset", "void", []);
			this.getCartName = Module.cwrap(
				"getCartName", "string", []);
			this.getCartType = Module.cwrap(
				"getCartType", "number", []);
			this.getRomSize = Module.cwrap(
				"getRomSize", "number", []);
			this.getRamSize = Module.cwrap(
				"getRamSize", "number", []);
			this.getCheckSum = Module.cwrap(
				"getCheckSum", "number", []);
			this.getGBType = Module.cwrap(
				"getGBType", "number", []);
			this.saveState = Module.cwrap(
				"saveState", "void", ["string"]);
			this.restoreState = Module.cwrap(
				"restoreState", "void", ["string"]);
			this.setSkip = Module.cwrap(
				"setSkip", "void", ["number"]);
			this.getSram = Module.cwrap(
				"getSram", "number", []);
			this.enableSoundChannel = Module.cwrap(
				"enableSoundChannel", "void", ["number", "boolean"]);
			this.enableSoundEcho = Module.cwrap(
				"enableSoundEcho", "void", ["boolean"]);
			this.enableSoundLowPass = Module.cwrap(
				"enableSoundLowPass", "void", ["boolean"]);
			this.enableScreenLayer = Module.cwrap(
				"enableScreenLayer", "void", ["number", "boolean"]);
			this.setGBType = Module.cwrap(
				"setGBType", "void", ["number"]);
		}
	}

	export class KeyState {
		public A: boolean = false;
		public B: boolean = false;
		public Start: boolean = false;
		public Select: boolean = false;
		public Up: boolean = false;
		public Down: boolean = false;
		public Left: boolean = false;
		public Right: boolean = false;
	}

	export class RomInfo {
		public cartName: string = ""; // 18
		public cartType: number = 0; // 4
		public romSize: number = 0; // 1
		public ramSize: number = 0; // 1

		public checkSum: number = 0; // 1
		public gbType: number = 0; // 4
	}
}

Module["onRuntimeInitialized"] = () => {
	console.log("onRuntimeInitialized");
	TgbDual.API.init();
	TgbDual.API.initTgbDual();
	_isInitialized = true;
	if (TgbDual.oninit != null) {
		TgbDual.oninit();
	}
};
