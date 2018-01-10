export class CanvasRenderer {
	public fps: number = 60;
	public isPaused: boolean = false;
	public handler: (time: number) => boolean;
	protected _element: HTMLCanvasElement;
	protected _context: CanvasRenderingContext2D;
	protected _requestAnimationFrameHandle: number = 0;

	protected _prevTime: number = 0;
	protected _prevTimeDiff: number = 0;
	protected _fpsCount: number = 0;
	protected _elapsed: number = 0;

	constructor(width: number, height: number) {
		this._element = document.createElement("canvas");
		this._element.width = width;
		this._element.height = height;
		this._context = this._element.getContext("2d");
		this._context.imageSmoothingEnabled = false;
		this._context.webkitImageSmoothingEnabled = false;
		this.handler = (time: number): boolean => { return false; };
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

	public start(): void {
		this._prevTime = performance.now();
		this._requestAnimationFrameHandle = requestAnimationFrame(this.update);
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

	protected update = (time: number): void => {
		if (this.isPaused) {
			this._requestAnimationFrameHandle = requestAnimationFrame(this.update);
			return;
		}
		if (this.fps === 60) {
			this.handler(time);
			this._requestAnimationFrameHandle = requestAnimationFrame(this.update);
			return;
		}

		const now = performance.now();
		let diff = now - this._prevTime;
		const frameTime = 1000 / this.fps;
		//console.log(now - this._prevTime, 1000 / this.fps);
		if (diff + this._prevTimeDiff <= frameTime - 2) {
			this._requestAnimationFrameHandle = requestAnimationFrame(this.update);
			return;
		}
		this._prevTime += diff;
		this._elapsed += diff;
		diff +=  this._prevTimeDiff;
		while (diff > 0) {
			this.handler(time);
			diff -= frameTime;
			this._fpsCount++;
		}
		this._prevTimeDiff = diff;
		if (this._elapsed > 1000) {
			this._elapsed -= 1000;
			//console.log("fps", this._fpsCount);
			this._fpsCount = 0;
		}
		this._requestAnimationFrameHandle = requestAnimationFrame(this.update);
	}
}
