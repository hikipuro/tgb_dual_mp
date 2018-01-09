import { debug } from "util";

export class MiscConfig {
	public type: string = "auto";

	public static fromJSON(json: any): MiscConfig {
		const miscConfig = new MiscConfig();
		if (json == null) {
			return miscConfig;
		}

		for (var name in miscConfig) {
			if (!miscConfig.hasOwnProperty(name)) {
				continue;
			}
			miscConfig[name] = json[name];
		}

		switch (miscConfig.type) {
		case "gb":
		case "gbc":
		case "gba":
		case "auto":
			break;
		default:
			miscConfig.type = "auto";
		}
		return miscConfig;
	}
}
