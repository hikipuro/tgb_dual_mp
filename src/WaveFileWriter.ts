import * as fs from "fs";

export class WaveFileWriter {
	protected _filePath: string = null;
	protected _fd: number = 0;
	protected _bytesWritten: number = 0;

	constructor() {
	}

	public get isRecording(): boolean {
		return this._fd !== 0;
	}

	public start(filePath: string): void {
		if (this.isRecording) {
			this.close();
		}
		this._filePath = filePath;
		this._fd = fs.openSync(filePath, "w");
		this.writeHeader();
	}

	/*
	protected test(): void {
		const buffer = new Buffer(44100 * 2 * 2);
		for (let i = 0; i < 44100; i++) {
			const data = Math.sin((i / 44100) * 440 * 2 * Math.PI) * 30000;
			buffer.writeInt16LE(data, i * 4);
			buffer.writeInt16LE(-data, i * 4 + 2);
		}
		this.write(buffer);
	}
	//*/

	public write(data: Buffer): void {
		//console.log("this._bytesWritten", this._bytesWritten);
		this._bytesWritten += fs.writeSync(this._fd, data);
	}

	public close(): void {
		if (!this.isRecording) {
			return;
		}

		let buffer = new Buffer(4);
		// file size
		buffer.writeInt32LE(this._bytesWritten - 8, 0);
		fs.writeSync(this._fd, buffer, 0, 4, 4);
		// data size
		buffer.writeInt32LE(this._bytesWritten - 44, 0);
		fs.writeSync(this._fd, buffer, 0, 4, 40);

		fs.closeSync(this._fd);
		this._fd = 0;
	}

	protected writeHeader(): void {
		let buffer = new Buffer(44);
		buffer.write("RIFF");
		buffer.writeInt32LE(0, 4);
		buffer.write("WAVE", 8);
		buffer.write("fmt ", 12);
		buffer.writeInt32LE(16, 16);
		buffer.writeInt16LE(1, 20);
		buffer.writeInt16LE(2, 22);
		buffer.writeInt32LE(44100, 24);
		buffer.writeInt32LE(44100 * 4, 28);
		buffer.writeInt16LE(4, 32);
		buffer.writeInt16LE(16, 34);
		buffer.write("data", 36);
		buffer.writeInt32LE(0, 40);
		this.write(buffer);
	}
}