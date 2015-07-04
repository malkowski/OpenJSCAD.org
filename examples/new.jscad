/**
 * Title: 
 */

include("../lib/common.jscad");

function main() {

    return union([
        t.ccube([ 20, 20, 20 ]).setColor(1, 0, 0),
    ])

}
