function Renderer(){
	
	var framesSinceCount = 0;
	
	var objects = [];
	
	var canvas = document.getElementById('renderCanvas');
	var context = canvas.getContext("2d");

	var fpsMeter = document.getElementById("fps");
	
	canvas.width = ~~(window.innerWidth/2);
	canvas.height = ~~(window.innerHeight/2);
	
	var width = canvas.width;
	var height = canvas.height;

	var imageData = new ImageData(width, height);

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
		
		var a = objects.length;

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
		
		for(var i = 0; i < a; i++){
			point = objects[i];
			
			if(point.y > 0 && point.y < point.vanishY){
				distanceFactor = 1-(World.vanishingPointY/(zoom*point.y));
				renderY = ~~(point.z + distanceFactor * (World.vanishingPointZ - point.z));
				renderX = ~~(point.x + distanceFactor * (World.vanishingPointX - point.x));
				if(renderX > 0 && renderX < width && renderY > 0 && renderY < height){
					pos0 = (renderY	* width + renderX ) * 4;
					c = 255 - ~~(255 * point.y / World.vanishingPointY);
					if(data[pos0+3] < c){
						if(point.sea){
							data[pos0+2] = 255;
						} else {
							data[pos0+2] = 0;
						}
						data[pos0+3] = c;
					}
				}
			}
		}

		imageData.data.set(data);
		
		context.putImageData(imageData, 0, 0);

		//imageData.data.fill(0);

	}
	
	function rotateAll(){
		
		for(var i = 0; i < objects.length; i++){
			rotateZ(objects[i], rotateAngle, rotateCenter);
			//rotate(objects[i], [0.0111111, 0.007631, 0.01], [width/2, 150, width/2]);
		}

		if(panX || panY){
			var zAngle = [Math.sin(0.01 * panX), Math.cos(0.01 * panX)];
			var yAngle = [Math.sin(0.01 * -panY), Math.cos(0.01 * -panY)];
			
			for(var i = 0; i < objects.length; i++){
				rotateZ(objects[i], zAngle, rotateCenter);
				rotateX(objects[i], yAngle, rotateCenter);
			}

			panX = 0;
			panY = 0;
		}

		if(moveX || moveZ){
			for(var i = 0; i < objects.length; i++){
				translate(objects[i], [moveX, 0, moveZ]);
			}

			rotateCenter[0] += moveX;
			rotateCenter[2] += moveZ;
			moveX = 0;
			moveZ = 0;
		}

		if(moveY){
			for(var i = 0; i < objects.length; i++){
				translate(objects[i], [0, moveY, 0]);
			}

			rotateCenter[1] += moveY;
			moveY = 0;
		}
	}

	function rotateX(object, angle, center){
		var y = object.y - center[1]
		var z = object.z - center[2]

		object.y = y * angle[1] - z * angle[0];
		object.z = y * angle[0] + z * angle[1];

		object.y += center[1];
		object.z += center[2];
	}

	function rotateY(object, angle, center){
		var x = object.x - center[0]
		var z = object.z - center[2]

		object.z = z * angle[1] - x * angle[0];
		object.x = z * angle[0] + x * angle[1];

		object.x += center[0];
		object.z += center[2];
	}

	function rotateZ(object, angle, center){
		var x = object.x - center[0]
		var y = object.y - center[1]

		object.x = x * angle[1] - y * angle[0];
		object.y = x * angle[0] + y * angle[1];

		object.x += center[0];
		object.y += center[1];
	}

	function scale(object, factor){
		object.x *= factor;
		object.y *= factor;
		object.z *= factor;
		
		return object;
	}

	function translate(object, coords){
		object.x += coords[0];
		object.y += coords[1];
		object.z += coords[2];
		
		return object;
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
		objects = points;
		
		for(var i in objects){
			objects[i].vanishY = World.vanishingPointY * Math.random();
			if(points[i].z > 0){
				points[i].sea = true;
				points[i].z = 0;
			}
			scale(objects[i], 2);
			translate(objects[i], [width/2 - 300, 100, height/2]);
			translate(objects[i], [Math.random(), Math.random(), 0]);
		}
	}
	
	return{
		 setPoints: setPoints
		,renderAll: renderAll
		,rotateAll: rotateAll
	}
}





















