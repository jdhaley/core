import {Actions, Message, Part, Receiver, Signal} from "./core.js";

export interface Transmitter {
	send(signal: Signal): void;
}

export interface Sensor {
	sense(signal: Signal): void;
}

export class Control implements Part, Transmitter, Sensor {
	constructor(actions: Actions) {
		this.actions = actions || {};
	}
	actions: Actions;
	get owner() {
		return this.partOf().owner;
	}
	get partOf() {
		return null;
	}
	get parts() {
		return null;
	}
	receive(signal: Signal)  {
		if (!signal) return;
		let subject = signal.subject;
		while (subject) try {
			let action = this.actions[subject];
			action && action.call(this, signal);
			subject = (subject != signal.subject ? signal.subject : "");	
		} catch (error) {
			console.error(error);
			//Stop all propagation - esp. important is the enclosing while loop
			subject = "";
		}
	}
	send(signal: Signal | string) {
		if (typeof signal != "object") signal = new Message(signal || "", "down");
		//TODO decide if there should always be a from.
		//signal.from = this;
		signal.subject && this.receive(signal);
		signal.subject && Promise.resolve(signal).then(signal => sendTo(this, signal));
		return;

		function sendTo(sender: Part, signal: Signal) {
			if (sender.parts) for (let part of sender.parts) {
				signal.from = sender;
				part.receive(signal);
				if (!signal.subject) return;
				sendTo(part, signal);
			}
		}
	}
	sense(signal: Signal | string) {
		if (typeof signal != "object") signal = new Message(signal, "up");
		signal.subject && this.receive(signal);
		signal.from = this;

		for (let sensor = this.partOf; sensor; sensor = sensor.partOf) {
			if (!signal.subject) return;
			sensor.receive(signal);
			signal.from = sensor;
		}
	}
}
