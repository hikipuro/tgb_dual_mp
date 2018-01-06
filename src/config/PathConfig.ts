
import * as path from "path";

export class PathConfig {
	public save: string = null;

	constructor() {
		this.save = path.join(process.cwd(), "save");
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