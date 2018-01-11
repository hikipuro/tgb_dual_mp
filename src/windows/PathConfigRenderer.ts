import { ipcRenderer, IpcMessageEvent } from "electron";
import { PathConfig } from "../config/PathConfig";
import { PathConfigWindow } from "../windows/PathConfigWindow";
import { RendererUtility } from "../RendererUtility";

export class PathConfigRenderer {
	constructor(languageJson: any, pathConfig: PathConfig) {
		RendererUtility.overrideConsoleLog();
		pathConfig = PathConfig.fromJSON(pathConfig);
		this.translateText(languageJson);

		const save = document.querySelector("#save") as HTMLInputElement;
		const selectSave = document.querySelector("#selectSave") as HTMLButtonElement;
		const media = document.querySelector("#media") as HTMLInputElement;
		const selectMedia = document.querySelector("#selectMedia") as HTMLButtonElement;
		const buttonOK = document.querySelector("#ok") as HTMLButtonElement;

		save.value = pathConfig.save;
		media.value = pathConfig.media;

		save.addEventListener("input", () => {
			pathConfig.save = save.value;
		});
		selectSave.addEventListener("click", () => {
			ipcRenderer.send("PathConfigWindow.selectSavePath", pathConfig);
		});
		media.addEventListener("input", () => {
			pathConfig.media = media.value;
		});
		selectMedia.addEventListener("click", () => {
			ipcRenderer.send("PathConfigWindow.selectMediaPath", pathConfig);
		});
		buttonOK.addEventListener("click", function handler() {
			buttonOK.removeEventListener("click", handler);
			ipcRenderer.send("PathConfigWindow.close", pathConfig);
		});

		ipcRenderer.on("PathConfigWindow.selectSavePath", (event: Electron.IpcMessageEvent, arg: any) => {
			pathConfig = PathConfig.fromJSON(arg);
			save.value = pathConfig.save;
		});
		ipcRenderer.on("PathConfigWindow.selectMediaPath", (event: Electron.IpcMessageEvent, arg: any) => {
			pathConfig = PathConfig.fromJSON(arg);
			media.value = pathConfig.media;
		});
		
		// window close
		window.onbeforeunload = (e: BeforeUnloadEvent) => {
			ipcRenderer.removeAllListeners("PathConfigWindow.selectSavePath");
			ipcRenderer.removeAllListeners("PathConfigWindow.selectMediaPath");
		};
		
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
		if (languageJson == null || languageJson.path == null) {
			return;
		}

		const json = languageJson.path;
		if (json.title != null) {
			document.title = json.title;
		}
		
		const elements = {
			save: document.querySelector("#save-label"),
			media: document.querySelector("#media-label")
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
