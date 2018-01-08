import * as path from "path";
import { Config } from "./Config";

export class PathConfig {
	public save: string = null;
	public roms: string = "";

	constructor() {
		this.save = path.join(Config.getCurrentPath(), "save");
	}

	public static fromJSON(json: any): PathConfig {
		const pathConfig = new PathConfig();
		if (json == null) {
			return pathConfig;
		}

		for (var name in pathConfig) {
			if (!pathConfig.hasOwnProperty(name)) {
				continue;
			}
			pathConfig[name] = json[name];
		}
		return pathConfig;
	}
}