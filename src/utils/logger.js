function debug(...args) {
	if (process.env.NODE_ENV !== "development") {
		console.info("[DEBUG]".magenta, ...args);
	}
}

function success(...args) {
	console.info("[SUCCESS]".green, ...args);
}

function info(...args) {
	console.info("[INFO]".blue, ...args);
}

function warn(...args) {
	console.warn("[WARN]".yellow, ...args);
}

function error(...args) {
	console.error("[ERROR]".red, ...args);
}

module.exports = { debug, success, info, warn, error };