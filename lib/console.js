(function(){

	function __mergedStyle () {
		var out = {}
		for (var i=0; i< arguments.length; i++) {
			let arg = arguments[i]
			Object.keys(arg).forEach(function(k){
				let prop = arg[k]
				if (typeof prop == "function") {
					out[k] = prop.call(out)
				}
				else {
					out[k] = prop
				}
			})
		}
		return Object.keys(out).map(function(k){
			return "" + k + ": " + out[k]
		})
		.join("; ")
	}

	function _labelStyle (overrides={}) {
		return __mergedStyle({
			"background-color": "#6666ff",
			"color": "#ffffff",
			"font-weight": "bold",
			"padding": "0.1em 0.4em",
			"box-sizing": "border-box",
			"margin-top": "-0.1em",
			"display": "inline-block",
			"border-radius": "5px",
			"margin-right": "0.5em",
		}, overrides)
	}

	function _textStyle (overrides={}) {
		return __mergedStyle({"color": "#000000"},overrides)
	}

	function _isThisAWorker () {
		return ! (self && self.window && self.window===self)
	}

	function _getWindowOrWorkerText () {
		if (_isThisAWorker()) {
			return "worker"
		}
		else {
			return "window"
		}
	}

	// depending on where message came from, we'll add a specific label to easily identify at a glance
	var _threadTypeLabelStyle = {
		"window": {
			"background-color": "#4466ff",
			"color": "#ffffff",
		},
		"worker": {
			"background-color": "#ff8800",
			"color": "#000000",
		},
		"unknown": {
			"background-color": "#ff00ff",
			"color": "#000000",
		},
	}

	let _log = console.log
	console.log = function () {
		if (arguments.length != 1) {
			return _log.apply(this, arguments)
		}
		var msgText = arguments[0]
		var threadType = _getWindowOrWorkerText()
		return _log.call(
			console,
			"%c" + threadType + "%clog%c" + msgText,
			_labelStyle(_threadTypeLabelStyle[threadType] === undefined ? _threadTypeLabelStyle.unknown : _threadTypeLabelStyle[threadType]),
			_labelStyle({
				"background-color": "#008800",
				"color": "#ffffff",
				"margin-bottom": function(){ if (msgText && msgText.match && msgText.match(/\n/)) { return "0.1em" } },
			}),
			_textStyle()
		)
			
	}

	let _debug = console.debug
	console.debug = function () {
		if (arguments.length != 1) {
			return _debug.apply(this, arguments)
		}
		var msgText = arguments[0]
		var threadType = _getWindowOrWorkerText()
		return _debug.call(
			console,
			"%c" + threadType + "%cdebug%c" + msgText,
			_labelStyle(_threadTypeLabelStyle[threadType] === undefined ? _threadTypeLabelStyle.unknown : _threadTypeLabelStyle[threadType]),
			_labelStyle({
				"background-color": "#6666ff",
				"color": "#ffffff",
				"margin-bottom": function(){ if (msgText && msgText.match && msgText.match(/\n/)) { return "0.1em" } },
			}),
			_textStyle({
				"color": "#0000ff"
			})
		)
	}

})()
