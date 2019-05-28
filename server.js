var http = require('http');
var path = require('path');
var express = require('express');
var compression = require('compression');
var httpsonly = require('httpsonly');
var helmet = require('helmet');
var app = express();
app.use(helmet());
app.use(httpsonly());
app.use(compression());
app.use(express.static(path.join(__dirname, 'favicon')));
app.use(express.static(path.join(__dirname, 'public')));
var port = process.env.PORT || 9888;
http.createServer(app).listen(port);
console.log('itforedrag.dk listening on: http://localhost:' + port);


//Loop to keep myself active on heroku
//On heroku the server it put to sleep from 60 mins of activity
//so we request ourselves every 19 mins.
var request = require('request');
loop();

function loop() {
	restart(function (err) {
		if (err) {
			console.log('Request failed, retrying in one minute...');
		}
		var timeToRunAgain = err ? 60 * 1000 : 1000 * 60 * 19;
		setTimeout(loop, timeToRunAgain);
	});
}


function restart(callback) {
	request.get('http://www.itforedrag.dk', function (err, resp) {
		if (err || !/2\d\d/.test(resp.statusCode)) {
			console.error(new Date(), (err && err.stack) || ('ERROR self active, statusCode:' + resp.statusCode));
		} else {
			console.log(new Date(), 'OK self active');
		}
		callback(err);
	});
}