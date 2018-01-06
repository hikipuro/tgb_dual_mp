
import * as path from "path";

export class PathConfig {
	public savePath: string = null;

	constructor() {
		this.savePath = path.join(process.cwd(), "save");
	}
}