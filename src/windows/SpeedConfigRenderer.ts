import { ipcRenderer, IpcMessageEvent } from "electron";
import { SpeedConfig } from "../config/SpeedConfig";
import { RendererUtility } from "../RendererUtility";

export class SpeedConfigRenderer {
	constructor(languageJson: any, speedConfig: SpeedConfig) {
		RendererUtility.overrideConsoleLog();
		speedConfig = SpeedConfig.fromJSON(speedConfig);
		this.translateText(languageJson);

		const renderer = this;
		const frameSkip = document.querySelector("#frameSkip") as HTMLInputElement;
		const fps = document.querySelector("#fps") as HTMLInputElement;
		const fastFrameSkip = document.querySelector("#fastFrameSkip") as HTMLInputElement;
		const fastFps = document.querySelector("#fastFps") as HTMLInputElement;
		const showFps = document.querySelector("#showFps") as HTMLInputElement;

		frameSkip.value = String(speedConfig.frameSkip);
		fps.value = String(speedConfig.fps);
		fastFrameSkip.value = String(speedConfig.fastFrameSkip);
		fastFps.value = String(speedConfig.fastFps);
		showFps.checked = speedConfig.showFps;

		function onInput(e: Event) {
			const element = e.srcElement as HTMLInputElement;
			if (element == null) {
				return;
			}
			let value = Number(element.value);
			value = Math.max(Number(element.min), value);
			value = Math.min(Number(element.max), value);
			element.value = String(value);
			speedConfig[element.id] = value;
			renderer.applyConfig(speedConfig);
		}

		frameSkip.addEventListener("input", onInput);
		fps.addEventListener("input", onInput);
		fastFrameSkip.addEventListener("input", onInput);
		fastFps.addEventListener("input", onInput);
		showFps.addEventListener("change", () => {
			speedConfig.showFps = showFps.checked;
			renderer.applyConfig(speedConfig);
		});
		
		// disable drag & drop
		document.body.ondragover = () => {
			return false;
		};
		document.body.ondragleave = () => {
			return false;
		}
		document.body.ondragend = () => {
			return false;
		}
		document.body.ondrop = () => {
			return false;
		}
	}

	protected applyConfig(speedConfig: SpeedConfig): void {
		ipcRenderer.send("SpeedConfigWindow.apply", speedConfig);
	}
	
	protected translateText(languageJson: any): void {
		if (languageJson == null || languageJson.speed == null) {
			return;
		}

		const json = languageJson.speed;
		if (json.title != null) {
			document.title = json.title;
		}
		
		const elements = {
			normal: document.querySelector("#normal-label"),
			frameSkip: document.querySelector("#frameSkip-label"),
			fps: document.querySelector("#fps-label"),
			fast: document.querySelector("#fast-label"),
			fastFrameSkip: document.querySelector("#fastFrameSkip-label"),
			fastFps: document.querySelector("#fastFps-label"),
			showFps: document.querySelector("#showFps-label")
		};
		
		for (const name in elements) {
			console.log(name, json[name]);
			if (json[name] == null) {
				continue;
			}
			elements[name].innerText = json[name];
		}
	}
}
