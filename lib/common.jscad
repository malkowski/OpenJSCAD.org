function t () {};

t.fn=32;

// centered cube
t.ccube = function (size) {
    return cube(size).translate([-size[0]/2,-size[1]/2,0])
}

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
}

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


