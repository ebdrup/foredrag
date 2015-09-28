// create an new instance of a pixi stage
var stage = new PIXI.Stage(0x000000);

// create a renderer instance
var $button = $('#emailButton');
var border = 60;
var width = $button.outerWidth() + 2 * border;
var height = $button.outerHeight() + 2 * border;
var renderer = PIXI.autoDetectRenderer(width, height, {transparent: true});

// add the renderer view element to the DOM
$('#emailButtonContainer').append(renderer.view);
renderer.view.style.position = "absolute";
renderer.view.style.marginLeft = -(width - border) + 'px';
renderer.view.style.marginBottom = -(height - border) + 'px';
renderer.view.style.marginRight = -border + 'px';
renderer.view.style.marginTop = -border + 'px';
renderer.view.style.zIndex = 5;
var particleTexture = PIXI.Texture.fromImage('img/particle.png');
var newCircleEmitterConf = {
	"alpha": {
		"start": 0.62,
		"end": 0
	},
	"scale": {
		"start": 0.25,
		"end": 0.75,
		"minimumScaleMultiplier": 1
	},
	"color": {
		"start": "#5cb85c",
		"end": "#ffffff"
	},
	"speed": {
		"start": 90,
		"end": 90
	},
	"acceleration": {
		"x": 0,
		"y": 0
	},
	"startRotation": {
		"min": 19,
		"max": 1
	},
	"rotationSpeed": {
		"min": 50,
		"max": 50
	},
	"lifetime": {
		"min": 0.05,
		"max": 0.3
	},
	"blendMode": "normal",
	"frequency": 0.001,
	"emitterLifetime": -1,
	"maxParticles": 1000,
	"pos": {
		"x": 0,
		"y": 0
	},
	"addAtBack": false,
	"spawnType": "circle",
	"spawnCircle": {
		"x": 0,
		"y": 0,
		"r": 0
	}
};
var conf = JSON.parse(JSON.stringify(newCircleEmitterConf));
var emitter = new cloudkid.Emitter(
	stage,
	[particleTexture],
	conf);
var elapsed = Date.now();
var start = Date.now();
var lastDt = 0;
var CYCLETIME = 20000;
var innerHeight = height - 2 * border;
var innerWidth = width - 2 * border;
var sparkTime = 1000;
var pixelTime = sparkTime / (2 * (innerHeight + innerWidth));
var rotationSpread = 10;
var update = function () {
	requestAnimationFrame(update);
	var totalDt = Date.now() - start;
	totalDt = totalDt - CYCLETIME + sparkTime;
	var rotTime = totalDt % CYCLETIME;
	if (rotTime > sparkTime) {
		emitter.emit = false;
	} else {
		emitter.emit = true;
	}
	if (rotTime > (innerWidth * 2 + innerHeight) * pixelTime) {
		//up at left
		rotTime -= (innerWidth * 2 + innerHeight) * pixelTime;
		emitter.maxStartRotation = 180 - rotationSpread;
		emitter.minStartRotation = 180 + rotationSpread;
		emitter.spawnPos.x = border;
		emitter.spawnPos.y = border + innerHeight - (rotTime / pixelTime);
	} else if (rotTime > (innerWidth + innerHeight) * pixelTime) {
		//left at bottom
		rotTime -= (innerWidth + innerHeight) * pixelTime;
		emitter.maxStartRotation = 90 - rotationSpread;
		emitter.minStartRotation = 90 + rotationSpread;
		emitter.spawnPos.x = border + innerWidth - (rotTime / pixelTime);
		emitter.spawnPos.y = border + innerHeight;
	} else if (rotTime > (innerWidth) * pixelTime) {
		//down at rigth
		rotTime -= (innerWidth) * pixelTime;
		emitter.maxStartRotation = 0 - rotationSpread;
		emitter.minStartRotation = 0 + rotationSpread;
		emitter.spawnPos.x = border + innerWidth;
		emitter.spawnPos.y = (rotTime / pixelTime) + border;
	} else {
		//right at top
		emitter.maxStartRotation = 270 - rotationSpread;
		emitter.minStartRotation = 270 + rotationSpread;
		emitter.spawnPos.x = (rotTime / pixelTime) + border;
		emitter.spawnPos.y = border;
	}
	var now = Date.now();
	var dt = now - elapsed;
	emitter.update(dt * 0.001);
	elapsed = now;
	lastDt = dt;
	renderer.render(stage);
};
update();
