function t () {};

t.fn=32;

// convert PostScript points to mm
t.point2mm = function (pointValue) {
	return pointValue * 0.352778;
};

// extrude path
t.extrude = function (points, height) {
	return linear_extrude({ height: height }, polygon(points));
};

// cylinder that inherits currently set fn value
t.cylinder = function (params) {
	params.fn = this.fn;
	return cylinder(params);
};

// centered cube
t.ccube = function (size) {
	return cube(size).translate([-size[0]/2,-size[1]/2,0])
};

// centered cube with rounded edges along one axis
t.rccube = function (size,r,fn) {

	if (size.length === undefined) {
		r = size.r;
		fn = size.fn;
		size = size.size;
	}

	if (! fn) fn = t.fn;

	if (r > Math.min(size[0], size[1])/2) {
		r = Math.min(size[0], size[1])/2;
	}

	var shapes = [];
	if (size[0] > r*2) shapes.push(t.ccube([ size[0]-r*2, size[1], size[2] ]));
	if (size[1] > r*2) shapes.push(t.ccube([ size[0], size[1]-r*2, size[2] ]));


	shapes.push(
		cylinder({ r:r, h:size[2], fn: fn }).translate([   size[0]/2-r,    size[1]/2-r,  0 ]),
		cylinder({ r:r, h:size[2], fn: fn }).translate([ -(size[0]/2-r),   size[1]/2-r,  0 ]),
		cylinder({ r:r, h:size[2], fn: fn }).translate([   size[0]/2-r,  -(size[1]/2-r), 0 ]),
		cylinder({ r:r, h:size[2], fn: fn }).translate([ -(size[0]/2-r), -(size[1]/2-r), 0 ])
	);

	return union(shapes);
};

// centered cube with spherical corners
t.sccube = function (params) {

	var r    = params.r;
	var fn   = params.fn;
	var size = params.size;
	var z    = params.z;
	if (! z) z = [ 1, 1 ];

	if (! fn) fn = t.fn;

	if (r > Math.min(size[0], size[1])/2) {
		r = Math.min(size[0], size[1])/2;
	}

	var shapes = [];
	if (Math.max(size[0], size[2]) > r*2)
		shapes.push(t.ccube([ size[0]-r*2, size[1], size[2]-r*(z[0]+z[1]) ]).translate([ 0, 0, r*z[0] ]) );

	if (Math.max(size[1], size[2]) > r*2) 
		shapes.push(t.ccube([ size[0], size[1]-r*2, size[2]-r*(z[0]+z[1]) ]).translate([ 0, 0, r*z[0] ]) );

	shapes.push(t.ccube([ size[0]-r*2, size[1]-r*2, size[2] ]));

	shapes.push(
		cylinder({ r:r, h:size[2]-r*(z[0]+z[1]), fn: fn }).translate([   size[0]/2-r,    size[1]/2-r,  r*z[0] ]),
		cylinder({ r:r, h:size[2]-r*(z[0]+z[1]), fn: fn }).translate([ -(size[0]/2-r),   size[1]/2-r,  r*z[0] ]),
		cylinder({ r:r, h:size[2]-r*(z[0]+z[1]), fn: fn }).translate([   size[0]/2-r,  -(size[1]/2-r), r*z[0] ]),
		cylinder({ r:r, h:size[2]-r*(z[0]+z[1]), fn: fn }).translate([ -(size[0]/2-r), -(size[1]/2-r), r*z[0] ])
	);

	if (z[0]) {
		shapes.push(
			cylinder({ r:r, h:size[1]-r*2, fn: fn }).rotateX(90).translate([ -(size[0]/2-r),   size[1]/2-r,  r         ]),
			cylinder({ r:r, h:size[1]-r*2, fn: fn }).rotateX(90).translate([   size[0]/2-r,    size[1]/2-r,  r         ]),
			cylinder({ r:r, h:size[0]-r*2, fn: fn }).rotateY(90).translate([ -(size[0]/2-r),   size[1]/2-r,  r         ]),
			cylinder({ r:r, h:size[0]-r*2, fn: fn }).rotateY(90).translate([ -(size[0]/2-r), -(size[1]/2-r), r         ]),
			sphere({ r:r, fn:fn }).translate([   size[0]/2-r,    size[1]/2-r,  r ]), 
			sphere({ r:r, fn:fn }).translate([ -(size[0]/2-r),   size[1]/2-r,  r ]), 
			sphere({ r:r, fn:fn }).translate([   size[0]/2-r,  -(size[1]/2-r), r ]), 
			sphere({ r:r, fn:fn }).translate([ -(size[0]/2-r), -(size[1]/2-r), r ]) 
		);
	}

	if (z[1]) {
		shapes.push(
			cylinder({ r:r, h:size[0]-r*2, fn: fn }).rotateY(90).translate([ -(size[0]/2-r),   size[1]/2-r,  size[2]-r ]),
			cylinder({ r:r, h:size[0]-r*2, fn: fn }).rotateY(90).translate([ -(size[0]/2-r), -(size[1]/2-r), size[2]-r ]),
			cylinder({ r:r, h:size[1]-r*2, fn: fn }).rotateX(90).translate([ -(size[0]/2-r),   size[1]/2-r,  size[2]-r ]),
			cylinder({ r:r, h:size[1]-r*2, fn: fn }).rotateX(90).translate([   size[0]/2-r,    size[1]/2-r,  size[2]-r ]),
			sphere({ r:r, fn:fn }).translate([   size[0]/2-r,    size[1]/2-r,  size[2]-r ]), 
			sphere({ r:r, fn:fn }).translate([ -(size[0]/2-r),   size[1]/2-r,  size[2]-r ]), 
			sphere({ r:r, fn:fn }).translate([   size[0]/2-r,  -(size[1]/2-r), size[2]-r ]), 
			sphere({ r:r, fn:fn }).translate([ -(size[0]/2-r), -(size[1]/2-r), size[2]-r ]) 
		);
	}

	return union(shapes);
};

