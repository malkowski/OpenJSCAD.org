var global = this;
var svglib = (function(){

var svglib = {};

var FlatShapeCollection = function () {
	this.fn = 32;
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

FlatShapeCollection.prototype.matchExtrude = function (re, height, axis) {
	return this.filter(function(shape,id){
		return id.match(re)
    }).extrudeAllPolygons(height, axis);
};

FlatShapeCollection.prototype.createShapeFromSvgData = function (el, height, axis) {
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
			shape = cylinder({ r: el.attr.r, h: height, fn: this.fn })
			.translate([ el.attr.cx, el.attr.cy, 0 ]);
		break;
		case "rect":
			shape = cube([ el.attr.width, el.attr.height, height ])
			.translate([ el.attr.x, el.attr.y-el.attr.height, 0 ]);
		break;
		case "path":
			shape = linear_extrude({ height: height }, CAG.fromPoints(this.getPointsFromPath(el, this.fn)) );
		break;
		case "polygon":
		default:
			//var p = polygon({ points: el.attr.points });
			//shape = linear_extrude({ height: height }, p);

			shape = new CSG.Path2D(el.attr.points, true)
				.innerToCAG()
				.extrude({ offset: [ 0, 0, height ] });

		break;
	}

	var fillColor = svglib.parseColorString(el.attr.fill);
	return transform(shape).setColor(fillColor);
};



FlatShapeCollection.prototype.extrude = function (id, height, axis) {
	var self = this;

	console.log("extrude("+id+","+height+","+axis+")");

	if (id instanceof Array) {
		return union(id.map(function(id){
			return self.extrude(id, height, axis);
		}));
	}
	else {
		return this.createShapeFromSvgData(this.shapes[id], height, axis);
	}
};

// follow path with a box with outline stroke
// w = stroke width, h = extrusion height (Z)
FlatShapeCollection.prototype.rectangularExtrude = function (id, params) {

	if (params.closed === undefined) params.closed = true;
	var self = this;

	if (id instanceof Array) {
		return union(id.map(function(id){
			return self.rectangularExtrude(id, params);
		}));
	}

    var points;

	var attr = this.shapes[id].attr;
	switch (this.shapes[id].type) {
		case "rect":
			points = [
				[ attr.x + attr.width/2, attr.y + attr.height/2 ],
				[ attr.x - attr.width/2, attr.y + attr.height/2 ],
				[ attr.x - attr.width/2, attr.y - attr.height/2 ],
				[ attr.x + attr.width/2, attr.y - attr.height/2 ],
			];
		break;
		case "circle":
			points = [];
			for (var i=0; i < t.fn; i++) {
				var x = attr.x + Math.sin(Math.PI*2*i/t.fn)*attr.r,
				    y = attr.y + Math.cos(Math.PI*2*i/t.fn)*attr.r;
				points.push([ x, y ]);
			}
		break;
		case "path":
			points = this.getPointsFromPath(this.shapes[id], params.fn);
		break;
		case "polyline":
		case "polygon":
		default:
		    points = attr.points;
		break;
	}

    return rectangular_extrude(points, params);
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

/**
 * designed to work with open-ended polylines, using stroke-width and other line options to determine size.
 * saves me having to outline stroke in illustrator.
 */
FlatShapeCollection.prototype.extrudeLine = function (id, height) {

	var shape = shapes.shapes[id];
	var path = new CSG.Path2D(shape.attr.points, false);
	var strokeWidth = shape.attr["stroke-width"];
	var isClosedPath = shape.type!="polyline";
	var isRoundLineCap = shape.attr["stroke-linecap"]=="round";

	return path
	.rectangularExtrude(strokeWidth, height, isRoundLineCap ? t.fn : 2, isClosedPath)
	.setColor( svglib.parseColorString(shape.attr.stroke) )
};

// combine two or more objects into a single solid, with each layer evenly spaced along Z axis (0..height)
FlatShapeCollection.prototype.solidFromLayers = function (params) {
	var self = this;

	if (! params.layers) params.layers = [];
	if (! params.height) params.height = 20;
	if (! params.steps)  params.steps = params.fn ? params.fn : this.fn;

	return new CSG.Polygon.createFromPoints([ [0,0,0], [1,0,0], [1,1,0], [0,1,0] ])
	.solidFromSlices({
		numslices: params.layers.length,
		loop: false,
		callback: function (t, i) {
			// t: 0..1, i: 0..numslices
			var id = params.layers[i];
			var h = params.height * t;

			var points = self.shapes[id].attr.points;
			if (self.shapes[id].type == "path") {
				points = self.getPointsFromPath(self.shapes[id], steps);
			}

			return new CSG.Polygon.createFromPoints(points)
			.translate([ 0, 0, h ])
		}
	});
};

FlatShapeCollection.prototype.extrudeAllPolygons = function (height, axis) {
	var self = this;
	var shapes = [];
	Object.keys(this.shapes).filter(function(id){ return id != "svg" }).forEach(function(id){
		shapes.push(self.createShapeFromSvgData(self.shapes[id], height, axis));
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

/**
 * Given an open-ended U-shaped polyline, convert each set of points into a circle,
 * starting with first/last point, and ending with middle two points.
 * Turns 2D shape into a rotateExtrude-like shape, keeping each slice in the correct position.
 */
FlatShapeCollection.prototype.rotateSlicePath = function (id) {
	var fn = t.fn;
	if (typeof arguments[0] == "object") {
		fn = arguments[0].fn || t.fn;
		id = arguments[0].id;
	}

    var points = this.shapes[id].attr.points.map(function(p){
        return new CSG.Vector3D(p[0], 0, p[1]);
    });

    var centerPointId=Math.floor(points.length/2)-1;

    //console.log(id, JSON.stringify(points.map(function(p){ return t.dumpPoint(p) })));
    //console.log(id+" length", points.length);
    //console.log(id+" center", centerPointId);

    var pointSets = [];

    for (var i=0; i<=centerPointId; i++) {
        //console.log(centerPointId-i, centerPointId+i+1);
        pointSets.push([
            points[centerPointId-i],
            points[centerPointId+i+1]
        ]);
    }

    var circles = [];
    pointSets.forEach(function(ps,i){

        var radius = ps[0].max(ps[1]).minus(ps[0].min(ps[1])).times(0.5);
        var centerPoint = ps[0].min(ps[1]).plus(radius);

        // used for calculating angle of rotation
        var triangle = {
            width: radius.x,
            height: radius.z,
            hypotenuse: Math.sqrt(
                  Math.pow(radius.x,2)
                + Math.pow(radius.z,2)
            ),
        };

        var angleY = 180-Math.atan(triangle.height/triangle.width)/Math.PI*180;

        circles.push({
            center: centerPoint,
            radius: Math.sqrt(
                  Math.pow(radius.x,2)
                + Math.pow(radius.z, 2)
            ),
            angleY: angleY,
        });

    });

    var circlePoints = (function(){

        var cagCircle = new CAG.circle({
            radius: 1,
            resolution: fn,
        });

        var points = cagCircle
            .getOutlinePaths()[0].points
            .map(function(p){
                return [ p.x, p.y, 0 ];
            });

        return points;
    })();

    //console.log(JSON.stringify(circlePoints));
    //console.log("circles.length", circles.length);

	var shape = new CSG.Polygon.createFromPoints(circlePoints)
        .solidFromSlices({
        numslices: circles.length,
        loop: false,
        callback: function(t,i) {
            var c = circles[i];
            //console.log("centerPoint",c.center);
            return this
            .scale([ c.radius, c.radius, 1 ])
            .rotateY(c.angleY)
            .translate(c.center)
        },
    })
//    .rotateZ(90);

	return shape;
};

/**
 * convert path with bezier curves into a set of points ready to become a polygon
 * (does a bit of extra processing since, up until this point, path.d was still a string)
 */
FlatShapeCollection.prototype.getPointsFromPath = function (shape, steps) {
	if (! steps) steps = this.fn;
	var svgObj = $('<svg><path d="'+shape.attr.d+'"/></svg>')[0];
	var svgEl = svgObj.node;
    var parent = svgObj.parent();

	var viewbox = this.svg.attr.viewbox;

	var points = [];
	var end = svgEl.getTotalLength();
	for (var i=0; i<precision; i++) {
		var p = svgEl.getPointAtLength(i/precision * end);

        points.push([
        	parseFloat((  t.point2mm(p.x) - viewbox[2] ).toFixed( 5 )),
            parseFloat(( -t.point2mm(p.y) + viewbox[3] ).toFixed( 5 )),
        ]);
    }

	return points;
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
	    
	    ["viewbox", "points", "x", "y", "cx", "cy", "r", "width", "height", "stroke-width"].forEach(function(name){
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

/**
 * Input: "#FF007F"
 * Output: [ 1, 0, 0.5 ]
 *
 * TODO: determine if other formatted strings are valid for svg: probably rgb/rgba as well
 *
 */
svglib.parseColorString = function (colorString) {
	var color = [ 1, 0, 0 ];
	if (colorString && colorString.match && colorString.match(/^#[A-Fa-f0-9]{3}([A-Fa-f0-9]{3})?/)) {
		color = colorString
			.replace(/^#/, '')
			.split(/(..)/)
			.filter(function(c){ return c.length>0 })
			.map(function(c){ return parseInt(c,16)/255 });
	}
	return color;
}

return svglib;
})();

