import {bundle} from "../api/model.js";

//Modelled after Express
export interface Request {
	method: string;
	path: string;
	query: bundle<string>;
	body: bundle<any>;
	cookies: bundle<string>;
	signedCookies: bundle<string>;
	get(header: string): string,
}

export interface Response {
	cookie(name: string, value: any, options?: bundle<string>): void;
	clearCookie(name: string, options?: bundle<string>): void;
	set(headers: bundle<string>): void;
	type(type: string): void;
	send(content: any): void;
	sendStatus(status: number): void;
	
	context: any;
	req: Request;
	fs: FileSystem;
}

export interface FileSystem {
	readFileSync(path: string): string;
	writeFileSync(path: string, content: string): void;
	existsSync(path: string): boolean;
}