// axes = vector e.g. [0,1,0]. partial values are rounded up to 1.
t.mirror = function (shape, axes) {

	var shapes = [ shape ];
	if (axes[0]) {
		shapes.push(shape.mirroredX());
	}
	if (axes[1]) {
		var len = shapes.length;
		for (var i=0; i < len; i++) {
			shapes.push(shapes[i].mirroredY());
		}
	}
	if (axes[2]) {
		var len = shapes.length;
		for (var i=0; i < len; i++) {
			shapes.push(shapes[i].mirroredZ());
		}
	}

	return union(shapes);
};

/**
 * Rounded polycube: in essence, two rounded rectangles at different Z planes centered along x/y.
 * Different width/depth/r of each layer is possible.
 *
 * Example:
 * t.roundedpolycube(
 *    { w: 70.15, d: 55, z: 0,  r: 2 },
 *    { w: 68.15, d: 53, z: 10, r: 1 }
 * )
 *     
 * })
 *
 */
t.roundedpolycube = function (l1, l2) {

	var w = Math.min(l1.w, l2.w),
		d = Math.min(l1.d, l2.d),
		h = Math.max(l1.z, l2.z)-Math.min(l1.z,l2.z),
		z = Math.min(l1.z, l2.z),
		r = Math.min(l1.r, l2.r);

	var corner = cylinder({
		r1: l1.r,
		r2: l2.r, 
		h: h,
	});

	return union([
		corner.translate([ -w/2, -d/2, 0 ]).translate([  r,  r, z ]),
		corner.translate([  w/2, -d/2, 0 ]).translate([ -r,  r, z ]),
		corner.translate([ -w/2,  d/2, 0 ]).translate([  r, -r, z ]),
		corner.translate([  w/2,  d/2, 0 ]).translate([ -r, -r, z ]),
		
		t.polycube([ l1.w-l1.r*2, l1.d, l1.z ], [ l2.w-l2.r*2, l2.d, l2.z ]),
		t.polycube([ l1.w, l1.d-l1.r*2, l1.z ], [ l2.w, l2.d-l2.r*2, l2.z ]),
		
	]);
};



/**
 *  This could use some cleanup, it's lifted straight out of the source file I wrote it for.
 *
 *  arguments = { 
 *      size: [ x width, y height, z depth ], 
 *      corner: { d1/d2/r/etc, h: 1 } // will scale to Z depth specified above.
 *  }
 */
