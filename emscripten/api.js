mergeInto(LibraryManager.library, {
	jsCall: function (method) {
		if (!this["TgbDual.Callback"]) {
			return;
		}
		method = Pointer_stringify(method);
		this["TgbDual.Callback"].call(method);
	},
	jsCall1: function (method, arg1) {
		if (!this["TgbDual.Callback"]) {
			return;
		}
		method = Pointer_stringify(method);
		this["TgbDual.Callback"].call(method, arg1);
	},
	jsLog: function (message) {
		if (!this["TgbDual.Callback"]) {
			return;
		}
		message = Pointer_stringify(message);
		this["TgbDual.Callback"].call("log", message);
	}
});
