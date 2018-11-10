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

FlatShapeCollection.prototype.parseTextValues = function(){
	var self = this
	var out = {}
	Object.keys(self.shapes).filter(function(id){ return id.match(/^textval[0-9]+$/) }).forEach(function(id){
		var kv = self.shapes[id].value.trim().split(/\s+=\s+/)
		var v = kv[1]
		if (v===undefined) return
		if (v.match(/^[0-9]+(\.[0-9]+)?/)) {
			v = parseFloat(v)
		}
		out[ kv[0] ] = v
	})
	return out
}

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

/**
 * Extrude shape, but with rounded bottom
 * NOTE: This was moved from a specific jscad script for potential reuse, and has not been tested
 * on different shapes. Probably has many bugs to work out still.
 *
 * shapes.extrudeWithRoundedBottom({ id: "someElement", r: 5, h: 20, fn: 8 })
 */
FlatShapeCollection.prototype.extrudeWithRoundedBottom = function (params) {
	var radius = params.r
	var height = params.h
	var numSlices = (params.fn ? params.fn : t.fn/4)+1

	var baseSolidPoints = shapes.shapes[params.id].attr.points
	var points = baseSolidPoints.map(function(p){ return new CSG.Vector2D(p) })

	return new CSG.Polygon.createFromPoints([ [0,0,0], [1,0,0], [1,1,0], [0,1,0] ])
	.solidFromSlices({
		numslices: numSlices,
		loop: false,
		callback: function (v,layer) {
			// v: 0..1, layer: 0..numslices

			var bottomV = v*numSlices/(numSlices-1)

			var z = (v==1 ? height : bottomV)

			var r = radius*(1-Math.sin( Math.acos(1-bottomV) )) // /(v==0?1:Math.acos(1-bottomV))

			var layerPoints = v==1 ? points : points.map(function(p,i){

				var prevP = points[ i==0 ? points.length-1 : i-1 ]
				var nextP = points[ i+1==points.length ? 0 : i+1 ]

				var prevLine = prevP.minus(p).unit()
				var nextLine = nextP.minus(p).unit()

				var prevAngle = prevLine.angleRadians()
				var nextAngle = nextLine.angleRadians()

				var thisAngle = (prevAngle+nextAngle)/2

				// this will probably fail down the road if shape changes,
				// and is just a quick hack for now that I will probably hate
				// myself for in the future if I need to update the design.
				// Sorry future me, but it was either this or continuing to
				// debug instead of just printing the ^#!@ thing already.
				if (i==0 || i+1==points.length) {
					// seems logical in the moment, since this is the only one
					// that would be "looking backward" to find angle,
					// but I'm kinda just basing that on the fact that it works
					// moreso than a solid grasp of why.
					//thisAngle -= Math.PI
					/*
					function deg(rad){return (rad/Math.PI*180).toFixed(1)}
					function vec(v){return "["+[v.x.toFixed(2),v.y.toFixed(2)].join(",")+"]" }
					console.log("i="+i+": prevP="+vec(prevP)+", nextP="+vec(nextP))
					console.log("i="+i+": prevLine="+vec(prevLine)+", nextLine="+vec(nextLine))
					console.log("i="+i+": prevAngle="+deg(prevAngle)+", nextAngle="+deg(nextAngle)+", thisAngle="+deg(thisAngle))
					*/
				}

				var translation = new CSG.Vector2D.fromAngleRadians(thisAngle)

				translation = new CSG.Vector2D([
					Math.abs(translation.x) * p.x<0 ? -1 : 1,
					Math.abs(translation.y) * p.y<0 ? -1 : 1,
				])

				console.log("#"+i+": "
					+ "p=[ "+[p.x.toFixed(1),p.y.toFixed(1)].join(", ")+" ], "
					+ "angle="+(thisAngle/Math.PI*180).toFixed(0)+", "
					+ "translation=[ "+[translation.x.toFixed(1),translation.y.toFixed(1)].join(", ")+" ], "
				)
				/*
				*/

				return new CSG.Vector2D([
					p.x - translation.x * r,
					p.y - translation.y * r,
				])

			})

			return new CSG.Polygon.createFromPoints(layerPoints)
			.translate([ 0, 0, z ])
		}
	})
};

