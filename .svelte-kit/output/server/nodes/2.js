

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.193727d9.js","_app/immutable/chunks/scheduler.e108d1fd.js","_app/immutable/chunks/index.6f232df0.js","_app/immutable/chunks/index.0378bb41.js"];
export const stylesheets = ["_app/immutable/assets/2.dcac2c08.css"];
export const fonts = [];
