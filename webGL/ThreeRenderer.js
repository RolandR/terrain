var ThreeRenderer = function(){
	
	var waveBumpMap =  THREE.ImageUtils.loadTexture("./waveBumpMap.png", {}, function(){});
	waveBumpMap.wrapS = THREE.RepeatWrapping;
	waveBumpMap.wrapT = THREE.RepeatWrapping;
	waveBumpMap.repeat.set( 10, 10 );
	waveBumpMap.needsUpdate = true;
	
	var clock = new THREE.Clock(true);
	
	var rendererContainer = document.getElementById("canvasContainer");
	var skyColor = 0xAACCFF;
	
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, rendererContainer.clientWidth/rendererContainer.clientHeight, 0.1, 10000 );

	var renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(skyColor);
	
	camera.up.set( 0, 0, 1 );
	
	var controls = new THREE.OrbitControls(camera, renderer.domElement); 
	controls.target.set(0, 0, 0);
	controls.maxDistance = 50;
	controls.minDistance = 0;
	controls.update();
		
	scene.fog = new THREE.Fog(skyColor, 0, 60);
	
	var plane;
	
	renderer.setSize(rendererContainer.clientWidth, rendererContainer.clientHeight);
	rendererContainer.appendChild(renderer.domElement);
	
	var ambientLight = new THREE.AmbientLight( 0x666666 ); // soft white light
	scene.add( ambientLight );	
	
	var light = new THREE.SpotLight( 0xFFFFCC, 2 );
	light.position.set(-150, 150 , 100);
	scene.add(light);
	

	camera.position.x = 0;
	camera.position.y = -30;
	camera.position.z = 12;
	
	camera.rotation.x = 0;
	camera.rotation.y = 0;
	camera.rotation.z = 0;
	
	window.onresize = resize;
	function resize(){
		if(renderer){
			renderer.setSize(rendererContainer.clientWidth, rendererContainer.clientHeight);
			camera.aspect = rendererContainer.clientWidth/rendererContainer.clientHeight;
			camera.updateProjectionMatrix();
		}
	}
	
	function buildMesh(terrain){
	
		var ySize = terrain.length;
		var xSize = terrain[0].length;
		
		var ratio = ySize / xSize;
		
		var geometry = new THREE.PlaneGeometry(60, 60 * ratio, xSize - 1, ySize - 1);
		
		for (var i = 0, l = geometry.vertices.length; i < l; i++) {
			var y = Math.floor(i / xSize);
			var x = i % xSize;
			
			var height = terrain[y][x].getHeight();
			//if(terrain[y][x].isWater()){
			//	height = 0;
			//}
			geometry.vertices[i].z = height * 0.015;
		}
		
		var texture = new THREE.Texture(document.getElementById("terrainPreRenderCanvas"));
		//texture.magFilter = THREE.NearestFilter;
		texture.needsUpdate = true;
		
		var material = new THREE.MeshLambertMaterial({
			map: texture
		});		
		
		plane = new THREE.Mesh(geometry, material);
		plane.material.side = THREE.DoubleSide;
		
		
		scene.add(plane);
		
		var waterGeometry = new THREE.PlaneGeometry(60, 60 * ratio, 1, 1);
		var waterMaterial = new THREE.MeshPhongMaterial({
			 color: 0x003355
			,ambient: 0x447799
			,emissive: 0x001122
			,opacity: 0.7
			,transparent: true
			,side: THREE.DoubleSide
			,shininess: 140
			,bumpMap: waveBumpMap
			,bumpScale: 0.05
		});	
		water = new THREE.Mesh(waterGeometry, waterMaterial);	
		scene.add(water);		
		
		//var axes = new THREE.AxisHelper(200);
		//scene.add(axes);

		render();
	}

	var render = function () {
		requestAnimationFrame(render);
		
		//waveBumpMap.offset.x = clock.elapsedTime;
		
		controls.update();

		renderer.render(scene, camera);
	};
	
	return {
		buildMesh: buildMesh
	};
}








