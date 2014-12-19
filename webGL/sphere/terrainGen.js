var Terrain = new function(){
	var temperatureGradient = [];

	var iterations = 7;
	
	var gradientMin = -10;
	var gradientRange = 40;

	var animationframe = 0;

	var renderer = null;
	var threeRenderer = null;

	

	function prepareTemperatureGradient(){
		var tgImg = document.getElementById("temperatureGradient");
		var tgCanvas = document.getElementById("temperatureGradientCanvas");
		tgCanvas.height = tgImg.height;
		tgCanvas.width = tgImg.width;
		var tgContext = tgCanvas.getContext("2d");
		tgContext.drawImage(tgImg, 0, 0);
		var tgImageData = tgContext.getImageData(0, 0, tgCanvas.width, tgCanvas.height).data;

		temperatureGradient = [];
		var i = 0;
		while(i < tgImageData.length){
			temperatureGradient.push({
				 r: tgImageData[i  ]
				,g: tgImageData[i+1]
				,b: tgImageData[i+2]
			});
			i += 4;
		}
	}

	var World = {
		 max: 0
		,min: 0
		,difference: 0
		,belowZero: 0

		,heightScale: 1000

		,ruggedness: 1 // lower for smoother terrain, higher for more extreme
		,waterLevel: 0

		,tempRange: 50 // Minimum to maximum temperature in degrees Celsius
		,minTemp: -10
		,maxTemp: this.tempRange + this.minTemp

		,season: 0
		
		,width: 0
		,height: 0

		,terrainPoints: []
	}

	function calculateHeightDifferences(){
		World.max = World.terrainPoints[0][0].getHeight();
		World.min = World.terrainPoints[0][0].getHeight();
		
		var x = 0;
		var y = 0;
		
		for(y = 0; y < World.height; y++){
			for(x = 0; x < World.width; x++){
				if(World.terrainPoints[y][x] > World.max){
					World.max = World.terrainPoints[y][x].getHeight();
				} else if(World.terrainPoints[y][x].getHeight() < World.min){
					World.min = World.terrainPoints[y][x].getHeight();
				}
			}
		}
		
		World.difference = World.max - World.min;
		World.belowZero = 0;
		if(World.min < 0){
			World.belowZero += (0 - World.min);
			World.difference += World.belowZero;
		}

		for(y = 0; y < World.height; y++){
			for(x = 0; x < World.width; x++){
				World.terrainPoints[y][x].setRelativeHeight(
					(World.terrainPoints[y][x].getHeight() + World.belowZero)/World.difference
				);
			}
		}
	}

	var shortEdge;
	var imageWidth;
	var imageHeight;
	var canvasContainer = document.getElementById("canvasContainer");

	/*function windowResize(){

		canvas.width = canvasContainer.clientWidth;
		canvas.height = canvasContainer.clientHeight;

		
		if(World.width  / canvas.width < World.height / canvas.height){
			shortEdge = canvas.height;
			
			imageHeight = shortEdge;
			imageWidth = World.width / World.height * shortEdge;
		} else {
			shortEdge = canvas.width;

			imageWidth = shortEdge;
			imageHeight = World.height / World.width * shortEdge;
		}

		if(renderer){
			renderer.renderFromPreview();
		}
	}*/

	function clear(){
		context.clearRect(0, 0, canvas.width, canvas.height);
	}

	window.addEventListener('load', function(){
		init();
	});
	
	var seasonInterval = null;
	
	function init(){
		
		if(seasonInterval){
			clearInterval(seasonInterval);
		}
		renderer = null;
		threeRenderer = new ThreeRenderer();
		
		prepareTemperatureGradient();

		do{
			World.terrainPoints = [
				 [new TerrainPoint(1), new TerrainPoint(1), new TerrainPoint(1), new TerrainPoint(1)]
				,[new TerrainPoint(1), new TerrainPoint(1), new TerrainPoint(1), new TerrainPoint(1)]
				,[new TerrainPoint(1), new TerrainPoint(1), new TerrainPoint(1), new TerrainPoint(1)]
			];
			
			World.width = World.terrainPoints[0].length;
			World.height = World.terrainPoints.length;
			
			for(var i = 0; i < iterations; i++){
				addTerrainPoints();
			}
			
		} while(worldIsTooBoring());
		
		threeRenderer.Init.tryInit("terrain", World.terrainPoints);
		
		calculateHeightDifferences();
		prepareWorld();
		
		renderer = new Renderer();
		renderer.renderTexture(false);
		renderer.renderHeightmap();

		//seasonInterval = setInterval(animate, 0);

		var event = new Event('worldCreated');
		window.dispatchEvent(event);
	}

	function animate(){
		World.season = Math.sin(animationframe / 10);
		biomify();
		renderer.renderTexture(false);
		animationframe++;
	}

	function worldIsTooBoring(){
		var water = 0;
		var total = World.height * World.width;
		
		var x = 0;
		var y = 0;
		
		for(y = 0; y < World.height; y++){
			for(x = 0; x < World.width; x++){
				if(World.terrainPoints[y][x].getHeight() < World.waterLevel){
					water++;
				}
			}
		}
		var ratio = water/total;
		if(ratio > 0.7 || ratio < 0.3){
			console.log("Rejected world - Too boring: "+ratio);
			return true;
		}
		return false;
	}

	function TerrainPoint(elevation){
		var isWater;
		var temperature;
		var hillshade;
		var relativeHeight;
		var latitude;

		return {
			 getHeight: 		function(){return elevation;}
			,isWater: 			function(){return isWater;}
			,getTemperature: 	function(){return temperature;}
			,getHillshade: 		function(){return hillshade;}
			,getRelativeHeight: function(){return relativeHeight;}
			,getLatitude: 		function(){return latitude;}
			
			,setWater: 			function(w){isWater 		= w;}
			,setTemperature: 	function(t){temperature 	= t;}
			,setHillshade: 		function(h){hillshade 		= h;}
			,setRelativeHeight: function(r){relativeHeight 	= r;}
			,setLatitude: 		function(l){latitude	 	= l;}
		};
	}

	function addTerrainPoints(){
		
		var x = World.terrainPoints[0].length - 1;
		while(x--){
			var y = World.terrainPoints.length;
			while(y--){
				var newheight = 0;
				if(x == 0){
					newheight = (World.terrainPoints[y][World.terrainPoints[0].length-1].getHeight() + World.terrainPoints[y][x].getHeight())/2;
					newheight += World.ruggedness * ((Math.random()-0.5) * (World.heightScale / World.width));
				} else {
					newheight = (World.terrainPoints[y][x+1].getHeight() + World.terrainPoints[y][x].getHeight())/2;
					newheight += World.ruggedness * ((Math.random()-0.5) * (World.heightScale / World.width));
				}

				if(y == 0 || y == World.terrainPoints.length - 1){
					newheight = 0;
				}
				
				World.terrainPoints[y].splice(x+1, 0, new TerrainPoint(newheight, x, y));
			}
		}
		
		var y = World.terrainPoints.length - 1;
		while(y--){
			var x = World.terrainPoints[0].length;
			var newRow = [];
			while(x--){
				var newheight;
				if(x == 0){
					newheight = newRow[newRow.length-1].getHeight();
				} else {
					newheight = (World.terrainPoints[y][x].getHeight() + World.terrainPoints[y+1][x].getHeight())/2;
					newheight += World.ruggedness * ((Math.random()-0.5) * (World.heightScale / World.height));
				}
				newRow.unshift(new TerrainPoint(newheight, x, y));
			}
			World.terrainPoints.splice(y+1, 0, newRow);
		}
		
		World.width = World.terrainPoints[0].length;
		World.height = World.terrainPoints.length;
	}
	
	/*
		Does stuff to the world after terrain generation, such as
		setting biomes, defining water, calculating hillshades
		and all that.
	*/
	function prepareWorld(){
		var x = 0;
		var y = 0;
		for(y = 0; y < World.height; y++){
			for(x = 0; x < World.width; x++){
				var tile = World.terrainPoints[y][x];
				
				calculateHillshade(tile, x, y);
				calculateWater(tile);
				calculateLatitude(tile, x, y);
				calculateTemperature(tile, x, y);
				
			}
		}
		
		function calculateHillshade(tile, x, y){
			var darken = 0;
			var brighten = 0;
			
			for(var n = 1; n <= 5; n++){
				if(y + n >= World.height){
					brighten += 0;
				} else {
					brighten += (World.terrainPoints[y+n][(x+n)%World.width].getHeight() - World.terrainPoints[y+n-1][(x+n-1)%World.width].getHeight())/n;
				}
				
				if(y - n < 0){
					darken += 0;
				} else {
					var further = (x-n + 1 + World.width) % World.width;
					var closer = (x-n + World.width) % World.width;
					darken += (World.terrainPoints[y-n+1][further].getHeight() - World.terrainPoints[y-n][closer].getHeight())/n;
				}
			}

			shade = darken + brighten;
			shade = Math.round(shade * 0.45 / World.ruggedness * Math.sqrt(iterations));

			tile.setHillshade(shade);
		}
		
		function calculateWater(tile){
			if(tile.getHeight() < World.waterLevel){
				tile.setWater(true);
			}
		}
		
		function calculateLatitude(tile, x, y){
			tile.setLatitude(1 - (Math.abs(y - World.height/2) / World.height*2));
		}
		
		function calculateTemperature(tile, x, y){
			temp = (tile.getLatitude() * World.tempRange) + World.minTemp;

			temp += (y - World.height/2) * World.season/(iterations * 2);

			temp = temp - tile.getHeight() / 5;
			
			tile.setTemperature(temp);
		}
		
	}

	function Renderer(){

		var textureCanvas = document.getElementById("terrainTextureCanvas");
		textureCanvas.height = World.height;
		textureCanvas.width = World.width;
		var textureContext = textureCanvas.getContext("2d");
		var textureImageData;
		
		var heightmapCanvas = document.getElementById("heightmapCanvas");
		heightmapCanvas.height = World.height;
		heightmapCanvas.width = World.width;
		var heightmapContext = heightmapCanvas.getContext("2d");
		var heightmapImageData;

		var tile;
		var c;
		var color;
		var r;
		var g;
		var b;
		var temp;
		var t;
		var shade;
		var a;
		var x;
		var y;
		
		function renderTexture(renderWater){
			
			textureImageData = textureContext.createImageData(textureCanvas.width, textureCanvas.height);
			
			var x = 0;
			var y = 0;
			
			for(y = 0; y < World.height; y++){
				for(x = 0; x < World.width; x++){
					textureRenderTile(x, y);
				}
			}
			textureContext.putImageData(textureImageData, 0, 0);
			
			function textureRenderTile(x, y){
				tile = World.terrainPoints[y][x];
				c = Math.floor((tile.getRelativeHeight())*255);
				
				color = [];
				
				if(tile.isWater() && renderWater){
					if(tile.getTemperature() > -3){
						color = [0, 0, c];
					} else {
						r = Math.abs(tile.getTemperature()) * iterations + 150;
						g = Math.abs(tile.getTemperature()) * iterations + 180;
						if(r > 210){
							r = 210;
						}
						if(g > 235){
							g = 235;
						}
						color = [r, g, 255];
					}
					
				} else {
					temp = Math.floor(((tile.getTemperature() - gradientMin)/gradientRange) * temperatureGradient.length);
					if(temp < 0){
						temp = 0;
					} else if(temp > 255){
						temp = 255;
					}
					t = temperatureGradient[temp];
					color = [t.r, t.g, t.b];

					shade = tile.getHillshade();

					for(var i = 0; i <= 2; i++){
						
						color[i] += shade;
						
						if(tile.isWater()){
							color[i] += tile.getHeight();
						}
						color[i] = Math.round(color[i]);
						if(color[i] > 255){
							color[i] = 255;
						} else if(color[i] < 0){
							color[i] = 0;
						}
					}

				}

				a = (+y * World.width + +x) * 4;

				textureImageData.data[a  ] = color[0];
				textureImageData.data[a+1] = color[1];
				textureImageData.data[a+2] = color[2];
				textureImageData.data[a+3] = 255;
				
			}
			
			if(threeRenderer){
				threeRenderer.Init.tryInit("terrainTexture");
			}
		}
		
		function renderHeightmap(){
			
			heightmapImageData = heightmapContext.createImageData(heightmapCanvas.width, heightmapCanvas.height);
			
			var x = 0;
			var y = 0;
			
			for(y = 0; y < World.height; y++){
				for(x = 0; x < World.width; x++){
					heightmapRenderTile(x, y);
				}
			}
			heightmapContext.putImageData(heightmapImageData, 0, 0);
			
			function heightmapRenderTile(x, y){
				tile = World.terrainPoints[y][x];
				c = Math.floor((tile.getRelativeHeight())*255);
				
				a = (+y * World.width + +x) * 4;

				heightmapImageData.data[a  ] = c;
				heightmapImageData.data[a+1] = c;
				heightmapImageData.data[a+2] = c;
				heightmapImageData.data[a+3] = 255;
			}
			
			if(threeRenderer){
				threeRenderer.Init.tryInit("heightmap");
			}
		}

		return {
			 renderTexture: renderTexture
			,renderHeightmap: renderHeightmap
		};
	}
	return {
		 init: init
		,renderer: renderer
		,getWorld: function(){return World;}
		,clear: clear
	}
}































