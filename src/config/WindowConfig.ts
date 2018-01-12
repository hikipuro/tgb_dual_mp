import { Config } from "./Config";
import { Constants } from "../Constants";

export class WindowConfig {
	public width: number = Constants.ScreenWidth * 3;
	public height: number = Constants.ScreenHeight * 3;
	public x: number = null;
	public y: number = null;
	public showKey: boolean = false;
	public keyX: number = null;
	public keyY: number = null;
	public showSound: boolean = false;
	public soundX: number = null;
	public soundY: number = null;
	public showSpeed: boolean = false;
	public speedX: number = null;
	public speedY: number = null;
	public showPath: boolean = false;
	public pathX: number = null;
	public pathY: number = null;

	public static fromJSON(json: any): WindowConfig {
		const windowConfig = new WindowConfig();
		if (json == null) {
			return windowConfig;
		}

		for (var name in windowConfig) {
			if (!windowConfig.hasOwnProperty(name)) {
				continue;
			}
			if (json[name] == null) {
				continue;
			}
			windowConfig[name] = json[name];
		}
		return windowConfig;
	}
}
