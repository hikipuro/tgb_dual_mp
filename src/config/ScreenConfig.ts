export class ScreenConfig {
	public bg: boolean = true;
	public window: boolean = true;
	public sprite: boolean = true;

	public static fromJSON(json: any): ScreenConfig {
		const screenConfig = new ScreenConfig();
		if (json == null) {
			return screenConfig;
		}

		for (var name in screenConfig) {
			if (!screenConfig.hasOwnProperty(name)) {
				continue;
			}
			screenConfig[name] = json[name];
		}
		return screenConfig;
	}
}