t.reflectCylinderAtCornersQuad = function (arguments) {
	if (arguments.r && ! arguments.d)  arguments.d  = arguments.r*2;
	if (arguments.d && ! arguments.d1) arguments.d1 = arguments.r1 ? arguments.r1*2 : arguments.d;
	if (arguments.d && ! arguments.d2) arguments.d2 = arguments.r2 ? arguments.r2*2 : arguments.d;

	var maxR = Math.max(arguments.corner.d1, arguments.corner.d2)/2;
	var diffR = arguments.corner.d2 - arguments.corner.d1;
	var rBottom = diffR > 0 ? diffR/2 : 0;
	var rTop = diffR < 0 ? -diffR/2 : 0;
	
	var x = arguments.size[0]/2,
		y = arguments.size[1]/2,
		z = arguments.size[2]/2;

	var center = linear_extrude({ height: arguments.size[1] }, polygon({ points: [
		[  x-rTop, z ],
		[  x-rBottom, -z ],
		[ -(x-rBottom), -z ],
		[ -(x-rTop), z ],
	] }))
	.translate([ 0, 0, -y ])
	.rotateX(90)
	.translate([0,0,z])
	.intersect(linear_extrude({ height: arguments.size[0] }, polygon({ points: [
			[  z,  y-rTop    ],
			[  z, -y+rTop    ],
			[ -z, -y+rBottom ],
			[ -z,  y-rBottom ],
		]}))
		.translate([ 0, 0, -x ])
		.rotateY(-90)
		.translate([0,0,z])
	)

	var cornerShape = difference(
		// todo: how can i use calculated values from the shape object itself?
		cube(arguments.size),
		cylinder(arguments.corner).scale([1,1,arguments.size[2]])
	).translate([
		arguments.size[0]/2 - maxR,
		arguments.size[1]/2 - maxR,
		0
	]);

	return difference([
		center,
		cornerShape,
		cornerShape.mirroredX(),
		cornerShape.mirroredY(),
		cornerShape.mirroredX().mirroredY(),
	]);
};

/**
 * Triangular Prism: specify width/depth/height, done.
 * yeah yeah it's not a "triangle", whatever, this is quicker/easier to type repeatedly.
 */
t.triangle = function (dimensions) {

var w = dimensions[0],
	d = dimensions[1],
	h = dimensions[2];

var points = [
	[    0, -d/2, 0 ], // bottom rear
	[  w/2,  d/2, 0 ], // bottom front right
	[ -w/2,  d/2, 0 ], // bottom front left
	[    0, -d/2, h ], // top rear
	[  w/2,  d/2, h ], // top front right
	[ -w/2,  d/2, h ], // top front left
];
var polygons = [
	[0,1,2],   // bottom
	[0,2,5,3], // left
	[2,1,4,5], // front
	[0,3,4,1], // right
	[3,5,4],   // top
];

return polyhedron({ points: points, polygons: polygons });

};

// example: draw a shape that's 20x20 at z=0 and 10x15 at z=5: p1=[20,20,0],p2=[10,15,5]
t.polycube = function (p1, p2) {

return polyhedron({
	points: [ 
		[ -p1[0]/2, -p1[1]/2, p1[2] ], // 0: bottom rear left
		[  p1[0]/2, -p1[1]/2, p1[2] ], // 1: bottom rear right
		[  p1[0]/2,  p1[1]/2, p1[2] ], // 2: bottom front right
		[ -p1[0]/2,  p1[1]/2, p1[2] ], // 3: bottom front left
		[ -p2[0]/2, -p2[1]/2, p2[2] ], // 4: top rear left
		[  p2[0]/2, -p2[1]/2, p2[2] ], // 5: top rear right
		[  p2[0]/2,  p2[1]/2, p2[2] ], // 6: top front right
		[ -p2[0]/2,  p2[1]/2, p2[2] ], // 7: top front left
	],
	polygons: [
		[0,1,2,3], // bottom
		[3,2,6,7], // front
		[0,3,7,4], // left
		[4,5,1,0], // rear
		[5,6,2,1], // right
		[7,6,5,4], // top
	]
});

};

