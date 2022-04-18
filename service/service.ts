import {Bundle} from "../api/model.js";
// import serverConf from "./conf/server.js";
// import endpoints from "./conf/service.js";

function config(conf: Bundle<any>, ctx: any, endpoints: Bundle<any>) {
	for (let path in endpoints) {
		let endpoint = endpoints[path];
		let action: any;
		if (typeof endpoint == "string") {
			action = conf.engine.static(endpoint);
		} else if (typeof endpoint == "object") {
			action = conf.engine.Router();
			config(conf, ctx, endpoint);
		} else {
			function service(req) {
				req.fs = conf.modules.fs;
				req.context = conf;
				return endpoint(req);
			}
			action = service;
		}
		ctx.use(path, action);
	}
}

function startApp(modules: Bundle<any>, context: Bundle<any>, endpoints: Bundle<any>) {
	let conf = {
		modules: modules,
		engine: modules.express,
		context: context
	};
	let app = modules.express();
	app.use(modules.bodyParser.text({type: "text/plain"}));
	config(conf, app, endpoints);
	return app;
}

export default function start(serverConf: Bundle<any>, serviceConf: Bundle<any>) {
	let modules = serverConf.modules;
	console.info(`Service file context "${modules.fs.realpathSync(".")}"`)
	let service = startApp(modules, {}, serviceConf);
	const httpServer = modules.http.createServer(service);
	httpServer.listen(serverConf.server.port, () => console.info());
	console.info(`Service listening on HTTP port "${serverConf.server.port}"`)	
}