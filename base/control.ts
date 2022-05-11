import {Signal, Part, Controller, Sensor, Transmitter, Message} from "../api/signal.js";
import {EMPTY} from "../api/util.js";

export class Control implements Part, Transmitter, Sensor {
	constructor(controller: Controller) {
		this.actions = controller || Object.create(null);
	}
	private actions: Controller;
	get owner() {
		return this.partOf?.owner;
	}
	get partOf() {
		return undefined;
	}
	get content(): Iterable<Part> {
		return EMPTY.array;
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
		if (typeof signal != "object") signal = new Message(signal || "", this);
		signal.subject && this.receive(signal);
		signal.subject && Promise.resolve(signal).then(signal => sendTo(this, signal));
		return;

		function sendTo(sender: Part, signal: Signal) {
			if (sender.content) for (let part of sender.content) {
				signal.from = sender;
				part.receive(signal);
				if (!signal.subject) return;
				sendTo(part, signal);
			}
		}
	}
	sense(signal: Signal) {
		signal.subject && this.receive(signal);
		signal.from = this;

		for (let sensor = this.partOf; sensor; sensor = sensor.partOf) {
			if (!signal.subject) return;
			sensor.receive(signal);
			signal.from = sensor;
		}
	}
}

