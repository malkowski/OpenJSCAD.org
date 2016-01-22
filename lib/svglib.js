var global = this;
var svglib = (function(){

var svglib = {};

var createShapeFromSvgData = function (el, height, axis) {
	axis = (axis||"").toUpperCase();
	var transform;
	switch (axis) {
		case "X":
			transform = function(shape){
				return union(shape)
				.transform([ 0, 0, -height/2 ])
				.rotateX(90)
				.rotateZ(-90)
			};
		break;
		case "Y":
			transform = function(shape){
				return union(shape)
				.transform([ 0, 0, -height/2 ])
				.rotateX(90)
			};
		break;
		case "Z":
			transform = function(shape){
				return union(shape)
				.transform([ 0, 0, -height/2 ]) 
			};
		break;
		default:
			transform = function(shape){
				return union(shape);
			};
		break;
	}

	//console.log(el);
	var shape;
	switch (el.type) {
		case "circle":
			shape = cylinder({ r: el.attr.r, h: height })
			.translate([ el.attr.cx, el.attr.cy, 0 ]);
		break;
		case "rect":
			shape = cube([ el.attr.width, el.attr.height, height ])
			.translate([ el.attr.x, el.attr.y-el.attr.height, 0 ]);
		break;
		case "polygon":
		default:
			shape = linear_extrude( { height: height }, hull(CAG.fromPoints(el.attr.points)) );
		break;
	}

	var fillColor = [ 1, 0, 0 ];
	if (el.attr.fill !== undefined) {
		if (el.attr.fill.match(/^#/)) {
			fillColor = el.attr.fill
				.replace(/^#/, '')
				.split(/(..)/)
				.filter(function(c){return c.length>0})
				.map(function(c){ return parseInt(c,16)/255 });

			//console.log(el.attr.id+".setColor("+fillColor.join(',')+")");
		}
		// TODO: determine if other formatted strings are valid for svg: probably rgb/rgba as well
	}

	return transform(shape).setColor(fillColor);
}

var FlatShapeCollection = function () {
	this.shapes = {};
	global.shapes = this.shapes;
};
FlatShapeCollection.prototype = {};
FlatShapeCollection.prototype.push = function (id, shape) {
	this.shapes[id] = shape;
};

FlatShapeCollection.prototype.filter = function (callback) {
	var self = this;
	var filteredShapes = new FlatShapeCollection;
	Object.keys(this.shapes).forEach(function(id){
		var shape = self.shapes[id];
		if (callback.call(self, shape, id)) {
			filteredShapes.push(id, shape);
		}
	});
	return filteredShapes;
};

FlatShapeCollection.prototype.extrude = function (id, height, axis) {
	return createShapeFromSvgData(this.shapes[id], height, axis);
};

// can pass an array of IDs as well, to do a bunch at once, unioned together:
FlatShapeCollection.prototype.rotateExtrude = function (id, params) {
	var self = this;
	var shape;

	if (id instanceof Array) {
		return union(id.map(function(id){
			return self.rotateExtrude(id, params);
		}));
	}

	var attr = this.shapes[id].attr;
	switch (this.shapes[id].type) {
		case "rect":
			shape = CAG.rectangle({ center: [ attr.x, attr.y ], radius: [ attr.width/2, attr.height/2 ] });
		break;
		case "circle":
			shape = CAG.circle({ center: [ attr.x, attr.y ], radius: attr.r });
		break;
		case "polygon":
		default:
			shape = CAG.fromPoints(attr.points);
		break;
	}
	return rotate_extrude({fn:t.fn}, shape);
};

FlatShapeCollection.prototype.extrudeAllPolygons = function (height, axis) {
	var self = this;
	var shapes = [];
	Object.keys(this.shapes).filter(function(id){ return id != "svg" }).forEach(function(id){
		shapes.push(createShapeFromSvgData(self.shapes[id], height, axis));
	});
	return union(shapes);
};

// layers = [ { id: "", translate: [x,y,z], rotate:[aX,aY,aZ] }, ... ]
// offset is the distance to translate away from origin along the default axis (Z)
// transform function is a callback which can be used to further customize the final shape
// transform = function(csg, t, slice){ return csg.rotateX(10) }
FlatShapeCollection.prototype.solidFromSlices = function (layers, transformCallback) {
	var self = this;

	// first polygon we'll start with
	var layer = layers.shift();
	var csg = CAG.fromPoints(self.shapes[ layer.id ].attr.points);
	if (layer.translate) csg = csg.translate(layer.translate);
	if (layer.rotate)    csg = csg.rotate(layer.rotate);

	return csg.solidFromSlices({
		numslices: layers.length,
		loop: false,
		callback: function (t,slice) {
			// t: 0..1
			// slice: 0 .. layers.length
			var layer = layers[slice];
			var shape = self.shapes[ layer.id ];

			var csg   = CAG.fromPoints(shape.attr.points);
			if (layer.translate) csg = csg.translate(layer.translate);
			if (layer.rotate)    csg = csg.rotate(layer.rotate);

			return csg;
		}
	});

};

// given raw data from bin/svg2json, return object with keys set from IDs and values set to data structure
svglib.import = function (rawData) {
	var imported = {};
	rawData.forEach(function(el){
		if (el && el.type == "svg") {
			imported.svg = el;
		}
		else if (el && el.attr && el.attr.id) {
			imported[el.attr.id] = el;
		}
	});

	var viewbox;
	var v = imported.svg.attr.viewbox;
	imported.svg.attr.viewbox = [
	    v[0] - v[2]/2,
	    v[1] - v[3]/2,
	    v[2]/2,
	    v[3]/2
	];

	// force svg to be first element, so we can update viewbox definition
	var svgImportKeys = Object.keys(imported);
	svgImportKeys.splice( svgImportKeys.indexOf("svg"), 1 );
	svgImportKeys.unshift("svg");
	svgImportKeys.forEach(function(k){
	    var attr = imported[k].attr;
	    if (! attr) return;
	    
	    ["viewbox", "points", "x", "y", "cx", "cy", "r", "width", "height"].forEach(function(name){
	        if (attr[name] === undefined) return;
	        if (attr[name].map) {
	            attr[name] = attr[name].map(function(v){
	                return v.map
	                ? v.map(function(p){ return t.point2mm(p) })
	                : t.point2mm(v)
	            });
	        }
	        else {
	            attr[name] = t.point2mm(attr[name]);
	        }
	    });
	    
	    if (k == "svg") {
	        viewbox = attr.viewbox;
	        return;
	    }
	
	    // X points
	    [ "x", "cx" ].forEach(function(name){
	        if (attr[name] === undefined) return;
	        attr[name] -= viewbox[2];
	    });
	
	    // Y points
	    [ "y", "cy" ].forEach(function(name){
	        if (attr[name] === undefined) return;
	        attr[name] = -attr[name] + viewbox[3];
	    });
	
	    // 2D vectors
	    if (attr.points) {
	        attr.points = attr.points.map(function(v){
	            return [ v[0]-viewbox[2], -v[1]+viewbox[3] ]
	        });
	    }
	});

	// create shapes from SVG paths
	var shapes = new FlatShapeCollection;
	svgImportKeys.forEach(function(id){
		shapes.push(id, imported[id]);
	});

	return shapes;
};

return svglib;
})();

