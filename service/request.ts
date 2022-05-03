import {Bundle} from "../api/model.js";

//Modelled after Express
export interface Request /*extends Signal*/ {
	method: string;
	path: string;
	query: Bundle<string>;
	body: Bundle<any>;
	cookies: Bundle<string>;
	signedCookies: Bundle<string>;
	get(header: string): string,
}

export interface Response {
	cookie(name: string, value: any, options?: Bundle<string>): void;
	clearCookie(name: string, options?: Bundle<string>): void;
	set(headers: Bundle<string>): void;
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