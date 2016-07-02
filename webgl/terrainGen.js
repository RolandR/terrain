var Terrain = new function(){
	var temperatureGradient = [];

	var iterations = 7;
	
	var gradientMin = -10;
	var gradientRange = 40;

	var animationframe = 0;

	var renderer = null;

	

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
		
		,edgeLength: Math.pow(2, iterations) + 1

		,heightScale: 1000

		,ruggedness: 1 // lower for smoother terrain, higher for more extreme
		,waterLevel: 0

		,tempRange: 50 // Minimum to maximum temperature in degrees Celsius
		,minTemp: -10
		,maxTemp: this.tempRange + this.minTemp

		,season: 0

		,terrainPoints: []
	}

	function calculateHeightDifferences(){
		World.max = World.terrainPoints[0][0].getHeight();
		World.min = World.terrainPoints[0][0].getHeight();
		
		var x = World.terrainPoints[0].length;
		while(x--){
			var y = World.terrainPoints.length;
			while(y--){
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

		var x = World.terrainPoints[0].length;
		while(x--){
			var y = World.terrainPoints.length;
			while(y--){
				World.terrainPoints[y][x].setRelativeHeight((World.terrainPoints[y][x].getHeight() + World.belowZero)/World.difference);
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

		
		if(World.terrainPoints[0].length  / canvas.width < World.terrainPoints.length / canvas.height){
			shortEdge = canvas.height;
			
			imageHeight = shortEdge;
			imageWidth = World.terrainPoints[0].length / World.terrainPoints.length * shortEdge;
		} else {
			shortEdge = canvas.width;

			imageWidth = shortEdge;
			imageHeight = World.terrainPoints.length / World.terrainPoints[0].length * shortEdge;
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
		threeRenderer = null;
		
		prepareTemperatureGradient();

		do{
			World.terrainPoints = [
				 [new TerrainPoint(1), new TerrainPoint(1), new TerrainPoint(1), new TerrainPoint(1)]
				,[new TerrainPoint(1), new TerrainPoint(1), new TerrainPoint(1), new TerrainPoint(1)]
				,[new TerrainPoint(1), new TerrainPoint(1), new TerrainPoint(1), new TerrainPoint(1)]
			];
			var i = iterations;
			while(i--){
				addTerrainPoints();
			}
		} while(worldIsTooBoring());
		
		renderer = new Renderer();
		threeRenderer = new ThreeRenderer();

		calculateHeightDifferences();
		calculateHillshades();
		calculateLatitudes();
		
		biomify();
		renderer.render();
		threeRenderer.buildMesh(World.terrainPoints);

		//seasonInterval = setInterval(animate, 250);

		var event = new Event('worldCreated');
		window.dispatchEvent(event);
	}

	function animate(){
		World.season = Math.sin(animationframe / 200);
		biomify();
		renderer.render();
		animationframe++;
	}

	function worldIsTooBoring(){
		var water = 0;
		var total = World.terrainPoints.length * World.terrainPoints[0].length;
		var x = World.terrainPoints[0].length;
		while(x--){
			var y = World.terrainPoints.length;
			while(y--){
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
		var airPressure;
		var newAirPressure;
		var airTemperature;

		return {
			 getHeight: 		function(){return elevation;}
			,isWater: 			function(){return isWater;}
			,getTemperature: 	function(){return temperature;}
			,getHillshade: 		function(){return hillshade;}
			,getRelativeHeight: function(){return relativeHeight;}
			,getLatitude: 		function(){return latitude;}
			,getAirPressure:	function(){return airPressure;}
			,getAirTemperature:	function(){return airTemperature;}
			
			,setWater: 			function(w){isWater 		= w;}
			,setTemperature: 	function(t){temperature 	= t;}
			,setHillshade: 		function(h){hillshade 		= h;}
			,setRelativeHeight: function(r){relativeHeight 	= r;}
			,setLatitude: 		function(l){latitude	 	= l;}
			,setAirPressure: 	function(p){airPressure	 	= p;}
			,setNewAirPressure: function(n){newAirPressure	= n;}
			,setAirTemperature: function(t){airTemperature	= t;}
			
			,applyNewAP: 		function(){airPressure = newAirPressure;}
		};
	}

	function addTerrainPoints(){
		var oldWidth = World.terrainPoints[0].length;
		var x = World.terrainPoints[0].length - 1;
		while(x--){
			var y = World.terrainPoints.length;
			while(y--){
				var newheight = 0;
				if(x == 0){
					newheight = (World.terrainPoints[y][World.terrainPoints[y].length-1].getHeight() + World.terrainPoints[y][x].getHeight())/2;
					newheight += World.ruggedness * ((Math.random()-0.5) * (World.heightScale / oldWidth));
				} else {
					newheight = (World.terrainPoints[y][x+1].getHeight() + World.terrainPoints[y][x].getHeight())/2;
					newheight += World.ruggedness * ((Math.random()-0.5) * (World.heightScale / oldWidth));
				}
				World.terrainPoints[y].splice(x+1, 0, new TerrainPoint(newheight, x, y));
			}
		}
		var oldHeight = World.terrainPoints.length;
		var y = World.terrainPoints.length - 1;
		while(y--){
			var x = World.terrainPoints[y].length;
			var newRow = [];
			while(x--){
				var newheight;
				if(x == 0){
					newheight = newRow[newRow.length-1].getHeight();
				} else {
					newheight = (World.terrainPoints[y][x].getHeight() + World.terrainPoints[y+1][x].getHeight())/2;
					newheight += World.ruggedness * ((Math.random()-0.5) * (World.heightScale / oldHeight));
				}
				newRow.unshift(new TerrainPoint(newheight, x, y));
			}
			World.terrainPoints.splice(y+1, 0, newRow);
		}
	}

	function calculateHillshades(){
		
		var x = World.terrainPoints[0].length;
		while(x--){
			var y = World.terrainPoints.length;
			while(y--){

				var darken = 0;
				var brighten = 0;
				
				for(var n = 1; n <= 5; n++){
					if(y >= World.terrainPoints.length - n || x >= World.terrainPoints[y].length - n){
						brighten += 0;
					} else {
						brighten += (World.terrainPoints[y+n][x+n].getHeight() - World.terrainPoints[y+n-1][x+n-1].getHeight())/n;
					}
					
					if(y <= 1+n || x <= 1+n){
						darken += 0;
					} else {
						darken += (World.terrainPoints[y-n+1][x-n+1].getHeight() - World.terrainPoints[y-n][x-n].getHeight())/n;
					}
				}

				shade = darken + brighten;
				shade = Math.round(shade * 0.45 / World.ruggedness * Math.sqrt(iterations));

				World.terrainPoints[y][x].setHillshade(shade);
				
				//while we're at it, set water
				if(World.terrainPoints[y][x].getHeight() < World.waterLevel){
					World.terrainPoints[y][x].setWater(true);
				}
				
			}
		}
	}

	function calculateLatitudes(){	
		var worldWidth = World.terrainPoints[0].length;
		var x = worldWidth;
		while(x--){
			var worldHeight = World.terrainPoints.length;
			var y = worldHeight;
			while(y--){
				World.terrainPoints[y][x].setLatitude(1 - (Math.abs(y - worldHeight/2) / worldHeight*2));
			}
		}
	}

	function biomify(){

		var tile;
		var temp;
		
		var worldEdgeLengths = World.terrainPoints.length
		
		var worldWidth = World.terrainPoints[0].length;
		var worldHeight = World.terrainPoints.length;

		var y;
		var x = worldWidth;
		while(x--){
			y = worldHeight;
			while(y--){
				
				tile = World.terrainPoints[y][x];

				temp = (tile.getLatitude() * World.tempRange) + World.minTemp;

				temp += (y - worldHeight/2) * World.season/(iterations * 2);

				temp = temp - tile.getHeight() / 5;

			/*	if(temp < World.minTemp){
					temp = World.minTemp;
				}

				if(temp >= World.maxTemp){
					temp = World.maxTemp;
				}*/
				
				tile.setTemperature(temp);
		
			}
		}
	}

	function Renderer(){

		var prCanvas = document.getElementById("terrainPreRenderCanvas");
		prCanvas.height = World.terrainPoints.length;
		prCanvas.width = World.terrainPoints[0].length;
		var prContext = prCanvas.getContext("2d");
		var prImageData;

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
		
		function render(){
			
			prImageData = prContext.createImageData(prCanvas.width, prCanvas.height);
			
			x = World.terrainPoints[0].length;
			while(x--){
				y = World.terrainPoints.length;
				while(y--){
					tile = World.terrainPoints[y][x];
					c = Math.floor((tile.getRelativeHeight())*255);
					
					color = [];
					
					/*if(tile.isWater()){
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
						
					} else {*/
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

					//}

					a = (y * World.terrainPoints[0].length + x) * 4;

					prImageData.data[a  ] = color[0];
					prImageData.data[a+1] = color[1];
					prImageData.data[a+2] = color[2];
					prImageData.data[a+3] = 255;
				}
			}
			prContext.putImageData(prImageData, 0, 0);
		}

		return {
			 render: render
		};
	}
	return {
		 init: init
		,render: renderer
		,getWorld: function(){return World;}
		,clear: clear
	}
}































