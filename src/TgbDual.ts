import * as fs from "fs";
import * as path from "path";
import { EventEmitter } from "events";
import { KeyCode } from "./KeyCode";
import { PathConfig } from "./config/PathConfig";
const Module = require("../html/tgb_dual.js");

let _isInitialized = false;

/*
Module.preRun.push(() => {
	Module.FS.init(null, () => {
		console.log("stdout");
	}, () => {
		console.log("stderr");
	});
});
*/

export class TgbDual extends EventEmitter {
	public static AudioBufferSize: number = 256 * 4;
	public static readonly StartDelay: number = 200;

	public element: HTMLCanvasElement;
	public keyState: TgbDual.KeyState;
	protected _context: CanvasRenderingContext2D;
	//protected imageData: ImageData;
	protected _requestAnimationFrameHandle: number = 0;

	protected _audioContext: AudioContext = null;
	protected _processor: ScriptProcessorNode = null;

	protected _isStarted: boolean = false;
	protected _isPaused: boolean = false;
	protected _isSoundMuted: boolean = false;
	public isFastMode: boolean = false;
	protected _prevTime: number = 0;
	protected _firstSample: number = 0;

	public romPath: string = "";
	protected _romInfo: TgbDual.RomInfo = null;
	public pathConfig: PathConfig;

	public static get isInitialized(): boolean {
		return _isInitialized;
	}

	public get isPaused(): boolean {
		return this._isPaused;
	}

	public get romInfo(): TgbDual.RomInfo {
		return this._romInfo;
	}

	constructor() {
		super();
		console.log("initTgbDual");

		console.log(__dirname);
		console.log(Module.FS, Module.IDBFS);
		Module.FS.mkdir('/data');
		Module.FS.mount(Module.IDBFS, { }, '/data');
		console.log(Module.IDBFS);

		Module.FS.syncfs(true, function (err) {
			// handle callback
			console.log(err);
		});

		this.keyState = new TgbDual.KeyState();
		this.element = document.createElement("canvas");
		this.element.width = TgbDual.Width;
		this.element.height = TgbDual.Height;
		this.element.style.height = "100%";
		this._context = this.element.getContext("2d");
		this._context.imageSmoothingEnabled = false;
		this._context.webkitImageSmoothingEnabled = false;

		/*
		this.imageData = this._context.createImageData(
			TgbDual.Width, TgbDual.Height
		);
		const data = this.imageData.data;

		for (let y = 0; y < TgbDual.Height; y++) {
			for (let x = 0; x < TgbDual.Width; x++) {
				const index = (y * TgbDual.Width + x) * 4;
				data[index] = y;
				data[index + 3] = 255;
			}
		}
		this._context.putImageData(this.imageData, 0, 0);
		*/
		this.clearScreen();
	}

	public destroy(): void {
	}

	protected update = (time: number): void => {
		if (this._isPaused) {
			this._requestAnimationFrameHandle = requestAnimationFrame(this.update);
			return;
		}

		if (this.isFastMode) {
			TgbDual.API.nextFrame();
			if (this._prevTime + 17 >= performance.now()) {
				this.update(time);
				return;
			}
			this.emit("update");
			this.setKeys(this.keyState);
			this.updateScreen();
			this._prevTime = performance.now();
			this._requestAnimationFrameHandle = requestAnimationFrame(this.update);
			return;
		}

		this.emit("update");
		this.setKeys(this.keyState);

		TgbDual.API.nextFrame();
		this.updateScreen();

		this._requestAnimationFrameHandle = requestAnimationFrame(this.update);
	}

	protected updateScreen(): void {
		let pointer = TgbDual.API.getBytes();

		/*
		//const data = this.imageData.data;
		let src = imageBuffer;
		let dst = 0;
		const getValue = Module.getValue;
		const size = width * height;
		for (let x = 0; x < size; x++) {
			const color = getValue(src, "i32");
			data[dst] = (color >> 16) & 0xFF;
			data[dst + 1] = (color >> 8) & 0xFF;
			data[dst + 2] = (color) & 0xFF;
			dst += 4;
			src += 4;
		}
		*/
		const len = TgbDual.Width * TgbDual.Height * 4;
		const data = Module.HEAPU8.subarray(pointer, pointer + len);

		let imageData = this._context.createImageData(
			TgbDual.Width, TgbDual.Height
		);
		imageData.data.set(data, 0);
		this._context.putImageData(imageData, 0, 0);
		imageData = null;
	}

