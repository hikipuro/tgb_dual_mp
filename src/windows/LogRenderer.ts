import { ipcRenderer, IpcMessageEvent } from "electron";
import { LogWindow } from "../windows/LogWindow";
import { RendererUtility } from "../RendererUtility";

export class LogRenderer {
	constructor(languageJson: any) {
		RendererUtility.overrideConsoleLog();
		this.translateText(languageJson);

		const log = document.querySelector("#log") as HTMLTextAreaElement;

		ipcRenderer.on("LogWindow.log", (event: Electron.IpcMessageEvent, arg: any) => {
			log.textContent += arg;
			log.scrollTop = log.scrollHeight;
		});

		// window close
		window.onbeforeunload = (e: BeforeUnloadEvent) => {
			ipcRenderer.removeAllListeners("LogWindow.log");
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
		if (languageJson == null || languageJson.log == null) {
			return;
		}

		const json = languageJson.log;
		if (json.title != null) {
			document.title = json.title;
		}
	}
}
