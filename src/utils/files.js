const { readdirSync } = require("fs");

function getFiles(path) {
	const files = [];
	const dirents = readdirSync(path, { withFileTypes: true });

	for (const dirent of dirents) {
		if (dirent.isDirectory()) {
			files.push(...getFiles(`${path}/${dirent.name}`));
		} else {
			files.push(`${path}/${dirent.name}`);
		}
	}
	return files;
}

module.exports = { getFiles };
