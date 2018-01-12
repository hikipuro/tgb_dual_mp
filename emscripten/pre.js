var input = "This is from the standard input\n";
var i = 0;
var Module = {
	preRun: function () {
		function stdin() {
			if (i < res.length) {
				var code = input.charCodeAt(i);
				++i;
				return code;
			} else {
				return null;
			}
		}
	
		var newLine = "\n".charCodeAt(0);
		var stdoutBuffer = "";
		function stdout(code) {
			if (code === newLine && stdoutBuffer !== "") {
				console.log(stdoutBuffer);
				stdoutBuffer = "";
			} else {
				stdoutBuffer += String.fromCharCode(code);
			}
		}

		var stderrBuffer = "";
		function stderr(code) {
			if (code === "\n".charCodeAt(0) && stderrBuffer !== "") {
				console.log(stderrBuffer);
				stderrBuffer = "";
			} else {
				stderrBuffer += String.fromCharCode(code);
			}
		}

		FS.init(stdin, stdout, stderr);
	}
};