var args = window.location.search;
var seed;
var setRuggedness;
var setIterations;
if(args){
	seed = args.split("seed=")[1];
	if(seed){
		seed = seed.split("&")[0];
	}
	setRuggedness = args.split("ruggedness=")[1];
	if(setRuggedness){
		setRuggedness = setRuggedness.split("&")[0];
	}
	setIterations = args.split("iterations=")[1];
	if(setIterations){
		setIterations = setIterations.split("&")[0];
	}
}

var rand = new Math.seedrandom(seed);
var Renderer = new Renderer();

var shortEdge = 300;
var iterations = 9;
if(setIterations){
	iterations = setIterations;
}

var terrainPoints = [
	 [0, 0]
	,[0, 0]
];

var ruggedness = 0.8; // lower for smoother terrain, higher for more extreme
if(setRuggedness){
	ruggedness = setRuggedness;
}

render();
setTimeout(generateTerrain, 150);

function generateTerrain(){
	for(var i = 0; i < iterations; i++){
		addTerrainPoints();
	}
	document.getElementById("points").innerHTML = "Points: "+terrainPoints.length * terrainPoints[0].length;
	console.log(terrainPoints.length);
	setInterval(rotateTerrain, 1);
}

function rotateTerrain(){
	Renderer.rotateAll();
	Renderer.renderAll();
	//setTimeout(rotateTerrain, 10);
}

function addTerrainPoints(){
	var oldWidth = terrainPoints[0].length;
	var x = terrainPoints[0].length-1;
	while(x--){
		var y = terrainPoints.length;
		while(y--){
			var newheight = (terrainPoints[y][x+1] + terrainPoints[y][x])/2;
			newheight += ruggedness * ((rand()-0.5) * (shortEdge / oldWidth));
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
			newheight += ruggedness * ((rand()-0.5) * (shortEdge / oldHeight));
			newRow.unshift(newheight);
		}
		terrainPoints.splice(y+1,0,newRow);
	}
	render();
}

function render(){
	
	var points = [];
	
	var size = shortEdge / terrainPoints.length;
	
	var x = terrainPoints[0].length;
	while(x--){
		var y = terrainPoints.length;
		while(y--){
			points.push({
				 x: x*size
				,y: y*size
				,z: terrainPoints[y][x]
			});
		}
	}
	
	Renderer.setPoints(points);
	Renderer.renderAll();
}



