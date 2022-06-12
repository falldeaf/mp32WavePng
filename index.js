port = 3000;

const CurveInterpolator = require('curve-interpolator').CurveInterpolator;
const express = require("express");
const app = express();
express.static.mime.define({'application/javascript': ['js']})


app.use(express.static('public'));

app.get("/mp3/:filename", (req, res) => {
	res.send("mp3 to get: " + req.params.filename);
});

app.get("/points/", (req, res) => {
	const points = [
		[0, 4],
		[1, 2],
		[3, 6.5],
		[4, 8],
		[5.5, 4],
		[7, 3],
		[8, 0]
	];
		
	const interp = new CurveInterpolator(points, { tension: 0.2 });

	const axis = 1;
	const yintersects = interp.lookup(7, axis);

	res.send(yintersects);
});

app.listen(port, () => {
	console.log("http://localhost:" + port);
});