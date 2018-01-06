import { EventEmitter } from "events";


/*
interface GamepadButton {
	readonly value: number;
	readonly pressed: boolean;
}

interface Gamepad {
	readonly displayId: string;
	readonly id: string;
	readonly index: number;
	readonly mapping: string;
	readonly connected: boolean;
	readonly buttons: GamepadButton[];
	readonly axes: object[];
	readonly timestamp: number;
}

interface GamepadEvent extends Event {
	readonly gamepad: Gamepad;
}
*/

export class GamepadState {
	public buttonCount: number = 0;
	public axisCount: number = 0;
	protected _remap: GamepadRemap = null;
	protected _buttons: boolean[] = [];
	protected _prevButtons: boolean[] = [];
	protected _axes: number[] = [];
	protected _prevAxes: number[] = [];

	constructor(buttonCount: number, axisCount: number) {
		this.buttonCount = buttonCount;
		for (let i = 0; i < buttonCount; i++) {
			this._buttons.push(false);
		}
		this._prevButtons = this._buttons.slice(0);

		this.axisCount = axisCount;
		for (let i = 0; i < axisCount; i++) {
			this._axes.push(0);
		}
		this._prevAxes = this._axes.slice(0);
	}

	public remap(value: GamepadRemap): void {
		this._remap = value;
	}

	public update(gamepad: Gamepad): void {
		const buttonCount = this._buttons.length;
		const axisCount = this._axes.length;

		const buttons = gamepad.buttons;
		const axes = gamepad.axes;

		this._prevButtons = this._buttons.slice(0);
		for (let n = 0; n < buttonCount; n++) {
			this._buttons[n] = buttons[n].pressed;
		}
		this._prevAxes = this._axes.slice(0);
		for (let n = 0; n < axisCount; n++) {
			this._axes[n] = axes[n];
		}
	}

	public isKeyHold(buttonId: number | string): boolean {
		if (typeof buttonId === "string") {
			if (this._remap == null) {
				return false;
			}
			buttonId = this._remap.getButtonId(buttonId);
		}
		return this._buttons[buttonId] === true
		&& this._prevButtons[buttonId] === true;
	}

	public isKeyDown(buttonId: number | string): boolean {
		if (typeof buttonId === "string") {
			if (this._remap == null) {
				return false;
			}
			buttonId = this._remap.getButtonId(buttonId);
		}
		return this._buttons[buttonId] === true
		&& this._prevButtons[buttonId] === false;
	}

	public isKeyUp(buttonId: number | string): boolean {
		if (typeof buttonId === "string") {
			if (this._remap == null) {
				return false;
			}
			buttonId = this._remap.getButtonId(buttonId);
		}
		return this._buttons[buttonId] === false
		&& this._prevButtons[buttonId] === true;
	}
	
	public isAxisChange(axisId: number | string): boolean {
		if (typeof axisId === "string") {
			if (this._remap == null) {
				return false;
			}
			axisId = this._remap.getAxisId(axisId);
		}
		return this._axes[axisId] !== this._prevAxes[axisId];
	}

	public getAxis(axisId: number | string): number {
		if (typeof axisId === "string") {
			if (this._remap == null) {
				return 0;
			}
			axisId = this._remap.getAxisId(axisId);
		}
		return this._axes[axisId];
	}
}

export class GamepadRemap {
	protected _buttons: any = {};
	protected _axes: any = {};

	constructor(option: any) {
		this._buttons = option.buttons;
		this._axes = option.axes;
	}

	public setButtonId(name: string, id: number): void {
		this._buttons[name] = id;
	}

	public getButtonId(name: string): number {
		return this._buttons[name];
	}

	public setAxisId(name: string, id: number): void {
		this._axes[name] = id;
	}

	public getAxisId(name: string): number {
		return this._axes[name];
	}
}

export module GamepadRemap {
	export class Presets {
		static readonly Xbox360 = new GamepadRemap({
			"buttons": {
				"A": 0, "B": 1,
				"X": 2, "Y": 3,
				"LB": 4, "RB": 5,
				"LT": 6, "RT": 7,
				"Back": 8, "Start": 9,
				"L3": 10, "R3": 11,
				"Up": 12, "Down": 13,
				"Left": 14, "Right": 15
			},
			"axes": {
				"LX": 0, "LY": 1,
				"RX": 2, "RY": 3
			}
		});
	}
}

export class Gamepads extends EventEmitter {
	protected _states: GamepadState[] = [];

	constructor() {
		super();
		window.addEventListener(Gamepads.Events.Connected, (e: GamepadEvent) => {
			const gamepad = e.gamepad;
			const state = new GamepadState(
				gamepad.buttons.length,
				gamepad.axes.length
			);
			this._states.push(state);

			this.emit("connected", gamepad, state);
		});
		window.addEventListener(Gamepads.Events.Disconnected, (e: GamepadEvent) => {
			const gamepad = e.gamepad;
			this.emit("disconnected", gamepad);
		});
	}

	public static getGamepad(index: number): Gamepad {
		const gamepads = navigator.getGamepads();
		if (gamepads.length <= 0) {
			return null;
		}
		return gamepads[index];
	}

	public state(index: number): GamepadState {
		return this._states[index];
	}

	public update(): void {
		const states = this._states;
		const count = states.length;
		const gamepads = navigator.getGamepads();
		for (let i = 0; i < count; i++) {
			states[i].update(gamepads[i]);
		}
	}

	public remap(index: number, remap: GamepadRemap): void {
		const state = this._states[index];
		if (state == null) {
			return;
		}
		state.remap(remap);
	}

	public isKeyHold(index: number, buttonId: number | string): boolean {
		const state = this._states[index];
		if (state == null) {
			return false;
		}
		return state.isKeyHold(buttonId);
	}

	public isKeyDown(index: number, buttonId: number | string): boolean {
		const state = this._states[index];
		if (state == null) {
			return false;
		}
		return state.isKeyDown(buttonId);
	}

	public isKeyUp(index: number, buttonId: number | string): boolean {
		const state = this._states[index];
		if (state == null) {
			return false;
		}
		return state.isKeyUp(buttonId);
	}

	public isAxisChange(index: number, axisId: number | string): boolean {
		const state = this._states[index];
		if (state == null) {
			return false;
		}
		return state.isAxisChange(axisId);
	}

	public getAxis(index: number, axisId: number | string): number {
		const state = this._states[index];
		if (state == null) {
			return 0;
		}
		return state.getAxis(axisId);
	}
}

export module Gamepads {
	export module Events {
		export const Connected: string = "gamepadconnected";
		export const Disconnected: string = "gamepaddisconnected";
	}
}