// centered cube with rounded edges along one axis
t.polyrc = function (size1,r1,size2,r2,fn) {

	if (size.length === undefined) {
		r = size.r;
		fn = size.fn;
		size = size.size;
	}

	if (! fn) fn = t.fn;

	if (r > Math.min(size[0], size[1])/2) {
		r = Math.min(size[0], size[1])/2;
	}

	var shapes = [];
	if (size[0] > Math.max(r1,r2)*2) 
		shapes.push(t.polycube([ size1[0]-r1*2, size1[1], size1[2] ], [ size2[0]-r2*2, size2[1], size2[2] ]));

	if (size[1] > Math.max(r1,r2)*2)
		shapes.push(t.polycube([ size1[0], size1[1]-r1*2, size1[2] ], [ size2[0], size2[1]-r2*2, size2[2] ]));

	// TODO: work in progress. for the cylinders below, consider setting size to [1,1,1] and scaling, to allow different x/y radius. otherwise this won't work right, since for example the top could be wider than the bottom, meaning the top and bottom cylinders would be offset from each other. probably makes more sense to do proper polygon slices on each Z plane and combine the two into a 3D shape by connecting each side, similar to how cylinder code works in tinkercad's example libraries.
	shapes.push(

		cylinder({ r1:r1, r2:r2, h:Math.max(size1[2],size2[2])-Math.min(size1[2],size2[2]), fn: fn })
		.translate([   size[0]/2-Math.max(r1,r2),    size[1]/2-Math.max(r1,r2),  0 ]),

		cylinder({ r1:r1, r2:r2, h:size[2], fn: fn })
		.translate([ -(size[0]/2-Math.max(r1,r2)),   size[1]/2-Math.max(r1,r2),  0 ]),

		cylinder({ r1:r1, r2:r2, h:size[2], fn: fn })
		.translate([   size[0]/2-Math.max(r1,r2),  -(size[1]/2-Math.max(r1,r2)), 0 ]),

		cylinder({ r1:r1, r2:r2, h:size[2], fn: fn })
		.translate([ -(size[0]/2-Math.max(r1,r2)), -(size[1]/2-Math.max(r1,r2)), 0 ])

	);

	return union(shapes);
};

// given an array of two or more objects, each defining a slice along the shape's Z axis,
// follow through each layer and pass p0/p1 as arguments to the specified handler callback.
t._layerStacker = function (layers, handler) {
	var output = [];
	for (var n=0; n < layers.length-1; n++) {
		var p0 = layers[n],
			p1 = layers[n+1];

		output.push(handler(p0,p1));
	}

	return union(output);
};

// given an array of points [ width, depth, Z plane ],
// return unioned array of polycube objects
// e.g. polycube but with any number of planes instead of only two
t.polystack = function (layers) {
	return t._layerStacker(layers, t.polycube);
};

// for examples, see polystack and roundedpolycube
t.roundedpolystack = function (layers) {
	return t._layerStacker(layers, t.roundedpolycube);
};

// same as polystack but with cylinders
t.cylstack = function (layers) {
	// for now, depth is ignored, width = diameter
	// eventually, each circle representing a slice
	// will be able to define both width and depth

	return t._layerStacker(layers, function(p0,p1){
		return cylinder({ 
			d1: p0[0], 
			d2: p1[0], 
			h: Math.abs(p1[2]-p0[2]),
			fn: t.fn
		})
		.translate([ 0, 0, p0[2] ])
	});    
};

/**
	{ "id": "twists", "displayName": "# Twists", "type": "float", "rangeMin": 0.25, "rangeMax": 100, "default": 1 },
	{ "id": "direction", "displayName": "Direction", "type": "list", "listLabels": [ "Clockwise", "Counter-clockwise" ], "listValues": [ 1, -1 ], "default": 1 },
	{ "id": "height", "displayName": "Twist Height", "type": "length", "rangeMin": 1, "rangeMax": 20, "default": 10 },
	{ "id": "sideangle", "displayName": "Wall Angle", "type": "angle", "rangeMin": -45, "rangeMax": 89, "default": 0 },
	{ "id": "thickness", "displayName": "Thickness", "type": "length", "rangeMin": 0.1, "rangeMax": 5, "default": 1 },
	{ "id": "outerdiam", "displayName": "Outside Diameter", "type": "length", "rangeMin": 10, "rangeMax": 20, "default": 20 },
	{ "id": "innerdiam", "displayName": "Inside Diameter", "type": "length", "rangeMin": 1, "rangeMax": 10, "default": 1 }
 */
