export class SpeedConfig {
	public fps: number = 60;
	public frameSkip: number = 0;
	public fastFps: number = 300;
	public fastFrameSkip: number = 9;
	public showFps: boolean = false;

	public static fromJSON(json: any): SpeedConfig {
		const speedConfig = new SpeedConfig();
		if (json == null) {
			return speedConfig;
		}

		for (var name in speedConfig) {
			if (!speedConfig.hasOwnProperty(name)) {
				continue;
			}
			speedConfig[name] = json[name];
		}
		return speedConfig;
	}
}
