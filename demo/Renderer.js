var Renderer = new function(){
	
	var config = {};
	
	var framesSinceCount = 0;
	
	var points = [];
	
	var canvas = document.getElementById('renderCanvas');
	var context = canvas.getContext("2d");
	
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	var width = canvas.width;
	var height = canvas.height;
	
	var args = window.location.search;
	var zoom = 2000/width;
	console.log(zoom);
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

	var PI = Math.PI;
	
	setInterval(fpsCount, 1000);
	
	function fpsCount(){
		document.getElementById("fps").innerHTML = "fps: "+framesSinceCount;
		framesSinceCount = 0;
	}

	function renderAll(){
		framesSinceCount++;
		var imageData = context.createImageData(width, height);
		
		var i = points.length;
		
		var point;
		var distanceFactor;
		var renderY;
		var renderX;
		var pos0;
		var c;		
		
		while(i--){
			point = points[i];
			var vanished = (point.y / World.vanishingPointY);
			
			if(point.y > 0 && point.y < World.vanishingPointY && (1-vanished) > Math.random()){
				distanceFactor = 1-(World.vanishingPointY/(zoom*point.y));
				renderY = ~~(point.z + distanceFactor * (World.vanishingPointZ - point.z));
				renderX = ~~(point.x + distanceFactor * (World.vanishingPointX - point.x));
				if(renderX > 0 && renderX < width && renderY > 0 && renderY < height){
					pos0 = (renderY	* width + renderX ) * 4;
					c = ~~(255 * vanished);
					/*imageData.data[pos0  ] = 0;
					imageData.data[pos0+1] = 0;
					imageData.data[pos0+2] = 0;*/
					imageData.data[pos0+3] = 255-c;
				}
			}
		}
		
		context.putImageData(imageData, 0, 0);
	}
	
	function rotateAll(){
		var i = points.length;
		var angles = [0, 0, 0.01];
		var center = [width/2, 400, height/2];
		while(i--){
			rotate(points[i], angles, center);
			//rotate(points[i], [-0.0011111, 0.002631, 0.007], center);
		}
	}

	function rotate(object, angles, center){

		var vector = {
			x: object.x - center[0],
			y: object.y - center[1],
			z: object.z - center[2]
		};
		
		var s;
		var c;
		
		// x axis
		if(angles[0] != 0){
			s = Math.sin(angles[0]);
			c = Math.sqrt(1-s*s);
			vector.y = vector.y * c - vector.z * s;
			vector.z = vector.y * s + vector.z * c;
		}
		
		// y axis
		if(angles[1] != 0){
			s = Math.sin(angles[1]);
			c = Math.sqrt(1-s*s);
			vector.z = vector.z * c - vector.x * s;
			vector.x = vector.z * s + vector.x * c;
		}
		
		// z axis
		if(angles[2] != 0){
			s = Math.sin(angles[2]);
			c = Math.sqrt(1-s*s);
			vector.x = vector.x * c - vector.y * s;
			vector.y = vector.x * s + vector.y * c;
		}
		
		object.x = center[0] + vector.x;
		object.y = center[1] + vector.y;
		object.z = center[2] + vector.z;
		
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
	
	function setPoints(nPoints){
		points = nPoints;
		for(var i in points){
			scale(points[i], 2);
			translate(points[i], [width/2 - 300, 100, height/2]);
		}
	}
	
	return{
		 setPoints: setPoints
		,renderAll: renderAll
		,rotateAll: rotateAll
	}
}

