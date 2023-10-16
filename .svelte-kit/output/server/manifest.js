export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.c4545b7e.js","app":"_app/immutable/entry/app.a15e3c86.js","imports":["_app/immutable/entry/start.c4545b7e.js","_app/immutable/chunks/scheduler.e108d1fd.js","_app/immutable/chunks/singletons.1aaa299a.js","_app/immutable/chunks/index.0378bb41.js","_app/immutable/entry/app.a15e3c86.js","_app/immutable/chunks/scheduler.e108d1fd.js","_app/immutable/chunks/index.6f232df0.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		matchers: async () => {
			
			return {  };
		}
	}
}
})();
