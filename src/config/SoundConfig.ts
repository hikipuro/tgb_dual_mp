export class SoundConfig {
	public master: boolean = true;
	public square1: boolean = true;
	public square2: boolean = true;
	public wave: boolean = true;
	public noise: boolean = true;
	public echo: boolean = true;
	public lowPass: boolean = true;

	public static fromJSON(json: any): SoundConfig {
		const soundConfig = new SoundConfig();
		if (json == null) {
			return soundConfig;
		}

		for (var name in soundConfig) {
			if (!soundConfig.hasOwnProperty(name)) {
				continue;
			}
			soundConfig[name] = json[name];
		}
		return soundConfig;
	}
}
