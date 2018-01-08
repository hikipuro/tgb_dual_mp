import * as Electron from "electron";
import * as fs from "fs";
import * as path from "path";
import { KeyConfig } from "./KeyConfig";
import { SoundConfig } from "./SoundConfig";
import { PathConfig } from "./PathConfig";
import { WindowConfig } from "./WindowConfig";

export class Config {
	public static readonly Path: string = "config.json";
	public key: KeyConfig;
	public sound: SoundConfig;
	public path: PathConfig;
	public window: WindowConfig;

	constructor() {
		this.key = new KeyConfig();
		this.sound = new SoundConfig();
		this.path = new PathConfig();
		this.window = new WindowConfig();
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
		if (json == null) {
			return config;
		}
		
		config.key = KeyConfig.fromJSON(json.key);
		config.sound = SoundConfig.fromJSON(json.sound);
		config.path = PathConfig.fromJSON(json.path);
		config.window = WindowConfig.fromJSON(json.window);
		return config;
	}

	public static getFilePath(): string {
		return path.join(Config.getCurrentPath(), Config.Path);
	}
	
	public static getCurrentPath(): string {
		if (this.isDevMode()) {
			return process.cwd();
		}
		// TODO: fix this
		if (process.type === "renderer") {
			return process.cwd();
		}
		let filePath = Electron.app.getAppPath();
		return path.dirname(filePath);
	}
	
	public static isDevMode(): boolean {
		// TODO: fix this
		// not correct result when this method run in renderer process
		// because Electron.app is null object
		if (process.type === "renderer") {
			return false;
		}
		const path = Electron.app.getAppPath();
		return path.indexOf("default_app.asar") >= 0;
	}
}