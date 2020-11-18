/**
* This file should be included in openjscad index.html
*/

function resetViewer (predefinedViewName="default") {

	if ((! gProcessor) || (! gProcessor.viewer) || (! gProcessor.viewer.onDraw)) {
		throw "gProcessorNotDefined"
	}

	let p = { angle: undefined, position: undefined }

	if (predefinedViewName.position && predefinedViewName.angle) {
		p.angle = predefinedViewName.angle
		p.position = predefinedViewName.position
	}
	else if (predefinedViewName.position) {
		p.position = predefinedViewName.position
	}
	else if (predefinedViewName.angle) {
		p.angle = predefinedViewName.angle
	}
	else if (resetViewer.predefinedViews[predefinedViewName]) {
		p.angle = resetViewer.predefinedViews[predefinedViewName].angle
		p.position = resetViewer.predefinedViews[predefinedViewName].position
	}
	else {
		throw "ResetViewError: invalid predef name"
	}

	if (p.angle !== undefined && p.angle.length < 3) {
		throw "ResetViewAngleError: must specify [x,y,z]"
	}
	if (p.position !== undefined && p.position.length < 3) {
		throw "ResetViewPositionError: must specify [x,y,z]"
	}

	if (p.angle !== undefined) {
		gProcessor.viewer.angleX = p.angle[0]
		gProcessor.viewer.angleY = p.angle[1]
		gProcessor.viewer.angleZ = p.angle[2]
	}

	if (p.position !== undefined) {
		gProcessor.viewer.viewpointX = p.position[0]
		gProcessor.viewer.viewpointY = p.position[1]
		gProcessor.viewer.viewpointZ = p.position[2]
	}

	gProcessor.viewer.onDraw()
}
resetViewer.predefinedViews = {
	"topDown": { position: [ 0, 0, 100 ],   angle: [ 0, 0, 0 ]   },
	"default": { position: [ 0, 5, 250 ], angle: [ -65, 0, 2 ] },
}


