var TerrainGen = new function(){
	
	var seed;
	var iterations;
	var terrainPoints;
	var ruggedness;

	var rand = new Math.seedrandom(seed);

	var shortEdge = 300;
	
	function generateNew(nSeed, nRuggedness, nIterations){
		seed = nSeed;
		ruggedness = nRuggedness;
		iterations = nIterations;
		
		terrainPoints = [
			 [0, 0]
			,[0, 0]
		];
		
		generateTerrain()
	}

	function generateTerrain(){
		for(var i = 0; i < iterations; i++){
			addTerrainPoints();
		}
		document.getElementById("points").innerHTML = "Points: "+terrainPoints.length * terrainPoints[0].length;
		setInterval(rotateTerrain, 1);
	}

	function rotateTerrain(){
		Renderer.rotateAll();
		Renderer.renderAll();
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
	
	return {
		generateNew: generateNew
	}
}

