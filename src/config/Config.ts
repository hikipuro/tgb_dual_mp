import * as Electron from "electron";
import * as fs from "fs";
import * as path from "path";
import { KeyConfig } from "./KeyConfig";
import { PathConfig } from "./PathConfig";

export class Config {
	public static readonly Path: string = "config.json";
	public keyConfig: KeyConfig;
	public pathConfig: PathConfig;

	constructor() {
		this.keyConfig = new KeyConfig();
		this.pathConfig = new PathConfig();
	}

	public static load(): Config {
		const filePath = this.getFilePath();
		if (fs.existsSync(filePath)) {
			const data = fs.readFileSync(filePath, "utf8");
			return Config.fromJSON(JSON.parse(data));
		}
		return new Config();
	}

	public save(): void {
		const filePath = Config.getFilePath();
		fs.writeFileSync(filePath, JSON.stringify(this, null, 2));
	}

	public static fromJSON(json: any): Config {
		const config = new Config();
		config.keyConfig = json.keyConfig;
		return config;
	}

	public static getFilePath(): string {
		return path.join(process.cwd(), Config.Path);
		//return process.cwd();
		//return Electron.app.getAppPath();
	}
}