/**
* Use rotated shape for top half, and extruded shape for bottom half.
* Defaults to having the same bounding box as rotated shape would.
* History: this originated when designing parts for 3D scanner laser/sensor mounts
* Example transform function: function(rotatedShape,extrudedShape){ return [rotatedShape,extrudedShape] }
*/
FlatShapeCollection.prototype.rotateHalfExtrusion = function (id,transformFunction) {
	var rotatedSolid = this.rotate(id)
	var b = rotatedSolid.getBounds()
	var s = b[1].minus(b[0])

	var extrudedSolid = this.extrude(id, s.z/2)
	.translate([ 0, 0, b[0].z ])

	var out = [ rotatedSolid, extrudedSolid ]

	if (transformFunction && transformFunction.call) {
		out = transformFunction.apply(transformFunction, out)
	}

	return union(out)
}

FlatShapeCollection.prototype.extrudeAllPolygons = function (height, axis) {
	var self = this;
	var shapes = [];
	Object.keys(this.shapes).filter(function(id){ return id != "svg" }).forEach(function(id){
		shapes.push(self.createShapeFromSvgData(self.shapes[id], height, axis));
	});
	return union(shapes);
};

/**
 * solidFromSlices([layer1..layerN])
 * Creates solid object using shapes as layers
 * layers = [ { id: "", translate: [x,y,z], rotate:[aX,aY,aZ] }, ... ]
 *
 * Example:
 *  solid = shapes.solidFromSlices([ {id:"layer1",translate:[0,0,0]}, {id:"layer2",translate:[0,0,10]}, {id:"layer3",translate:[0,0,12]} ])
 */
FlatShapeCollection.prototype.solidFromSlices = function (layers) {
	var shapes = this.shapes;

	return CSG.fromSlices({
		numslices: layers.length,
		loop: false,
		callback: function (t,slice) {
			// t: 0..1
			// slice: 0 .. layers.length
			var layer = layers[slice];
			var shape = shapes[ layer.id ];

			var csg = new CSG.Polygon.createFromPoints(shape.attr.points)
			if (layer.translate) csg = csg.translate(layer.translate);
			if (layer.rotate)    csg = csg.rotate(layer.rotate);

			return csg;
		}
	});

};

/**
 * getSlicesFromShape(id)
 * Given an open path with an even number of points, return slices as vector pairs
 * (same behavior as seen in rotateSlicePath)
 */
FlatShapeCollection.prototype.getSlicesFromShape = function (id) {

	var points = this.shapes[id].attr.points.map(function(p){
		return new CSG.Vector3D(p[0], 0, p[1]);
	});

	var centerPointId=Math.floor(points.length/2)-1;

	var pointSets = []

	for (var i=0; i<=centerPointId; i++) {
		//console.log(centerPointId-i, centerPointId+i+1);
		pointSets.push([
			points[centerPointId-i],
			points[centerPointId+i+1]
		]);
	}

	return pointSets

};

/**
 * Same as rotateSlicePath, except the axes are aligned the same as extruded shapes.
 * Makes it easier to work with a mixture of both extruded and rotated shapes.
 */
FlatShapeCollection.prototype.rotate = function (id) {
	return this.rotateSlicePath(id).rotateX(-90)
};

/**
 * Given an open-ended U-shaped polyline, convert each set of points into a circle,
 * starting with first/last point, and ending with middle two points.
 * Turns 2D shape into a rotateExtrude-like shape, keeping each slice in the correct position.
 */
