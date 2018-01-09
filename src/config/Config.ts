import * as Electron from "electron";
import * as fs from "fs";
import * as path from "path";
import { KeyConfig } from "./KeyConfig";
import { ScreenConfig } from "./ScreenConfig";
import { SoundConfig } from "./SoundConfig";
import { PathConfig } from "./PathConfig";
import { WindowConfig } from "./WindowConfig";

export class Config {
	public static readonly Path: string = "config.json";
	public key: KeyConfig;
	public screen: ScreenConfig;
	public sound: SoundConfig;
	public path: PathConfig;
	public window: WindowConfig;

	constructor() {
		this.key = new KeyConfig();
		this.screen = new ScreenConfig();
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
		config.screen = ScreenConfig.fromJSON(json.screen);
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
	
	public static getLanguageJson(): any {
		const LanguagesPath: string = "../../languages/";
		const locale: string = Electron.app.getLocale();
		const languageFile: string = path.join(__dirname, LanguagesPath, locale + ".json");
		if (!fs.existsSync(languageFile)) {
			return null;
		}
		return JSON.parse(fs.readFileSync(languageFile, "utf8"));
	}
}