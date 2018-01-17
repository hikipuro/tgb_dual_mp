import { EventEmitter } from "events";
import * as PIXI from "pixi.js";

export class FpsCounter {
	public count: number = 0;
	public prevCount: number = 0;
	public prevTime: number = 0;
	public elapsed: number = 0;

	constructor() {
	}

	public reset(): void {
		//this.count = 0;
		//this.prevCount = 0;
		//this.prevTime = 0;
		//this.elapsed = 0;
	}

	public update(): void {
		const now = performance.now();
		const diff = now - this.prevTime;
		this.elapsed += diff;
		this.count++;
		this.prevTime = now;
	}

	public resume(): void {
		this.prevTime = performance.now();
	}
}

export class CanvasRenderer extends EventEmitter {
	public update: (time: number) => void;
	public render: () => void;
	public updateAlways: (time: number) => void;

	protected _canvas: HTMLCanvasElement;
	protected _context: CanvasRenderingContext2D;

	protected _requestAnimationFrameHandle: number = 0;
	protected _timerId: any = 0;
	protected _timeoutRemain: number = 0;
	
	protected _isStarted: boolean = false;
	protected _isPaused: boolean = false;
	protected _isVsync: boolean = false;
	
	protected _app: PIXI.Application;
	protected _sprite: PIXI.Sprite;

	protected _fps: number = 60;
	protected _fpsCounter: FpsCounter = new FpsCounter();

	constructor(width: number, height: number) {
		super();
		this.initCanvas(width, height);
		this.initPixi(width, height);

		this.update = (time: number): void => { };
		this.render = (): void => { };
		this.updateAlways = (time: number): void => { };
	}

	public get element(): HTMLCanvasElement {
		return this._app.renderer.view;
	}

	public get context(): CanvasRenderingContext2D {
		return this._context;
	}

	public get isStarted(): boolean {
		return this._isStarted;
	}

	public get isPaused(): boolean {
		return this._isPaused;
	}

	public get isVsync(): boolean {
		return this._isVsync;
	}

	public set isVsync(value: boolean) {
		if (this._isVsync === value) {
			return;
		}
		let restart = false;
		if (this._isStarted) {
			restart = true;
			this.stop();
		}
		this._isVsync = value;
		if (restart) {
			this.start();
		}
	}

	public get fps(): number {
		return this._fps;
	}

	public set fps(value: number) {
		this._fps = value;
	}

	public start(): void {
		if (this._isStarted) {
			return;
		}
		this._isStarted = true;
		this._isPaused = false;
		this._timeoutRemain = 0;
		this._fpsCounter.reset();

		if (this._isVsync) {
			this.requestAnimationFrame(this.onUpdateVsync);
		} else {
			this.setTimeout(this.onUpdateTimer, 1000 / this.fps);
		}
	}
	
	public stop(): void {
		if (!this._isStarted) {
			return;
		}
		this._isStarted = false;
		this._isPaused = false;
		if (this._isVsync) {
			this.cancelAnimationFrame();
		} else {
			this.clearTimeout();
		}
	}

	public pause(): void {
		if (!this._isStarted || this._isPaused) {
			return;
		}
		this._isPaused = true;
		if (this._isVsync) {
			this.cancelAnimationFrame();
		} else {
			this.clearTimeout();
		}
	}
	
	public resume(): void {
		if (!this._isStarted || !this._isPaused) {
			return;
		}
		this._isPaused = false;
		this._fpsCounter.resume();
		if (this._isVsync) {
			this.requestAnimationFrame(this.onUpdateVsync);
		} else {
			this.setTimeout(this.onUpdateTimer, 1000 / this.fps);
		}
	}

	public togglePause(): void {
		if (this.isPaused) {
			this.resume();
		} else {
			this.pause();
		}
	}

	public clear(color: string = "#000"): void {
		const width = this._canvas.width;
		const height = this._canvas.height;
		const context = this._context;
		context.fillStyle = color;
		context.fillRect(0, 0, width, height);
		this.updatePixi();
	}

	public createImageData(): ImageData {
		return this._context.createImageData(
			this._canvas.width, this._canvas.height
		);
	}
	
	public putImageData(imageData: ImageData, dx: number = 0, dy: number = 0): void {
		this._context.putImageData(imageData, dx, dy);
	}

	public createDataURL(type: string = "image/png"): string {		
		return this._canvas.toDataURL(type);
	}

	protected initCanvas(width: number, height: number): void {
		this._canvas = document.createElement("canvas");
		this._canvas.width = width;
		this._canvas.height = height;
		this._context = this._canvas.getContext("2d");
		this._context.imageSmoothingEnabled = false;
		this._context.webkitImageSmoothingEnabled = false;
	}

	protected initPixi(width: number, height: number): void {
		this._app = new PIXI.Application({
			width: width,
			height: height,
			antialias: false,
			transparent: false,
			resolution: 1,
			autoStart: false,
			clearBeforeRender: false,
			legacy: true
		});

		this._app.renderer.plugins.interaction.destroy();
		const ticker = PIXI.ticker.shared;
		ticker.autoStart = false;
		ticker.stop();
		this._app.ticker.autoStart = false;
		this._app.ticker.stop();

		this._sprite = new PIXI.Sprite();
		this._sprite.texture = PIXI.Texture.fromCanvas(this._canvas);
		//this._sprite.texture.update();
		this._app.stage.addChild(this._sprite);
		this._app.render();
	}

	protected requestAnimationFrame(callback: FrameRequestCallback): void {
		this._requestAnimationFrameHandle = requestAnimationFrame(callback);
	}

	protected cancelAnimationFrame(): void {
		if (this._requestAnimationFrameHandle === 0) {
			return;
		}
		cancelAnimationFrame(this._requestAnimationFrameHandle);
		this._requestAnimationFrameHandle = 0;
	}

	protected setTimeout(callback: Function, timeout: number): void {
		this._timerId = setTimeout(() => {
			callback();
		}, timeout);
	}

	protected clearTimeout(): void {
		if (this._timerId === 0) {
			return;
		}
		clearTimeout(this._timerId);
		this._timerId = 0;
	}

	protected updatePixi(): void {
		this._sprite.texture.update();
		this._app.render();
	}

	protected emitFpsEvent(fpsCounter: FpsCounter): void {
		if (fpsCounter.elapsed < 1000) {
			return;
		}
		fpsCounter.elapsed -= 1000;
		if (fpsCounter.prevCount === fpsCounter.count) {
			fpsCounter.count = 0;
			return;
		}
		this.emit("fps", fpsCounter.count);
		fpsCounter.prevCount = fpsCounter.count;
		fpsCounter.count = 0;
	}

	protected onUpdateVsync = (time: number): void => {
		this.update(time);
		this.render();
		this.updatePixi();

		this._fpsCounter.update();
		this.emitFpsEvent(this._fpsCounter);
		this.requestAnimationFrame(this.onUpdateVsync);
	}
	
	protected onUpdateTimer = (): void => {
		this._fpsCounter.update();

		this.update(this._fpsCounter.prevTime);
		this.render();
		this.updatePixi();

		this.emitFpsEvent(this._fpsCounter);
		const timeout = this.getTimeout();
		this.setTimeout(this.onUpdateTimer, timeout);
	}

	protected getTimeout(): number {
		let timeout = 1000 / this.fps;
		timeout -= performance.now() - this._fpsCounter.prevTime;
		timeout -= this._timeoutRemain / 2;
		let result = Math.floor(timeout);
		this._timeoutRemain = timeout - result;
		return result;
	}
}
