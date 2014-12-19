var TextGen = new function(){
	var canvas = document.getElementById("textCanvas");
	var context = canvas.getContext("2d");
	context.font = "20px Arial";
	context.fillStyle = 'rgb(0, 0, 0)';
	context.fillText("Hello!", 0, canvas.height);
}
