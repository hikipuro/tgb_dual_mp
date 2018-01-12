class GamepadInfo {
	public id: number;
	public button: number;
	constructor(id: number, button: number) {
		this.set(id, button);
	}
	public get label(): string {
		return this.id + " : " + this.button;
	}
	public set(id: number, button: number) {
		this.id = id;
		this.button = button;
	}
	public static fromJSON(json: any): GamepadInfo {
		if (json == null || json.id == null || json.button == null) {
			return null;
		}
		return new GamepadInfo(json.id, json.button);
	}
}

export class GamepadConfig {
	public a: GamepadInfo = new GamepadInfo(0, 1);
	public b: GamepadInfo = new GamepadInfo(0, 0);
	public start: GamepadInfo = new GamepadInfo(0, 3);
	public select: GamepadInfo = new GamepadInfo(0, 2);
	public up: GamepadInfo = new GamepadInfo(0, 12);
	public down: GamepadInfo = new GamepadInfo(0, 13);
	public left: GamepadInfo = new GamepadInfo(0, 14);
	public right: GamepadInfo = new GamepadInfo(0, 15);
	public fast: GamepadInfo = new GamepadInfo(0, 4);
	public autoFire: GamepadInfo = new GamepadInfo(0, 5);
	public pause: GamepadInfo = new GamepadInfo(0, 6);

	public setValue(id: string, gamepadId: number, button: number): void {
		if (id == null || !this.hasOwnProperty(id)) {
			return;
		}
		this[id].set(gamepadId, button);
	}

	public static fromJSON(json: any): GamepadConfig {
		const gamepadConfig = new GamepadConfig();
		if (json == null) {
			return gamepadConfig;
		}

		for (var name in gamepadConfig) {
			if (!gamepadConfig.hasOwnProperty(name)) {
				continue;
			}
			if (json[name] == null) {
				continue;
			}
			const gamepadInfo = GamepadInfo.fromJSON(json[name]);
			if (gamepadInfo != null) {
				gamepadConfig[name] = gamepadInfo;
			}
		}
		return gamepadConfig;
	}
}
