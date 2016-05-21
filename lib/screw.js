function screw (screwName) {
	return screw.getByName(screwName);
};

screw.fn = 32;

screw.definitions = {
	"Wood4": {
		d1: 6,
		h1: 2.2,
		d2: 2.7,
		h: 50,
	},
	"Machine6": {
		d1: 7.5,
		h1: 3,
		d2: 3.85,
		h: 100,
	}
};

screw.getByName = function (definedName) {
	var d = this.definitions[definedName];

	return union([
		cylinder({ d: d.d1, h: d.h+d.h1, fn:this.fn }).translate([ 0, 0, -(d.h+d.h1) ]),
		cylinder({ d1: d.d1, d2: d.d2, h: d.h1, fn:this.fn }),
		cylinder({ d: d.d2, h: d.h, fn:this.fn }),
	]);
};


