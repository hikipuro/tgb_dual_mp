export class CanvasRenderer {
	public isPaused: boolean = false;
	public handler: (time: number) => boolean;
	protected _element: HTMLCanvasElement;
	protected _context: CanvasRenderingContext2D;
	protected _requestAnimationFrameHandle: number = 0;

	constructor(width: number, height: number) {
		this._element = document.createElement("canvas");
		this._element.width = width;
		this._element.height = height;
		this._context = this._element.getContext("2d");
		this._context.imageSmoothingEnabled = false;
		this._context.webkitImageSmoothingEnabled = false;
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
		if (this.handler != null) {
			this.handler(time);
		}
		this._requestAnimationFrameHandle = requestAnimationFrame(this.update);
	}
}
