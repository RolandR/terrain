function Renderer(){
	
	var framesSinceCount = 0;
	
	var objects;
	var colors;
	
	var canvas = document.getElementById('renderCanvas');
	var context = canvas.getContext("2d");

	var fpsMeter = document.getElementById("fps");
	
	canvas.width = ~~(window.innerWidth/2);
	canvas.height = ~~(window.innerHeight/2);
	
	var width = canvas.width;
	var height = canvas.height;

	var imageData = new ImageData(width, height);

	var objectSize = 4;

	window.onresize = function(){
		canvas.width = ~~(window.innerWidth/2);
		canvas.height = ~~(window.innerHeight/2);
		
		width = canvas.width;
		height = canvas.height;

		imageData = new ImageData(width, height);
	}
	
	var args = window.location.search;
	var zoom = 2000/width;
	if(args){
		zoomArgs = args.split("zoom=")[1];
		if(zoomArgs){
			zoom = zoomArgs.split("&")[0];
		}
	}
	
	var World = {
		 vanishingPointX: width/2
		,vanishingPointY: 800
		,vanishingPointZ: height/3
	};
	
	var rotateCenter = [~~(width/2), 400, ~~(2*height/5)];
	var rotateAngle = [Math.sin(0.01), Math.cos(0.01)];

	var PI = Math.PI;

	window.addEventListener('wheel', function(e) {
		//console.log(e.deltaY);
		if(e.shiftKey){
			zoom += zoom * 0.001 * e.deltaX;
		} else {
			moveY += e.deltaY * 0.5;
		}
		return false;
	});

	var moving = false;
	var panning = false;
	var moveStartX = 0;
	var moveStartY = 0;
	var lastX = 0;
	var lastY = 0;
	var moveX = 0;
	var moveY = 0;
	var moveZ = 0;
	var panX = 0;
	var panY = 0;

	window.addEventListener('mousemove', function(e) {
		if(panning || moving){
			var deltaX = e.screenX - moveStartX;
			var deltaY = e.screenY - moveStartY;
			if(panning){
				panX += deltaX - lastX;
				panY += deltaY - lastY;
			} else if(moving){
				moveX += deltaX - lastX;
				moveZ += deltaY - lastY;
			}
			lastX = deltaX;
			lastY = deltaY;
		}
	});

	window.addEventListener('mousedown', function(e) {
		if(e.buttons == 1){
			moving = true;
		} else if(e.buttons == 2){
			panning = true;
			e.preventDefault();
		}
		moveStartX = e.screenX;
		moveStartY = e.screenY;
	});

	window.addEventListener('mouseup', function(e) {
		moving = false;
		panning = false;
		moveStartX = 0;
		moveStartY = 0;
		lastX = 0;
		lastY = 0;
		panX = 0;
		panY = 0;
	});
	/*window.addEventListener('mouseout', function(e) {
		moving = false;
	});*/
	
	
	setInterval(fpsCount, 1000);
	
	function fpsCount(){
		fpsMeter.innerHTML = "fps: "+framesSinceCount;
		framesSinceCount = 0;
	}

	function renderAll(){
		framesSinceCount++;

		//imageData = new ImageData(width, height);
		
		var point;
		var distanceFactor;
		var vanished;
		var renderY;
		var renderX;
		var pos0;
		var c;

		//var scale = -0.01;
		//zoom += zoom * scale;
		//World.vanishingPointY += World.vanishingPointY * scale;

		var data = new Uint8ClampedArray(height*width*4);
		//var data = [];
		
		for(var i = 0; i < objects.length; i+=objectSize){
			
			if(objects[i+1] > 0 && objects[i+1] < objects[i+3]){
				
				distanceFactor = 1-(World.vanishingPointY/(zoom*objects[i+1]));
				renderX = ~~(objects[i  ] + distanceFactor * (World.vanishingPointX - objects[i  ]));
				
				if(renderX > 0 && renderX < width){
					renderY = ~~(objects[i+2] + distanceFactor * (World.vanishingPointZ - objects[i+2]));
					
					if(renderY > 0 && renderY < height){
						
						pos0 = (renderY	* width + renderX ) * 4;
						c = 255 - ~~(255 * objects[i+1] / (World.vanishingPointY*2));
						if(data[pos0+3] < c){
							
							data[pos0  ] = colors[i  ];
							data[pos0+1] = colors[i+1];
							data[pos0+2] = colors[i+2];
							data[pos0+3] = c;
							
						}
						
					}
				}
			}
		}

		imageData.data.set(data);
		
		context.putImageData(imageData, 0, 0);

		//imageData.data.fill(0);

	}
	
	function rotateAll(){
		
		for(var i = 0; i < objects.length; i+=objectSize){
			rotateZ(i, rotateAngle, rotateCenter);
			//rotate(objects[i], [0.0111111, 0.007631, 0.01], [width/2, 150, width/2]);
		}

		if(panX || panY){
			var zAngle = [Math.sin(0.01 * panX), Math.cos(0.01 * panX)];
			var yAngle = [Math.sin(0.01 * -panY), Math.cos(0.01 * -panY)];
			
			for(var i = 0; i < objects.length; i+=objectSize){
				rotateZ(i, zAngle, rotateCenter);
				rotateX(i, yAngle, rotateCenter);
			}

			panX = 0;
			panY = 0;
		}

		if(moveX || moveZ){
			for(var i = 0; i < objects.length; i+=objectSize){
				translate(i, [moveX, 0, moveZ]);
			}

			rotateCenter[0] += moveX;
			rotateCenter[2] += moveZ;
			moveX = 0;
			moveZ = 0;
		}

		if(moveY){
			for(var i = 0; i < objects.length; i+=objectSize){
				translate(i, [0, moveY, 0]);
			}

			rotateCenter[1] += moveY;
			moveY = 0;
		}
	}

	function rotateX(i, angle, center){		
		var y = objects[i+1] - center[1]
		var z = objects[i+2] - center[2]

		objects[i+1] = y * angle[1] - z * angle[0] + center[1];
		objects[i+2] = y * angle[0] + z * angle[1] + center[2];
	}

	function rotateY(i, angle, center){
		var x = objects[i  ] - center[0]
		var z = objects[i+2] - center[2]

		objects[i+2] = z * angle[1] - x * angle[0] + center[0];
		objects[i  ] = z * angle[0] + x * angle[1] + center[2];
	}

	function rotateZ(i, angle, center){
		var x = objects[i  ] - center[0]
		var y = objects[i+1] - center[1]

		objects[i  ] = x * angle[1] - y * angle[0] + center[0];
		objects[i+1] = x * angle[0] + y * angle[1] + center[1];
	}

	function scale(i, factor){
		objects[i  ] *= factor;
		objects[i+1] *= factor;
		objects[i+2] *= factor;
	}

	function translate(i, coords){
		objects[i  ] += coords[0];
		objects[i+1] += coords[1];
		objects[i+2] += coords[2];
	}

	function minmax(number, min, max){
		if(number < min){
			number = min;
		}
		if(number > max){
			number = max;
		}
		return number;
	}
	
	function setPoints(points){
		//objects = new Float32Array(objectSize * points.length);
		objects = [];
		colors = new Uint8ClampedArray(objectSize*points.length);
		
		for(var i = 0; i < points.length; i++){
			points[i].vanishY = World.vanishingPointY * Math.random();
			if(points[i].z > 0){

				colors[i*objectSize  ] = 0;
				colors[i*objectSize+1] = 0;
				colors[i*objectSize+2] = 255 - points[i].z * 5;
				
				points[i].z = 0;
			} else {
				var val = 0-points[i].z * 10;

				val = Math.round(val/(Math.random()*50 + 50)) * 100;
				
				colors[i*objectSize  ] = val;
				colors[i*objectSize+1] = val;
				colors[i*objectSize+2] = val;

				if(points[i].z > -6){
					colors[i*objectSize+1] += 20 * (6 + points[i].z);

					if(points[i].z > -2){
						colors[i*objectSize  ] += 130 * (2 + points[i].z);
						colors[i*objectSize+1] += 45 * (2 + points[i].z);
					}
				}
			}
			
			objects[i*objectSize  ] = points[i].x;
			objects[i*objectSize+1] = points[i].y;
			objects[i*objectSize+2] = points[i].z;
			objects[i*objectSize+3] = points[i].vanishY;
			
		}

		for(var i = 0; i < objects.length; i+=objectSize){
			scale(i, 2);
			translate(i, [width/2 - 300, 100, height/2]);
			translate(i, [Math.random(), Math.random(), 0]);
		}
	}
	
	return{
		 setPoints: setPoints
		,renderAll: renderAll
		,rotateAll: rotateAll
	}
}





















