import * as path from "path";
import { WaveFileWriter } from "./WaveFileWriter";
import { Config } from "./config/Config";

export class SoundPlayer {
	public isMuted: boolean = false;
	public handler: (soundPlayer: SoundPlayer, event: AudioProcessingEvent) => void;
	protected _context: AudioContext = null;
	protected _processorNode: ScriptProcessorNode = null;
	protected _bufferSize: number = 0;

	constructor() {
	}

	public get bufferSize(): number {
		return this._bufferSize;
	}

	public play(bufferSize: number): void {
		this._bufferSize = bufferSize;
		this._context = new AudioContext();
		this._processorNode = this._context.createScriptProcessor(
			bufferSize, 0, 2
		);
		this._processorNode.addEventListener("audioprocess", this.onAudioProcess);
		this._processorNode.connect(this._context.destination);
	}

	public stop(): void {
		const processorNode = this._processorNode;
		processorNode.removeEventListener("audioprocess", this.onAudioProcess);
		processorNode.disconnect(this._context.destination);
		this._processorNode = null;
		this._context.close();
		this._context = null;
	}

	public writeEmptySound(outputBuffer: AudioBuffer): void {
		const bufferSize = this._bufferSize;
		const L = outputBuffer.getChannelData(0);
		const R = outputBuffer.getChannelData(1);
		for (let i = 0; i < bufferSize; i++) {
			L[i] = 0;
			R[i] = 0;
		}
	}

	protected onAudioProcess = (event: AudioProcessingEvent): void => {
		if (this.isMuted) {
			this.writeEmptySound(event.outputBuffer);
			return;
		}

		if (this.handler != null) {
			this.handler(this, event);
		}
	};
}