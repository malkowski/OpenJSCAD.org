function t () {};

t.fn=32;

// convert PostScript points to mm
t.ps2mm = function (pointValue) {
    return pointValue * 2.83464567;
};

// extrude path
t.extrude = function (points, height) {
    return linear_extrude({ height: height }, polygon(points));
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

/*
    return CSG.roundedCube({
        center: [ 0, 0, size[2]/2 ],
        radius: [ size[0]/2, size[1]/2, size[2]/2+r ],
        roundradius: r,
        resolution: fn,
    }).subtract([
        CSG.cube({ center: [0,0,size[2]+r ], radius: [ size[0], size[1], r ] }),
        CSG.cube({ center: [0,0,-r], radius: [ size[0], size[1], r ] })
    ]);
*/

//    return t.sccube({ r: r, fn: fn, size: size, z: [0,0] });

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

