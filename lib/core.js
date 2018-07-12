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

	function formatData (data) {
		var out = ""
		if (data instanceof Array) {
			return "[ \n" + data.map(function(d){
				var formattedData = formatData(d)
				if (formattedData && formattedData.trim) formattedData = formattedData.trim()
				return "  " + formattedData + ", " }).join("\n") + "\n]\n";
		}
		else if (typeof data == "number") {
			return parseFloat( data.toFixed(3) )
		}
		else if (data instanceof CSG.Vector3D) {
			return "[ " + [
				parseFloat( data.x.toFixed(3) ),
				parseFloat( data.y.toFixed(3) ),
				parseFloat( data.z.toFixed(3) ),
			].join(", ") + " ]\n"
		}
		else if (data instanceof CSG.Vector2D) {
			return "[ " + [
				parseFloat( data.x.toFixed(3) ),
				parseFloat( data.y.toFixed(3) ),
			].join(", ") + " ]\n"
		}
		else {
			return data
		}
	}

	var msgText = formatData(data)

	console.debug("[[core.debug]] " + msgText)
	context.postMessage({
		cmd: "core.showDebugMessage",
		text: msgText,
		stack: stack,
	});
}

return core
})(this);
