import { EventEmitter } from "events";

export class CanvasRenderer extends EventEmitter {
	public isPaused: boolean = false;
	public update: (time: number) => void;
	public render: () => void;
	public updateAlways: (time: number) => void;
	protected _element: HTMLCanvasElement;
	protected _context: CanvasRenderingContext2D;
	protected _requestAnimationFrameHandle: number = 0;

	protected _fps: number = 60;
	protected _prevTime: number = 0;
	protected _prevTime2: number = 0;
	protected _prevTimeDiff: number = 0;
	protected _fpsCount: number = 0;
	protected _elapsed: number = 0;

	constructor(width: number, height: number) {
		super();
		this._element = document.createElement("canvas");
		this._element.width = width;
		this._element.height = height;
		this._context = this._element.getContext("2d");
		this._context.imageSmoothingEnabled = false;
		this._context.webkitImageSmoothingEnabled = false;
		this.update = (time: number): void => { };
		this.render = (): void => { };
		this.updateAlways = (time: number): void => { };
	}

	public get element(): HTMLCanvasElement {
		return this._element;
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
	}
	
	public resume(): void {
		this.isPaused = false;
	}

	public clear(color: string = "#000"): void {
		const width = this._element.width;
		const height = this._element.height;
		const context = this._context;
		context.fillStyle = color;
		context.fillRect(0, 0, width, height);
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

	protected onUpdate = (time: number): void => {
		const now = performance.now();
		let diff = now - this._prevTime;
		this._elapsed += diff;

		this.updateAlways(time);

		if (this.isPaused) {
			this._prevTime = now;
			this._prevTime2 += diff;
			if (this._elapsed > 1000) {
				this._elapsed -= 1000;
				this.emit("fps", this._fpsCount);
				this._fpsCount = 0;
			}
			this._requestAnimationFrameHandle = requestAnimationFrame(this.onUpdate);
			return;
		}

		if (this._fps === 60) {
			this.update(time);
			this.render();
			this._fpsCount++;
			this._prevTime = now;
			if (this._elapsed > 1000) {
				this._elapsed -= 1000;
				this.emit("fps", this._fpsCount);
				this._fpsCount = 0;
			}
			this._requestAnimationFrameHandle = requestAnimationFrame(this.onUpdate);
			return;
		}

		this._prevTime = now;
		if (this._elapsed > 1000) {
			this._elapsed -= 1000;
			this.emit("fps", this._fpsCount);
			console.log(this._fpsCount);
			this._fpsCount = 0;
		}

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
		this._prevTimeDiff = diff;
		this._requestAnimationFrameHandle = requestAnimationFrame(this.onUpdate);
	}
}
