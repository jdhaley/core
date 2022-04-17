export type level = "error" | "warn" | "info" | "debug";

export interface Notice {
	level: level;
	message: string;
	value?: any
}

export interface Notifiable {
	/** a simple implementation would be: console[notice.level](notice); */
	notify(notice: Notice): void;
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
