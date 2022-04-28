export type level = "error" | "warn" | "info" | "debug";

export interface Notice {
	level: level;
	message: string;
	value?: any
}

export abstract class Notifier {
	notice(level: level, message: string): Notice {
		return {
			level: level,
			message: message,
			value: this
		}
	}	
}