	public clearScreen(): void {
		const width = this.element.width;
		const height = this.element.height;
		const context = this._context;
		context.fillStyle = "#000";
		context.fillRect(0, 0, width, height);
	}

	public start(): void {
		console.log("start", this._requestAnimationFrameHandle);
		if (this._requestAnimationFrameHandle !== 0) {
			return;
		}
		console.log("start");
		this._isPaused = false;

		//TgbDual.API.setSkip(20);
		
		this._audioContext = new AudioContext();
		this._processor = this._audioContext.createScriptProcessor(
			TgbDual.AudioBufferSize, 0, 2
		);
		this._processor.addEventListener("audioprocess", this.onAudioProcess);
		this._processor.connect(this._audioContext.destination);

		this._prevTime = performance.now();
		setTimeout(() => {
			this._isStarted = true;
			this._requestAnimationFrameHandle = requestAnimationFrame(this.update);
			this.emit("start");
		}, TgbDual.StartDelay);
	}

	public stop(): void {
		if (!this.isFileLoaded()) {
			return;
		}
		if (this._requestAnimationFrameHandle === 0) {
			return;
		}
		console.log("stop");
		this.pause();
		this.saveSram();

		const processor = this._processor;
		processor.removeEventListener("audioprocess", this.onAudioProcess);
		processor.disconnect(this._audioContext.destination);
		this._processor = null;
		this._audioContext.close();
		this._audioContext = null;

		cancelAnimationFrame(this._requestAnimationFrameHandle);
		this._requestAnimationFrameHandle = 0;
		this.clearScreen();
		
		this._isStarted = false;
		this._firstSample = 0;
		this.romPath = "";
		this._romInfo = null;
		TgbDual.API.reset();
	}

	public saveSram(): void {
		if (!this.isFileLoaded()) {
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
		if (!this.isFileLoaded()) {
			return;
		}
		TgbDual.API.reset();
		this._isPaused = false;
		this._firstSample = 0;
	}

	public pause(): void {
		if (!this.isFileLoaded()) {
			return;
		}
		this._isPaused = !this._isPaused;
		console.log("pause", this._isPaused);
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

	protected isFileLoaded(): boolean {
		if (this.romPath == null || this.romPath == "") {
			return false;
		}
		return true;
	}

	protected onAudioProcess = (event: AudioProcessingEvent): void => {
		const bufferSize = TgbDual.AudioBufferSize;
		const L = event.outputBuffer.getChannelData(0);
		const R = event.outputBuffer.getChannelData(1);

		if (!this._isStarted || this._isSoundMuted) {
			for (let i = 0; i < bufferSize; i++) {
				L[i] = 0;
				R[i] = 0;
			}
			return;
		}

		if (this._isPaused) {
			for (let i = 0; i < bufferSize; i++) {
				L[i] = 0;
				R[i] = 0;
			}
			return;
		}

		const result = TgbDual.API.getSoundBytes(bufferSize);
		if (result === 0) {
			for (let i = 0; i < bufferSize; i++) {
				L[i] = 0;
				R[i] = 0;
			}
			return;
		}

		/*
		if (this._firstSample < 10) {
			this._firstSample++;
			for (let i = 0; i < bufferSize; i++) {
				L[i] = 0;
				R[i] = 0;
			}
			return;
		}
		//*/

		let pointer = result;
		for (let i = 0; i < bufferSize; i++) {
			const shortDataL = Module.getValue(pointer, "i16");
			const shortDataR = Module.getValue(pointer + 2, "i16");
			L[i] = shortDataL / 32768;
			R[i] = shortDataR / 32768;
			pointer += 4;
		}
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
		this._isSoundMuted = !master;
		TgbDual.API.enableSoundChannel(0, square1);
		TgbDual.API.enableSoundChannel(1, square2);
		TgbDual.API.enableSoundChannel(2, wave);
		TgbDual.API.enableSoundChannel(3, noise);
	}
	
	public setSoundFilter(echo: boolean, lowPass: boolean) {
		TgbDual.API.enableSoundEcho(echo);
		TgbDual.API.enableSoundLowPass(lowPass);
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
	console.log("*** onRuntimeInitialized");
	TgbDual.API.init();
	TgbDual.API.initTgbDual();
	_isInitialized = true;
	if (TgbDual.oninit != null) {
		TgbDual.oninit();
	}
};
