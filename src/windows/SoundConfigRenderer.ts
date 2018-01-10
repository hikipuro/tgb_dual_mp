import { ipcRenderer, IpcMessageEvent } from "electron";
import { SoundConfig } from "../config/SoundConfig";
import { SoundConfigWindow } from "../windows/SoundConfigWindow";
import { RendererUtility } from "../RendererUtility";

export class SoundConfigRenderer {
	constructor(languageJson: any, soundConfig: SoundConfig) {
		RendererUtility.overrideConsoleLog();
		soundConfig = SoundConfig.fromJSON(soundConfig);
		this.translateText(languageJson);

		const volume = document.querySelector("#volume") as HTMLInputElement;
		const master = document.querySelector("#master") as HTMLInputElement;
		const square1 = document.querySelector("#square1") as HTMLInputElement;
		const square2 = document.querySelector("#square2") as HTMLInputElement;
		const wave = document.querySelector("#wave") as HTMLInputElement;
		const noise = document.querySelector("#noise") as HTMLInputElement;
		const echo = document.querySelector("#echo") as HTMLInputElement;
		const lowPass = document.querySelector("#lowPass") as HTMLInputElement;

		volume.value = String(soundConfig.volume);
		master.checked = soundConfig.master;
		square1.checked = soundConfig.square1;
		square2.checked = soundConfig.square2;
		wave.checked = soundConfig.wave;
		noise.checked = soundConfig.noise;
		echo.checked = soundConfig.echo;
		lowPass.checked = soundConfig.lowPass;

		volume.addEventListener("input", () => {
			console.log("SoundConfig.volume", volume.value);
			let value = Number(volume.value);
			value = Math.max(Number(volume.min), value);
			value = Math.min(Number(volume.max), value);
			volume.value = String(value);
			updateConfig();
		});
		master.addEventListener("change", () => {
			console.log("SoundConfig.master", master.checked);
			updateConfig();
		});
		square1.addEventListener("change", () => {
			console.log("SoundConfig.square1", square1.checked);
			updateConfig();
		});
		square2.addEventListener("change", () => {
			console.log("SoundConfig.square2", square2.checked);
			updateConfig();
		});
		wave.addEventListener("change", () => {
			console.log("SoundConfig.wave", wave.checked);
			updateConfig();
		});
		noise.addEventListener("change", () => {
			console.log("SoundConfig.noise", noise.checked);
			updateConfig();
		});
		echo.addEventListener("change", () => {
			console.log("SoundConfig.echo", echo.checked);
			updateConfig();
		});
		lowPass.addEventListener("change", () => {
			console.log("SoundConfig.lowPass", lowPass.checked);
			updateConfig();
		});
		
		function updateConfig(): void {
			let soundConfig = new SoundConfig();
			soundConfig.volume = Number(volume.value);
			soundConfig.master = master.checked;
			soundConfig.square1 = square1.checked;
			soundConfig.square2 = square2.checked;
			soundConfig.wave = wave.checked;
			soundConfig.noise = noise.checked;
			soundConfig.echo = echo.checked;
			soundConfig.lowPass = lowPass.checked;
			ipcRenderer.send("SoundConfigWindow.update", soundConfig);
		}
		
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
	
	protected translateText(languageJson: any): void {
		if (languageJson == null || languageJson.sound == null) {
			return;
		}

		const json = languageJson.sound;
		if (json.title != null) {
			document.title = json.title;
		}
		
		const elements = {
			channels: document.querySelector("#channels"),
			effectors: document.querySelector("#effectors"),
			volume: document.querySelector("#volume-label"),
			master: document.querySelector("#master-label"),
			square1: document.querySelector("#square1-label"),
			square2: document.querySelector("#square2-label"),
			wave: document.querySelector("#wave-label"),
			noise: document.querySelector("#noise-label"),
			echo: document.querySelector("#echo-label"),
			lowPass: document.querySelector("#lowPass-label")
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
