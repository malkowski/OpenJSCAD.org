/**
 * Core functions that are called from within jscad scripts.
 * 
 * Core functions are things specific to the openjscad interface, though most stuff currently lives in other places.
 * Examples of what you might find here:
 *  - show error/debug messages
 *  - render object on workplane
 *
 * Long-term, I think it makes sense to load all client-side libraries using require.js, but for now this just
 * exports global 'core' object, in fitting with existing openjscad design principles.
 */
core = (function(context){

var core = {}

/**
 * show debug text
 * down the road, may expand this to accept a point or set of points, which will render dots at those coordinates.
 */
core.debug = function (data) {
	var stack;
	try {
		thisismeanttofail__48AD9F5E0F44ABB95A77C177BF2DFBE();
	}
	catch (e) {
		stack = e.stack.replace(new RegExp("^ReferenceError: "+e.message+"\n[^\n]*\n"), '')
	}

	context.postMessage({
        cmd: "core.showDebugMessage",
        text: data,
		stack: stack,
    });
}

return core
})(this);
