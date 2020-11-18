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

var core = {
}

var __debugConsoleTextStyle = "color: #0000ff"
var __debugConsoleLabelStyle = [ 
	"background-color: #6666ff",
	"color: #ffffff",
	"font-weight: bold",
	"padding: 0.1em 0.5em",
	"box-sizing: border-box",
	"margin-top: -0.1em",
].join("; ")

/**
 * show debug text
 * down the road, may expand this to accept a point or set of points, which will render dots at those coordinates.
 */
core.debug = function (data, sticky=false) {
	var stack;
	try {
		thisismeanttofail__48AD9F5E0F44ABB95A77C177BF2DFBE();
	}
	catch (e) {
		stack = e.stack.replace(new RegExp("^ReferenceError: "+e.message+"\n[^\n]*\n"), '')
	}

	function formatNumber (n) {
		return parseFloat( parseFloat(n).toFixed(3) )
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
				formatNumber( data.x ),
				formatNumber( data.y ),
				formatNumber( data.z ),
			].join(", ") + " ]\n"
		}
		else if (data instanceof CSG.Vector2D) {
			return "[ " + [
				formatNumber( data.x ),
				formatNumber( data.y ),
			].join(", ") + " ]\n"
		}
		else if (""+data=="[object Object]") {
			return JSON.stringify(data)
		}
		else {
			return data
		}
	}

	var msgText = formatData(data)

	console.debug(
		"%ccore.debug%c " + msgText,
		__debugConsoleLabelStyle + (msgText.match(/\n/) ? " margin-bottom: 0.1em" : ""),
		__debugConsoleTextStyle)

	context.postMessage({
		cmd: "core.showDebugMessage",
		text: msgText,
		stack: stack,
		sticky: sticky,
		// fadeTimeout: 5000,
	});
}

/**
 * given an object that'll be rendered,
 * get object bounds and send it to core.debug
 *
 * (string) whichAttribute = s, c, b0, b1
 */
core.debugBounds = function (obj, whichAttribute="s") {

	let bounds = t.getBounds(obj)
	switch (whichAttribute) {
		case "s":
		case "c":
			core.debug(bounds[whichAttribute])
		break;
		case "b0":
			core.debug(bounds.b[0])
		break;
		case "b1":
			core.debug(bounds.b[1]);
		break;
		default:
			throw "AttributeError: valid options are 's', 'c', 'b0', or 'b1'"
		break;
	}

}

/**
 * just return nothing; we'll fill in the rest later
 */
core.delayedRender = function () {
	return t.ccube([1,1,1])
		.translate([0,0,1])
		.subtract([
			t.ccube([100,100,100])
		])
}

core.renderComplete = function (result) {

    if(result.length) {                   // main() return an array, we consider it a bunch of CSG not intersecting
       var o = result[0];
       if(o instanceof CAG) {
          o = o.extrude({offset: [0,0,0.1]});
       }
       for(var i=1; i<result.length; i++) {
          var c = result[i];
          if(c instanceof CAG) {
             c = c.extrude({offset: [0,0,0.1]});
          }
          o = o.unionForNonIntersecting(c);
       }
       result = o;
    }
    var result_compact = result.toCompactBinary();
    result = null; // not needed anymore
    context.postMessage({
		cmd: 'rendered',
		result: result_compact
	});

}

return core
})(this);
