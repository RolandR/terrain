var canvas = document.getElementById("renderCanvas");
var context = canvas.getContext("2d");

canvas.width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
canvas.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

var terrainPoints = [canvas.height/2, canvas.height/2, canvas.height/2];
var terrainBorders = [0, canvas.width];
var ruggedness = 1; // lower for smoother terrain, higher for more extreme
var terrainWidth = Math.abs(terrainBorders[0] - terrainBorders[1]);

generateStep();



function addTerrainPoints(){

	var oldPointCount = terrainPoints.length;
	var i = oldPointCount - 1;
	
	while(i--){
		var point = (terrainPoints[i+1] + terrainPoints[i])/2;
		point += ruggedness * ((Math.random()-0.5) * (terrainWidth / oldPointCount));
		terrainPoints.splice(i+1, 0, point);
	}
}

function render(){
	
	var backgroundGradient = context.createLinearGradient(0, 0, 0, canvas.height);
	backgroundGradient.addColorStop(0, "#883300");
	backgroundGradient.addColorStop(1, "#CC8800");
	context.fillStyle = backgroundGradient;
	context.fillRect(0, 0, canvas.width, canvas.height);
	
	var i = terrainPoints.length;
	
	context.beginPath();
	context.moveTo(
		terrainBorders[0],
		terrainPoints[0]
	);
	
	context.lineTo(
		terrainBorders[0],
		canvas.height
	);
	
	context.lineTo(
		terrainWidth + terrainBorders[0],
		canvas.height
	);
	
	context.lineTo(
		terrainWidth + terrainBorders[0],
		terrainPoints[terrainPoints.length-1]
	);
	
	while(i--){
		context.lineTo(
			((i-1)/(terrainPoints.length-1)) * terrainWidth + terrainBorders[0],
			terrainPoints[i-1]
		);
	}
	context.closePath();
	
	context.fillStyle = "#000000";
	context.fill();
}

function generateStep(){
	render();
	addTerrainPoints();
	if(terrainPoints.length < terrainWidth){
		setTimeout(generateStep, 500);
	} else {
		setTimeout(zoom, 1000);
	}
}

function zoom(){
	terrainPoints.splice(0, 1);
	terrainPoints.pop();
	var i = terrainPoints.length-1;
	while(i--){
		terrainPoints[i] = (terrainPoints[i] - canvas.height/2)*(1 + 2/canvas.width) + canvas.height/2;
	}
	if(terrainPoints.length < terrainWidth/2){
		addTerrainPoints();
	}
	render();
	setTimeout(zoom, 10*((terrainWidth/2)/(terrainPoints.length/2)));
}