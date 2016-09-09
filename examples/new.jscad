/**
 * Title: 
 */

include("lib/common.jscad");
include("lib/screw.js");
include("lib/svglib.js");

function importedShapes () {
	return 
}
var shapes = importedShapes() ? svglib.import(importedShapes()) : false;

function main() {

    return union([

        t.ccube([ 20, 20, 20 ]),

    ])

}
