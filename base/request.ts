import { Bundle } from "../api/model";

//Modelled after Express
export interface Request /*extends Signal*/ {
	context: any;
	method: string;
	path: string;
	query: Bundle<string>;
	body: Bundle<any>;
	cookies: Bundle<string>;
	signedCookies: Bundle<string>;
	get(header: string): string,
	res: Response;
	fs: FileSystem;
}

interface Response {
	cookie(name: string, value: any, options?: Bundle<string>): void;
	clearCookie(name: string, options?: Bundle<string>): void;
	set(headers: Bundle<string>): void;
	type(type: string): void;
	send(content: any): void;
	sendStatus(status: number): void;
}

interface FileSystem {
	readFileSync(path: string): string;
	writeFileSync(path: string, content: string): void;
	existsSync(path: string): boolean;
}