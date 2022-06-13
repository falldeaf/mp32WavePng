//Oops, confused block-size and threshold, gotta fix that!

window.AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

colors = ["#d95980", "#63aac0", "#f99b45", "#284e60"];
//threshold = 30;

document.querySelector("#info").style.color = colors[1];
document.querySelectorAll(".buttons").forEach(elem => {
	elem.style.border = "0px";
	elem.style.backgroundColor = colors[1];
});
document.querySelectorAll(".values").forEach(elem => {
	elem.style.color = colors[0];
});


const drawAudio = url => {
	window.url = url;
	fetch(url)
		.then(response => response.arrayBuffer())
		.then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
		//.then(audioBuffer => draw(normalizeData(filterData(audioBuffer))))
		.then(audioBuffer => createImg(normalizeData(filterData(audioBuffer))));
};

const filterData = audioBuffer => {
	const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data


	const samples = parseInt(audioBuffer.duration / 0.001);
	window.samples = samples;

	console.log("dur: " + audioBuffer.duration);
	console.log("frames: " + samples);

	const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
	const filteredData = [];
	for (let i = 0; i < samples; i++) {
		let blockStart = blockSize * i; // the location of the first sample in the block
		let sum = 0;
		for (let j = 0; j < blockSize; j++) {
			sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
		}
		filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
	}
	return filteredData;
};

const normalizeData = filteredData => {
	const multiplier = Math.pow(Math.max(...filteredData), -1);
	return filteredData.map(n => n * multiplier);
}

const printData = normalizedData => {
	for (let i = 0; i < normalizedData.length; i++) {
		console.log(normalizedData[i]);
	}
}

const createImg = normalizedData => {

	document.querySelector("#filename-value").innerHTML = window.url;
	document.querySelector("#duration-value").innerHTML = normalizedData.length/1000;

	var threshold = parseInt(document.querySelector("#threshold").value);

	var points = new Array(Math.floor(normalizedData.length / 30)).fill(0);
	console.log("Number of points: " + points.length);

	window.canvas = document.querySelector("#canvas-wave");
	canvas.width = normalizedData.length;
	canvas.height = 256;
	var ctx = canvas.getContext("2d");

	var playhead = document.querySelector('#playhead');
	var rect = window.canvas.getBoundingClientRect();
	playhead.style.left = rect.left + "px";
	playhead.style.top = rect.top + "px";

	var ctx = canvas.getContext("2d");
	for (let i = 0; i < normalizedData.length; i++) {
		const val = parseInt((normalizedData[i] * 255));
		
		//Draw waveform
		ctx.fillStyle = colors[3];
		ctx.fillRect(i, 255 - val, 1, val + 1);

		var current_point_index = Math.floor(i / threshold);
		if (current_point_index > 0 && val > threshold && val > points[current_point_index]) {
			points[current_point_index] = val;
		}
	}

	for (let i = 0; i < normalizedData.length; i++) {
		//draw tick
		if (i % 30 == 0) {
			ctx.fillStyle = colors[1];
			ctx.fillRect(i, 245, 1, 10);
		}
		//draw large tick
		if (i % 1000 == 0 && i != 0) {
			ctx.fillStyle = colors[1];
			ctx.font = "10px Arial";
			ctx.fillText(i/1000 + "K ms", i+5, 155);

			ctx.fillStyle = colors[1];
			ctx.fillRect(i-1, 155, 1, 100);
		}
	}

	//Horizontal ticks
	ctx.fillStyle = colors[1];
	ctx.fillRect(0, 0, 100, 1);
	
	ctx.fillRect(0, 64, 50, 1);
	ctx.font = "10px Arial";
	ctx.fillText("191", 54, 64);

	ctx.fillRect(0, 128, 100, 1);
	ctx.font = "10px Arial";
	ctx.fillText("127.5", 104, 127);

	ctx.fillRect(0, 192, 50, 1);
	ctx.font = "10px Arial";
	ctx.fillText("64", 54, 192);

	ctx.fillRect(0, 255, 100, 1);

	//Draw threshold line (cutoff for low waveform noise)
	ctx.setLineDash([5, 10]);
	ctx.strokeStyle = colors[2];
	ctx.moveTo(0, 255-threshold);
	ctx.lineTo(normalizedData.length, 255-threshold);
	ctx.stroke();


	window.cpoints = [];
	for (const [index, point] of points.entries()) {
		var x = index * 30 + threshold / 2;
		var y = 255 - point;
		window.cpoints.push([x,y]);
		drawCirc(x, y, ctx);
	}

	const axis = 1;
	var tension = +(document.querySelector("#tension").value);
	console.log(tension);
	window.interp = new CurveInterpolator(window.cpoints, { tension: tension });

	let image_width;
	//Find the smallest power of 2 for an image to store wave data
	for(let i = 0; i < 11; i++) {
		let width = Math.pow(2, i);
		console.log(width);
		console.log(`w:${normalizedData.length} > p:${Math.pow(width, 2)}`);
		if(Math.pow(width, 2) > normalizedData.length ) {
			console.log("Found it");
			image_width = Math.pow(2, i);
			break;
		}
	}
	console.log("smallest width:" + image_width);

	window.canvas_square = document.querySelector("#canvas-square");
	canvas_square.width = image_width;
	canvas_square.height = image_width;
	var ctx2 = canvas_square.getContext("2d");

	//Draw the curved path and store the data in an image
	for (let i = 0; i < normalizedData.length; i++) {
		ctx.fillStyle = colors[0];
		interp_curve = interp.lookup(i, 0)
		const y = (interp_curve[0]) ? interp_curve[0][1] : 255;
		ctx.fillRect(i, y, 1, 1);
		
		ctx2.fillStyle = `rgb(${255-y},0,0)`;
		ctx2.fillRect(i%image_width, Math.floor(i/image_width), 1, 1);
	}
}

function renderGraph() {

}

document.querySelector('#canvas-wave').onmousedown = function(e){
	const rect = this.getBoundingClientRect();
	const x = e.pageX-rect.left;
	const y = 255-(e.pageY-rect.top);

	console.log(x % 30);	
}

function drawCirc(x, y, context) {
	context.beginPath();
	context.arc(x, y, 3, 0, 2 * Math.PI, false);
	context.lineWidth = 5;
	context.fillStyle = colors[0];
	context.fill();
}

function getimg() {
	const canvas = window.canvas_square;
	var anchor = document.createElement("a");
	anchor.href = canvas.toDataURL("image/png");
	anchor.download = window.url.split('.')[0] + ".png";
	anchor.click();
}

function openFile() {
	let input = document.createElement('input');
	input.type = 'file';
	input.onchange = _this => {
				let files = Array.from(input.files);
				console.log(files[0]);
				drawAudio(files[0].name);
			};
	input.click();
}

function playsong() {
	var player = new Audio(window.url).play();
	var playhead = document.querySelector('#playhead');
	var pindex = 0; //playhead.style.left;
	var handle = setInterval(function () {
		//console.log(pindex + " : " + window.samples);
		playhead.style.left = parseInt(pindex) + "px";
		pindex += 1;
		if (pindex > window.samples) clearInterval(handle);
	}, 1);
}

//drawAudio('six_noises.mp3');