t.screwthread = function (params) {
	var defaultParams = {
		innerD:     1,
		outerD:    20,
		thickness:  1,
		sideAngle:  0,
		height:    10,
		direction: -1, // 1 or -1
		twists:     1,
		fn:      t.fn,
	};

	Object.keys(defaultParams).forEach(function(p){
		if (params[p] === undefined) params[p] = defaultParams[p];
	});

	var innerDiameter = params.innerD;
	var outerDiameter = params.outerD;
	var radius = (outerDiameter / 2.0);
	var circumference = 2 * Math.PI * radius;
	var thickness = params.thickness;
	var twistCount = params.twists;
	var twistHeight = params.height;
	var pitchAngle = Math.atan(twistHeight / circumference / 2);
	var divisions = params.fn;
	var direction = params.direction;

	var sideAngle = params.sideAngle;
	if (sideAngle < -45) sideAngle = -45;
	if (sideAngle > 89) sideAngle = 89;

	var zprime = (thickness / 2.0) * Math.cos(pitchAngle);
	var yprime = (thickness / 2.0) * Math.sin(pitchAngle);

	var threadDepth = radius - (innerDiameter/2);

	// Calculate difference in height between inner and outer wall, to set angle of screw thread
	var angleOffsetHeight = Math.tan(sideAngle/180 * Math.PI) * threadDepth / 2;
	if (sideAngle === 0) angleOffsetHeight = 0;

	var a = [radius, yprime, zprime];
	var b = [innerDiameter / 2.0, -yprime, zprime + angleOffsetHeight];
	var c = [innerDiameter / 2.0, yprime, -zprime - angleOffsetHeight];
	var d = [radius, -yprime, -zprime];
	
	var e = a, f = b, g = c, h = d;
	var i, j, k, l;

	var mesh = new Mesh3D();



	/*
	Cap off the end at the bottom starting point (points assume you're viewing the end flat-on)
	a = top left
	b = top right
	c = bottom right
	d = bottom left
	*/
	mesh.quad(a, b, c, d);

	var increments = divisions * twistCount;
	var angleDelta = (twistCount * Math.PI * 2) / increments * direction;
	var heightDelta = twistCount * twistHeight / increments;

	for (var iDiv = 0; iDiv < increments; iDiv++) {
		
		i = e.slice(0);
		j = f.slice(0);
		k = g.slice(0);
		l = h.slice(0);
		
		var pts = [i, j, k, l];
		for (var iPt = 0; iPt < pts.length; iPt++) {
			var pt = pts[iPt];
			var angle = Math.atan2(pt[0], pt[1]);
			angle += angleDelta;
			var ptRadius = Math.sqrt(pt[0] * pt[0] + pt[1] * pt[1]);
			pt[0] = ptRadius * Math.sin(angle);
			pt[1] = ptRadius * Math.cos(angle);
			pt[2] = pt[2] + heightDelta;
		}

		/*
		e = front top right point
		f = rear  top right point
		i = front top left point
		j = rear  top left point
		*/
		mesh.quad(e, f, j, i);
		mesh.quad(f, g, k, j);
		mesh.quad(g, h, l, k);
		mesh.quad(h, e, i, l);

		e = i;
		f = j;
		g = k;
		h = l;
	}

	/*
	Cap off the top end (points assume you're viewing the end flat-on)
	e = top right
	f = top left
	g = bottom left
	h = bottom right
	*/
	mesh.quad(e, f, g, h);

	return mesh.polyhedron();
};

/**
 * Mesh3D: Minimal implementation of Tinkercad's Shape Script interface (more or less), to quickly port my custom shape scripts over.
 * 
 * I'm kinda just implementing things as I need them. 
 * I'm sure I will miss plenty of advanced stuff that I never bothered doing
 * (or that OpenJSCAD already does better, e.g. setting colors for debugging).
 *
 * I would not rely on this for new stuff. The interface is too clunky.
 */
function Mesh3D () {
	this.points = [];
	this.polygons = [];
}

Mesh3D.prototype = {};

Mesh3D.prototype.quad = function (a,b,c,d) {
	var self = this;
	var polygon = [];
	[a,b,c,d].forEach(function(p){
		var index = self.points.indexOf(p);
		if (index == -1) {
			self.points.push(p);
			index = self.points.indexOf(p);
		}
		polygon.push(index);
	});
	self.polygons.push(polygon);
};

Mesh3D.prototype.polyhedron = function () {
	return polyhedron({
		points: this.points,
		polygons: this.polygons,
	});
};
