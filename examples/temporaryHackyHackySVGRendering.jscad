/**
 * Title: 
 */

include("lib/common.jscad");
include("lib/svglib.js");

function render (csg) {
    this.postMessage({
        cmd: "rendered",
        result: csg.toCompactBinary()
    });
}

var importedShapes = [{"type":"svg","attr":{"xmlns":"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink","height":"433.701px","id":"Layer_1","version":"1.0","xml:space":"preserve","y":"0px","enable-background":"new 0 0 807.875 433.701","x":"0px","viewbox":[0,0,807.875,433.701],"width":"807.875px"}},{"type":"line","attr":{"y1":"0","stroke-width":"0.8","x1":"403.937","stroke-miterlimit":"10","stroke":"#6D6E71","x2":"403.937","y2":"433.701","fill":"none"}},{"type":"line","attr":{"stroke-width":"0.8","y1":"216.851","stroke-miterlimit":"10","x1":"0","stroke":"#6D6E71","x2":"807.875","y2":"216.851","fill":"none"}},{"type":"path","attr":{"d":"M408.387,150.235l-8.003-0.001c-125.744,0-138.424,59.602-138.424,79.484v2.447 c0,22.717,11.43,51.301,49.558,51.301h181.223c30.399,0,53.173-13.813,53.173-47.539v-12.012 C545.914,174.986,476.14,150.235,408.387,150.235z","id":"bottom_solid","fill":"#231F20"}},{"attr":{"id":"bottom_hole","fill":"#00AEEF","d":"M309.518,277.32h189.223c19.63,0,41-11.834,41-33.667v-20.737 c0-33.43-58.351-51.334-109.479-51.334l-10.201-0.092c-120.921,0-151.027,27.496-151.027,58.129v9.83 C269.034,258.236,284.333,277.32,309.518,277.32z"},"type":"path"},{"attr":{"d":"M400.384,150.234c-99.244,0-138.184,44.002-138.184,71.002l0.003,2.547 c-0.243,22.203,14.282,46.668,49.314,46.668h181.223c30.242,0,52.928-13.679,53.162-47.025v-9.189 c0-39.25-80.513-64.001-137.516-64.001L400.384,150.234z","fill":"#231F20","id":"top_solid"},"type":"path"},{"type":"path","attr":{"d":"M311.518,264.293h187.223c19.63,0,41-11.974,41-30.908v-19.424 c0-29.475-67.601-43.604-99.479-43.604l-4.201-0.082c-122.421,0-167.027,23.879-167.027,49.642v9.732 C269.034,243.819,282.307,264.293,311.518,264.293z","fill":"#00AEEF","id":"top_hole"}}]

var shapes = svglib.import(importedShapes);


function main() {
    var fn = 150;

    getPointsFromPath(shapes.shapes["bottom_hole"], fn, function(bottom_hole){
        getPointsFromPath(shapes.shapes["top_hole"], fn, function(top_hole){
            getPointsFromPath(shapes.shapes["top_solid"], fn, function(top_solid){
                getPointsFromPath(shapes.shapes["bottom_solid"], fn, function(bottom_solid){

                    bottomHoleReversed = [];
                    bottom_hole.forEach(function(p){
                        bottomHoleReversed.unshift(p);
                    });
                    bottom_hole = bottomHoleReversed;
                    topHoleReversed = [];
                    top_hole.forEach(function(p){
                        topHoleReversed.unshift(p);
                    });
                    top_hole = topHoleReversed;

                    render(
                        solidFromLayers([bottom_solid,top_solid], 20)
                        .subtract([
                            solidFromLayers([bottom_hole,top_hole], 20)
                        ])
                    );
                });
            });

        });
    });

    return new CSG;
}


function getPointsFromPath (shape, steps, callback) {
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

}

function solidFromLayers (layers, height) {
    return CSG.fromSlices({
        numslices: layers.length,
        loop: false,
        callback: function (t, i) {
            // t: 0..1, i: 0..numslices
            var points = layers[i];
            var h = height * t;

            return new CSG.Polygon.createFromPoints(points)
            .translate([ 0, 0, h ])
        }
    });
    
}


