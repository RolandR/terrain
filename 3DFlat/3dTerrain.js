var canvas = document.getElementById("renderCanvas");
var context = canvas.getContext("2d");

canvas.width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
canvas.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

var shortEdge;
if(canvas.width > canvas.height){
	shortEdge = canvas.height;
} else {
	shortEdge = canvas.width;
}

var terrainPoints = [
	 [0, 0]
	,[0, 0]
];

var ruggedness = 1; // lower for smoother terrain, higher for more extreme

render();
setTimeout(generateStep, 1000);

function generateStep(){
	addTerrainPoints();
	render();
	console.log("Enhance! Size: "+terrainPoints.length);
	if(terrainPoints.length < shortEdge/2){
		setTimeout(generateStep, 1000);
	} else {
		console.log("Done.");
	}
}

function addTerrainPoints(){
	var oldWidth = terrainPoints[0].length;
	var x = terrainPoints[0].length-1;
	while(x--){
		var y = terrainPoints.length;
		while(y--){
			var newheight = (terrainPoints[y][x+1] + terrainPoints[y][x])/2;
			newheight += ruggedness * ((Math.random()-0.5) * (shortEdge / oldWidth));
			terrainPoints[y].splice(x+1,0,newheight);
		}
	}
	var oldHeight = terrainPoints.length;
	var y = terrainPoints.length - 1;
	while(y--){
		var x = terrainPoints[y].length;
		var newRow = [];
		while(x--){
			var newheight = (terrainPoints[y][x] + terrainPoints[y+1][x])/2;
			newheight += ruggedness * ((Math.random()-0.5) * (shortEdge / oldHeight));
			newRow.unshift(newheight);
		}
		terrainPoints.splice(y+1,0,newRow);
	}
	render();
}

function render(){
	var max = terrainPoints[0][0];
	var min = terrainPoints[0][0];
	
	var x = terrainPoints[0].length-1;
	while(x--){
		var y = terrainPoints.length;
		while(y--){
			if(terrainPoints[y][x] > max){
				max = terrainPoints[y][x];
			} else if(terrainPoints[y][x] < min){
				min = terrainPoints[y][x];
			}
		}
	}
	
	var difference = max - min;
	var belowZero = 0;
	if(min < 0){
		belowZero += (0 - min);
		difference += belowZero;
	}
	
	var size = shortEdge / terrainPoints.length;
	
	var x = terrainPoints[0].length;
	while(x--){
		var y = terrainPoints.length;
		while(y--){
			var c = Math.round(((terrainPoints[y][x]+belowZero)/difference)*255);
			context.fillStyle = "rgb("+c+","+c+","+c+")";
			context.fillRect(x*size, y*size, Math.ceil(size), Math.ceil(size));
		}
	}
}