FlatShapeCollection.prototype.rotateSlicePath = function (id) {
	var self = this;

	var fn = 0+t.fn;
	var sliceTransform;
	var extrusionShape;
	if (typeof arguments[0] == "object") {
		fn = arguments[0].fn || t.fn;
		sliceTransform = arguments[0].sliceTransform;
		extrusionShape = arguments[0].extrusionShape;

		// must be last, since id===arguments[0]
		id = arguments[0].id;
	}
	else if (arguments.length > 1 && arguments[1].fn) {
		fn = arguments[1].fn;
	}

	function getAngleFromTriangle (w, h) {
		//var angle = (w<=0 && h<=0 ? 0 : 180) -
		var angle = (360 - Math.atan2(h,w)/Math.PI*180)%360;
		console.log("getAngleFromTriangle("+w.toFixed(3)+","+h.toFixed(3)+")", angle);
		return angle;
	}

	var fillColor = this.shapes[id].attr.fill;
	if (! fillColor) fillColor = this.shapes[id].attr.stroke;
	fillColor = svglib.parseColorString(fillColor);

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

		var radius = ps[0].max(ps[1])
		.minus(ps[0].min(ps[1]))
		.times(0.5);
		var centerPoint = ps[0].min(ps[1]).plus(radius);

		// used for calculating angle of rotation
		var triangle = {};
		triangle.width = radius.x * (ps[0].x > ps[1].x ? 1 : -1),
		triangle.height = radius.z * (ps[0].z > ps[1].z ? 1 : -1),
		triangle.hypotenuse = Math.sqrt(
			  Math.pow(radius.x,2)
			+ Math.pow(radius.z,2)
		) * (triangle.width*triangle.height > 0 ? 1 : -1);

		var angleY = getAngleFromTriangle(triangle.width, triangle.height);

		circles.push({
			center: centerPoint,
			radius: Math.sqrt(
				  Math.pow(radius.x,2)
				+ Math.pow(radius.z, 2)
			),
			angleY: angleY,
		});

	});

	console.log("circles", JSON.stringify(circles));

	var circlePoints = (function(){
		var points;

		if (extrusionShape) {
			var csg = new CSG.Polygon.createFromPoints(self.shapes[extrusionShape].attr.points.map(function(p){
				return new CSG.Vector3D(p[0], p[1], 0);
			}));
			var b = csg.boundingBox();
			var size = b[1].minus(b[0]);
			var center = b[0].plus(size.times(0.5));
			var shape = csg
			.translate([ -center.x, -center.y, 0 ])
			.scale([ 2/size.x, 2/size.y, 1 ]);

			points = shape.vertices
			.map(function(v){ return v.pos })
			.filter(function(p,i,a){ return a.indexOf(p)==i })
			.map(function(p){ return [ 
				parseFloat( p.x.toFixed(3) ),
				parseFloat( p.y.toFixed(3) ),
				0
			] });
		}
		else {
			var cagCircle = new CAG.circle({
				radius: 1,
				resolution: fn,
			});

			points = cagCircle
			.getOutlinePaths()[0].points
			.map(function(p){
				return [ p.x, p.y, 0 ];
			});
		}

		console.log(points.map(function(p){ return [ parseFloat((p[0]/0.352778).toFixed(3)), parseFloat((p[1]/0.352778).toFixed(3)) ].join(",") }).join(" "));

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
			return (sliceTransform ? sliceTransform.apply(this.rotateZ(90), [t,i,c]).rotateZ(-90) : this)
			.scale([ c.radius, c.radius, 1 ])
			.rotateY(c.angleY)
			.translate(c.center)
		},
	})
	.setColor(fillColor);

	return shape;
};

/**
 * linear extrusion: create solid by tracing outline with specified shape, optionally fill it.
 * options.solid = true by default, otherwise, it won't fill the result.
 *
 * Example: 
 * NOTE 2018-07-03: I was working on this for one specific app, may have just used it there instead.
 * as written, this is just placeholder code.
 *
 * See almost-working-but-only-barely code in 20180701-locking_ring/mounting ring.jscad
 */
