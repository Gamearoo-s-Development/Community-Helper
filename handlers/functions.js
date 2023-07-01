// Subcommand class, makes it cleaner to create subcommands
export class SubCommand {
	constructor(name, description, options = []) {
		this.type = 1;
		this.name = name;
		this.description = description;
		this.options = options;
	}
}

// Command Option
export class Option {
	constructor(name, description, type, required = false, autocomplete = false, choices = [], {channel_types = []} = {}) {
		this.name = name;
		this.description = description;
		this.type = type;
		this.required = required;
		this.choices = choices;
		this.autocomplete = autocomplete;
		this.channel_types = channel_types;
	}
}

/**
 * Create an error embed with ease
 * @param description
 * @returns {{ephemeral: boolean, embeds: [{color: number, description, title: string}]}}
 */
export function errorEmbed(description) {
	return {
		embeds: [{
			title: "Oops!",
			description: description,
			color: 0xFF0000
		}], ephemeral: true
	};
}

/*
* Loads all files in a directory
* @param {string} dirName - The directory to load files from
* @returns {Promise<Array<{name: string, data: any}>>}
*/
export async function loadFiles(dirName) {
	const {readdir} = await import("fs/promises");
	const files = [];

	const dirEntries = await readdir(dirName, {withFileTypes: true});
	for (const dirEntry of dirEntries) {
		if (dirEntry.isDirectory()) {
			const dirPath = `${dirName}/${dirEntry.name}`;
			const subFiles = await readdir(dirPath);
			for (const file of subFiles) {
				if (file.endsWith(".js")) {
					const module = await import(`../${dirPath}/${file}`);
					files.push({
						name: file.slice(0, -3),
						data: module.default,
					});
				}
			}
		}
	}
	return files;
}


/*
* Parse String to Milliseconds (or vise versa)
* @param {string|number} value - The value to parse
* @param {boolean} short - Return short format
* @returns {number|string}
*/
export function ms(value, short = false) {
	const s = 1000, m = s * 60,
		h = m * 60, d = h * 24;

	function parse(str) {
		str = String(str);
		if (str.length > 100) return;
		const match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
			str
		);
		if (!match) return;
		const n = parseFloat(match[1]);
		const type = (match[2] || "ms").toLowerCase();
		switch (type) {
		case "hours":
		case "hour":
		case "hrs":
		case "hr":
		case "h":
			return n * h;
		case "minutes":
		case "minute":
		case "mins":
		case "min":
		case "m":
			return n * m;
		case "seconds":
		case "second":
		case "secs":
		case "sec":
		case "s":
			return n * s;
		case "milliseconds":
		case "millisecond":
		case "msecs":
		case "msec":
		case "ms":
			return n;
		default:
			return undefined;
		}
	}

	function fmtShort(ms) {
		const msAbs = Math.abs(ms);
		if (msAbs >= d) return Math.round(ms / d) + "d";
		if (msAbs >= h) return Math.round(ms / h) + "h";
		if (msAbs >= m) return Math.round(ms / m) + "m";
		if (msAbs >= s) return Math.round(ms / s) + "s";
		return ms + "ms";
	}

	function fmtLong(ms) {
		const msAbs = Math.abs(ms);
		if (msAbs >= d) return plural(ms, msAbs, d, "day");
		if (msAbs >= h) return plural(ms, msAbs, h, "hour");
		if (msAbs >= m) return plural(ms, msAbs, m, "minute");
		if (msAbs >= s) return plural(ms, msAbs, s, "second");
		return ms + " ms";
	}

	function plural(ms, msAbs, n, name) {
		const isPlural = msAbs >= n * 1.5;
		return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
	}

	if (typeof value === "string" && value.length > 0) {
		return parse(value);
	} else if (typeof value === "number" && isFinite(value)) {
		if (short) return fmtShort(value);
		return fmtLong(value);
	}

	throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(value));
}