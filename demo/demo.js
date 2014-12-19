var terrainInterval = setInterval(function(){TerrainGen.generateNew(Math.random(), 1, 9);}, 3000);

setTimeout(function(){clearInterval(terrainInterval)}, 13000);