FlatShapeCollection.prototype.followPath = function (pathShapeId, templateShapeId, options) {

	if (arguments.length == 1) {
		options = pathShapeId;
		pathShapeId = options.pathShapeId;
		templateShapeId = options.templateShapeId;
	}
	else if (arguments.length == 2) {
		options = {}
	}
	if (options.roundEnds === undefined) options.roundEnds = true
	if (options.solid     === undefined) options.solid     = true
	if (options.fn        === undefined) options.fn        = this.fn

	var templateShape = this.extrude(templateShapeId, 1)
	var templateBounds = t.getBounds(templateShape)
	var templateW = templateBounds.s.x
	var templateH = templateBounds.s.y

	var path = new CSG.Path2D(this.shapes[pathShapeId].attr.points, true)
	var out = path.rectangularExtrude(templateW, templateH, options.fn, options.roundEnds).setColor(this.getShapeColor(pathShapeId))

	if (options.solid === false) return out

	return union([
		out,
		this.extrude(pathShapeId, templateH)
		.scale([ 1, 1, 0.5 ])
	])
};


FlatShapeCollection.prototype.getPointsFromPathAsync = function (shape, steps, callback) {
    var self = this;

    var uniqueid = Date.now()+""+Math.random();

    var messageHandler; messageHandler = function (e) {
        if (! (e.data.cmd == "svg.getPointsFromPath" && e.data.id == uniqueid)) return;

        var viewbox = shapes.shapes.svg.attr.viewbox;
        var points = JSON.parse(e.data.points).map(function(p){
            return [
                parseFloat((  t.point2mm(p[0]) - viewbox[2] ).toFixed( 5 )),
                parseFloat(( -t.point2mm(p[1]) + viewbox[3] ).toFixed( 5 )),
            ]                
        });

        self.removeEventListener('message', messageHandler);
        callback(points);
    };
    this.addEventListener('message', messageHandler);

    this.postMessage({
        cmd: "svg.getPointsFromPath",
        svg: '<svg><path d="'+shape.attr.d+'"/></svg>',
        steps: steps,
        id: uniqueid
    });

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

/************************************************************************************************/

/**
 * the next couple functions were created to calculate volume of negative space, to figure out
 * how much molding compound to pour. They were originally written for use with rotateSlicePath polylines.
 *
 * Example: 
 *  var segmentLines = makePairsFromPoints(shapes.shapes.outerMoldCutout.attr.points)
 *  var holeVolume = getShapeVolume(segmentLines)
 *
 */

// compute length of line between two points
function length (points) {
    var x0 = points[0][0]
    var x1 = points[1][0]
    var y0 = points[0][1]
    var y1 = points[1][1]
    var w = Math.abs(x0-x1)
    var h = Math.abs(y0-y1)
    if (h==0) return w
    if (w==0) return h
    return Math.sqrt(h*h+w*w)
}

// find center point between two points
function findCenterBetweenPoints (points) {
    var x0 = points[0][0]
    var x1 = points[1][0]
    var y0 = points[0][1]
    var y1 = points[1][1]
    var w = Math.abs(x0-x1)
    var h = Math.abs(y0-y1)

    return [
        Math.max(x0,x1)-w/2,
        Math.max(y0,y1)-h/2,
    ]
}

// calculate points at a given distance along line
// lengthOffset is added to existing length, e.g. diameter
function getPointsAtOffset (points, lengthOffset) {
    var x0 = points[0][0]
    var x1 = points[1][0]
    var y0 = points[0][1]
    var y1 = points[1][1]

    var oldLength = length(points)
    var multiplier = (oldLength+lengthOffset)/oldLength

    var oldW = Math.abs(x0-x1)
    var oldH = Math.abs(y0-y1)

    var newW = oldW * multiplier
    var newH = oldH * multiplier

    var diffW = newW - oldW
    var diffH = newH - oldH

    if (x0 < x1) {
        x0 -= diffW/2
        x1 += diffW/2
    }
    else {
        x0 += diffW/2
        x1 -= diffW/2
    }

    if (y0 < y1) {
        y0 -= diffH/2
        y1 += diffH/2
    }
    else {
        y0 += diffH/2
        y1 -= diffH/2
    }
    
    return [
        [ x0, y0 ],
        [ x1, y1 ],
    ]

}

function makePairsFromPoints (points) {
	var pairs = [];
	for (var n=0; n<points.length/2; n++) {
		pairs.push([
			points[n],
			points[points.length-1-n],
		])
	}
	return pairs
}
// [ [p1,p2], [p1,p2] ] => area of rhombus made by these four points 
function getSegmentVolume (pointset) {
	console.log("getSegmentVolume(pointset) called, pointset="+JSON.stringify(pointset))
	var r1 = length(pointset[0])/2
	var r2 = length(pointset[1])/2
	var r = (r1+r2)/2
	var cA = findCenterBetweenPoints(pointset[0])
	var cB = findCenterBetweenPoints(pointset[1])
	var h = length([ cA, cB ])
	var v = Math.PI * Math.pow(r,2)*h
	console.log("getSegmentVolume: cA=["+cA.map(function(n){ return n.toFixed(3) }).join(",")+"], cB=["+cB.map(function(n){ return n.toFixed(3) }).join(",")+"], r="+r.toFixed(3)+" h="+h.toFixed(3)+", v="+v.toFixed(3))
	return v
}
// this only makes sense for shapes that are rendered via rotateSlicePath
// (e.g. how would i calculate .extrude volume without knowing how much it was extruded)
// long-term solution would be to hook this directly in to CSG, and calculate volume using the actual object.
FlatShapeCollection.prototype.getShapeVolume = function (id) {
	var linepairs = makePairsFromPoints(this.shapes[id].attr.points)
	var volume=0
	console.log("linepairs.length = " + linepairs.length)
	for (var n=0; n<linepairs.length-1; n++) {
		console.log("n="+n)
		console.log("getSegmentVolume("+JSON.stringify([ linepairs[n], linepairs[n+1] ])+")")
		let v = getSegmentVolume([ linepairs[n], linepairs[n+1] ])
		console.log("volume += " + parseFloat(v.toFixed(3)))
		volume += v
	}
	return volume;
}

// use this to get area of non-extruded 2D polygon, then multiply by height if needed for volume.
FlatShapeCollection.prototype.getShapeArea = function (id) {
	var el = this.shapes[id]
	var area = 0
	switch (el.type) {
		case "circle":
			area = Math.PI * Math.pow(el.attr.r,2)
		break;
		case "rect":
			area = el.attr.width * el.attr.height
		break;
		case "polyline":
		case "polygon":
			var points = el.attr.points
			var j = points.length-1

			for (var i=0; i<points.length; i++) {
				area += ( points[j][0] + points[i][0] ) * ( points[j][1] - points[i][1] )
				j=i
			}
			area /= 2;
		break;
	}
	return parseFloat(Math.abs(area).toFixed(3))
}

// return RGB color that is ready to be passed to CSG setColor function
FlatShapeCollection.prototype.getShapeColor = function (id) {
	var attr = this.shapes[id].attr
	return svglib.parseColorString(attr.fill ? attr.fill : attr.stroke)
}
/************************************************************************************************/


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

/**
 * Given two 2D vectors, return angle between v1 and v2
 * todo: add support for 3D vectors, returning [ xAngle, zAngle ]
 */
svglib.findAngleBetweenVectors = function (v1, v2) {
	// v1 = "from", v2 = "to"
	v1 = new CSG.Vector2D(v1)
	v2 = new CSG.Vector2D(v2)

	var s = v2.minus(v1)

	var a = Math.atan2( s.y, s.x ) / Math.PI*180

	//if (s.x < 0) a += 180
	//if (s.y < 0) a += 180

	return (90+a)%360
}

return svglib;
})();

