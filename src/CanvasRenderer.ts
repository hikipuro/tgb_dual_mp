import { EventEmitter } from "events";
import * as PIXI from "pixi.js";

export class CanvasRenderer extends EventEmitter {
	public isPaused: boolean = false;
	public update: (time: number) => void;
	public render: () => void;
	public updateAlways: (time: number) => void;
	protected _canvas: HTMLCanvasElement;
	protected _context: CanvasRenderingContext2D;
	protected _requestAnimationFrameHandle: number = 0;
	
	protected _app: PIXI.Application;
	protected _sprite: PIXI.Sprite;

	protected _fps: number = 60;
	protected _prevTime: number = 0;
	protected _prevTime2: number = 0;
	protected _prevTimeDiff: number = 0;
	protected _fpsCount: number = 0;
	protected _prevFpsCount: number = 0;
	protected _elapsed: number = 0;

	constructor(width: number, height: number) {
		super();
		this._canvas = document.createElement("canvas");
		this._canvas.width = width;
		this._canvas.height = height;
		this._context = this._canvas.getContext("2d");
		this._context.imageSmoothingEnabled = false;
		this._context.webkitImageSmoothingEnabled = false;

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

		const ticker = PIXI.ticker.shared;
		ticker.autoStart = false;
		ticker.stop();

		this._sprite = new PIXI.Sprite();
		this._app.stage.addChild(this._sprite);
		this._app.render();

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
		return this._requestAnimationFrameHandle !== 0;
	}

	public get fps(): number {
		return this._fps;
	}

	public set fps(value: number) {
		this._fps = value;
		this._prevTime = performance.now();
		this._prevTime2 = this._prevTime;
		this._prevTimeDiff = 0;
	}

	public start(): void {
		this._prevTime = performance.now();
		this._prevTime2 = this._prevTime;
		this._fpsCount = 0;
		this._prevFpsCount = 0;
		this._requestAnimationFrameHandle = requestAnimationFrame(this.onUpdate);
	}
	
	public stop(): void {
		if (this._requestAnimationFrameHandle === 0) {
			return;
		}
		cancelAnimationFrame(this._requestAnimationFrameHandle);
		this._requestAnimationFrameHandle = 0;
	}

	public pause(): void {
		this.isPaused = true;
		if (this._requestAnimationFrameHandle !== 0) {
			cancelAnimationFrame(this._requestAnimationFrameHandle);
		}
	}
	
	public resume(): void {
		this.isPaused = false;
		if (this._requestAnimationFrameHandle !== 0) {
			this._requestAnimationFrameHandle = requestAnimationFrame(this.onUpdate);
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

	public togglePause(): void {
		this.isPaused = !this.isPaused;
	}

	public createImageData(): ImageData {
		return this._context.createImageData(
			this.element.width, this.element.height
		);
	}
	
	public putImageData(imageData: ImageData): void {
		this._context.putImageData(imageData, 0, 0);
	}

	public createDataURL(type: string = "image/png"): string {		
		return this._canvas.toDataURL(type);
	}

	protected updatePixi(): void {
		this._sprite.texture.removeAllListeners();
		this._sprite.texture.destroy(true);
		this._sprite.texture = PIXI.Texture.fromCanvas(this._canvas);
		this._sprite.texture.update();
		this._app.render();
	}

	protected emitFpsEvent(): void {
		if (this._elapsed < 1000) {
			return;
		}
		this._elapsed -= 1000;
		if (this._prevFpsCount === this._fpsCount) {
			this._fpsCount = 0;
			return;
		}
		this.emit("fps", this._fpsCount);
		this._prevFpsCount = this._fpsCount;
		this._fpsCount = 0;
	}

	protected onUpdate = (time: number): void => {
		const now = performance.now();
		let diff = now - this._prevTime;
		this._elapsed += diff;

		this.updateAlways(time);

		if (this.isPaused) {
			this._prevTime = now;
			this._prevTime2 += diff;
			this.emitFpsEvent();
			this._requestAnimationFrameHandle = requestAnimationFrame(this.onUpdate);
			return;
		}

		if (this._fps === 60) {
			this.update(time);
			this.render();
			this.updatePixi();
			this._fpsCount++;
			this._prevTime = now;
			this.emitFpsEvent();
			this._requestAnimationFrameHandle = requestAnimationFrame(this.onUpdate);
			return;
		}

		this._prevTime = now;
		this.emitFpsEvent();

		diff = now - this._prevTime2;
		const frameTime = 1000 / this._fps;
		//console.log(now - this._prevTime, 1000 / this.fps);
		if (diff + this._prevTimeDiff <= frameTime - 2) {
			this._requestAnimationFrameHandle = requestAnimationFrame(this.onUpdate);
			return;
		}
		this._prevTime2 += diff;
		diff +=  this._prevTimeDiff;
		let count = 0;
		while (diff > 0) {
			this.update(time);
			diff -= frameTime;
			this._fpsCount++;
			count++;
			if (count > 5) {
				break;
			}
		}
		this.render();
		this.updatePixi();

		this._prevTimeDiff = diff;
		this._requestAnimationFrameHandle = requestAnimationFrame(this.onUpdate);
	}
}
