var ThreeRenderer = function(){
	
	var Init = new function(){
		var loadStatus = {
			 waveBumpMap: false
			,skyTexture: false
			,noiseBumpMap: false
			,heightmap: false
			,terrainTexture: false
			,terrain: false
		};
		var terrain = null;
		
		function tryInit(who, newTerrain){
			loadStatus[who] = true;
			
			document.getElementById("loadingStatus").innerHTML = "Loaded "+who+"<br />" + document.getElementById("loadingStatus").innerHTML;
			
			if(newTerrain){
				terrain = newTerrain;
			}
			
			var hasFalses = false;
			for(var i in loadStatus){
				if(!loadStatus[i]){
					hasFalses = true;
					break;
				}
			}
			
			if(!hasFalses){
				document.getElementById("loadingStatus").innerHTML = "";
				buildMesh(terrain);
			}
		}
		
		return {
			tryInit: tryInit
		};
	}
	
	var waveBumpMap =  THREE.ImageUtils.loadTexture("./waveBumpMap.png", {}, function(){Init.tryInit("waveBumpMap");}.bind(this));
	waveBumpMap.wrapS = THREE.RepeatWrapping;
	waveBumpMap.wrapT = THREE.RepeatWrapping;
	waveBumpMap.repeat.set(30, 30);
	waveBumpMap.needsUpdate = true;
	
	var skyTexture =  THREE.ImageUtils.loadTexture("./sky.jpg", {}, function(){Init.tryInit("skyTexture");}.bind(this));
	skyTexture.wrapS = THREE.RepeatWrapping;
	skyTexture.wrapT = THREE.RepeatWrapping;
	skyTexture.repeat.set(10, 10);
	skyTexture.needsUpdate = true;
	
	var noiseBumpMap =  THREE.ImageUtils.loadTexture("./noise.jpg", {}, function(){Init.tryInit("noiseBumpMap");}.bind(this));
	noiseBumpMap.needsUpdate = true;
	
	var rendererContainer = document.getElementById("canvasContainer");
	var skyColor = 0x000006;
	
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, rendererContainer.clientWidth/rendererContainer.clientHeight, 0.1, 10000 );

	var renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setClearColor(skyColor);
	
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	
	var controls = new THREE.OrbitControls(camera, renderer.domElement); 
	controls.target.set(0, 0, 0);
	controls.maxDistance = 50;
	controls.minDistance = 0;
	controls.update();
	
	renderer.setSize(rendererContainer.clientWidth, rendererContainer.clientHeight);
	rendererContainer.appendChild(renderer.domElement);
	
	var ambientLight = new THREE.AmbientLight( 0x111119 );
	scene.add( ambientLight );	
	
	var light = new THREE.SpotLight( 0xFFFFCC, 1 );
	light.position.set(-400, 400 , 100);
	light.castShadow = true;
	light.shadowDarkness = 1;	
	scene.add(light);
	

	camera.position.x = -15;
	camera.position.y = 0;
	camera.position.z = 25;
	
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
		
		var geometry = new THREE.SphereGeometry(15, xSize - 1, ySize - 1);
		
		for (var i = 0, l = geometry.vertices.length; i < l; i++) {
			var y = Math.floor(i / xSize);
			var x = i % xSize;
			
			var height = terrain[y][x].getHeight() * 0.015;

			
			
			geometry.vertices[i].x += (geometry.vertices[i].x *= height) * 0.01;
			geometry.vertices[i].y += (geometry.vertices[i].y *= height) * 0.01;
			geometry.vertices[i].z += (geometry.vertices[i].z *= height) * 0.01;
		}
		
		var texture = new THREE.Texture(document.getElementById("terrainTextureCanvas"));
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		//texture.magFilter = THREE.NearestFilter;
		texture.needsUpdate = true;
		
		var heightmap = new THREE.Texture(document.getElementById("heightmapCanvas"));
		heightmap.wrapS = THREE.RepeatWrapping;
		heightmap.wrapT = THREE.RepeatWrapping;
		heightmap.needsUpdate = true;
		
		var material = new THREE.MeshPhongMaterial({
			 map: texture
			,bumpMap: noiseBumpMap
			,bumpScale: 0.005
			,shininess: 10
		});		
		
		terrainSphere = new THREE.Mesh(geometry, material);
		terrainSphere.material.side = THREE.DoubleSide;
		terrainSphere.castShadow = true;
		scene.add(terrainSphere);

		var waterGeometry = new THREE.SphereGeometry(15, xSize - 1, ySize - 1);
		var waterMaterial = new THREE.MeshPhongMaterial({
			 color: 0x004466
			//,ambient: 0x447799
			//,emissive: 0x001122
			,emissive: 0x000000
			,ambient: 0x555555
			,opacity: 0.8
			,transparent: true
			,side: THREE.FrontSide
			,shininess: 200
			,bumpMap: waveBumpMap
			,bumpScale: 0.05
		});
		waterSphere = new THREE.Mesh(waterGeometry, waterMaterial);	
		scene.add(waterSphere);
		
		var skyboxGeometry = new THREE.SphereGeometry(500, 10, 10);
		var skyboxMaterial = new THREE.MeshBasicMaterial({
			 map: skyTexture
			,side: THREE.BackSide
		});	
		skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);	
		scene.add(skybox);

		buildAtmosphere(10);

		function buildAtmosphere(layerCount){
			var lowest = 0.2;
			var highest = 1.2;

			var atmosphereLayers = [];

			var geo;
			var mat;
			for(var i = 0; i <= layerCount; i++){

				var radius = (highest-lowest) / layerCount * i + 15 + lowest;
				
				geo = new THREE.SphereGeometry(radius, 50, 50);
				mat = [
					new THREE.MeshPhongMaterial({
						emissive: 0xAACCFF
						,ambient: 0x335599
						,color: 0x000000
						,opacity: 0.05
						,transparent: true
						,side: THREE.BackSide
					})
					,new THREE.MeshPhongMaterial({
						emissive: 0xAACCFF
						,ambient: 0x335599
						,color: 0x000000
						,opacity: 0.02
						,transparent: true
						,side: THREE.FrontSide
					})
				]

				atmosphereLayers.push(new THREE.Mesh(geo, new THREE.MeshFaceMaterial(mat)));
				atmosphereLayers[i].receiveShadow = true;
				scene.add(atmosphereLayers[i]);
			}
		}

		render();
	}

	var render = function () {
		requestAnimationFrame(render);
		
		controls.update();

		terrainSphere.rotation.y += 0.0015;
		waterSphere.rotation.y += 0.0015;
		
		renderer.render(scene, camera);
	};

	return {
		 buildMesh: buildMesh
		,Init: Init
	};
}








