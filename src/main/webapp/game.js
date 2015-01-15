﻿﻿var speed = 10;
var actions = [];
var executedLine = -1;7
var inExecution = false;

var commands = [];
//            ["Nom de la commande", "code de la commande", suivi d'un bloque}    [LINE] dans la commande sera remplacé par la ligne sur laquelle ce situe l'instruction

commands.push(["Afficher un message", "alert([LINE]);", false]);
commands.push(["Aller a gauche", "player.moveToTile(player.tileX()-1, player.tileY());", false]);
commands.push(["Aller a droite", "player.moveToTile(player.tileX()+1, player.tileY());", false]);
commands.push(["Aller en bas", "player.moveToTile(player.tileX(), player.tileY()+1);", false]);
commands.push(["Aller en haut", "player.moveToTile(player.tileX(), player.tileY()-1);", false]);
commands.push(["Répeter 5 fois", "for (var i[LINE] = 0; i[LINE]  < 5; ++i[LINE])", true]);

/*************************************
				MAP
**************************************/
function Map(game, tiles, width, height) {
	this.game = game;
	this.tiles = tiles;
	this.width = width;
	this.height = height;
	this.tile_size = (width/tiles.length);
	
	var tilesColors = ["#EEEEEE", "#00FF00", "#EEEEEE", "#FFFF00"]
	
	this.render = function render(context) {
		for (var xx = 0; xx < tiles.length; ++xx) {
			for (var yy = 0; yy < tiles[0].length; ++yy) {
				var id = tiles[yy][xx];
				context.fillStyle = "#EEEEEE";
				if (id < tilesColors.length) {
					context.fillStyle = tilesColors[id];
				}
				
				context.fillRect(xx*this.tile_size, yy*this.tile_size, this.tile_size, this.tile_size);
				context.strokeRect(xx*this.tile_size, yy*this.tile_size, this.tile_size, this.tile_size);
			}
		}
	}

	this.update = function update(delta) {

	}
}



/*************************************
			GRAPHICAL PLAYER
**************************************/
function GraphicalPlayer(game, x, y) {
	this.x = x;
	this.y = y;
	this.game = game;

	var goToX = x;
	var goToY = y;
	var moving = false;

	this.render = function render(context) {
		context.beginPath();
		context.arc(this.x+this.game.map.tile_size/2, this.y+this.game.map.tile_size/2, this.game.map.tile_size/2 - 4,0 , 2*Math.PI);
		context.fillStyle = "#FF0000";
		context.fill();
	}

	this.update = function update(delta) {
		if (Math.abs(goToX - this.x) > 2) {
			var xsign = 1;
			if (goToX - this.x < 0) xsign = -1;

			this.x += 10 * delta * speed * xsign;
		} else {
			this.x = goToX;
			if (Math.abs(goToY - this.y) > 2) {
				var ysign = 1;
				if (goToY - this.y < 0) ysign = -1;

				this.y += 10 * delta * speed * ysign;
			} else {
				this.y = goToY;
				moving = false;
			}
		}
	}

	this.moveTo = function moveTo(x, y) {
		moving = true;
		goToX = x;
		goToY = y;
	}

	this.moveToTile = function moveToTile(x, y) {
		this.moveTo(x * this.game.map.tile_size, y * this.game.map.tile_size);
	}

	this.tileX = function tileX() {
		return Math.round(this.x/this.game.map.tile_size);
	}

	this.tileY = function tileY() {
		return Math.round(this.y/this.game.map.tile_size);
	}

	this.isDoingSomething = function isDoingSomething() {
		return moving;
	}
}

/*************************************
			COLLISION PLAYER
**************************************/
function CollisionPlayer(game, x, y) {
	this.x = x;
	this.y = y;
	this.game = game;
	this.events = [];
	var locked = false;

	this.moveTo = function moveTo(x, y) {
		if (locked) return;
		this.x = x;
		this.y = y;
	}

	this.moveToTile = function moveToTile(x, y) {
		if (locked) return;
		if (x >= 0 && y >= 0 && x < this.game.map.tiles[0].length && y < this.game.map.tiles.length && this.game.map.tiles[y][x] != 1) {
			this.moveTo(x * this.game.map.tile_size, y * this.game.map.tile_size);
			this.events.push(["player.moveToTile(" + x + ", " + y + ");", executedLine]);
			return true;
		}
		this.events.push(["alert(\"Collision avec un mur lors du deplacement (ligne " + (executedLine+1) + ")\");", executedLine]);
		locked = true;
		return false;
	}

	this.tileX = function tileX() {
		return Math.round(this.x/this.game.map.tile_size);
	}

	this.tileY = function tileY() {
		return Math.round(this.y/this.game.map.tile_size);
	}
}

/*************************************
				GAME
**************************************/
function Game(width, height) {
	this.width = width;
	this.height = height;
	this.tiles = [[1,2,0,0,0],
	     	      [1,1,1,0,0],
                  [1,1,1,0,0],
                  [1,0,0,0,0],
				  [1,3,1,1,1]];


	this.map = new Map(this, this.tiles, this.width, this.height);
	this.player = new GraphicalPlayer(this, 0, 0);
	reset(this.map, this.player);

	this.render = function render() {
		var c = document.getElementById("enigme");
		var ctx = c.getContext("2d");
		
		this.map.render(ctx);
		this.player.render(ctx);
	}

	this.update = function update(delta) {
		if (actions.length > 0 && !this.player.isDoingSomething()) {
			var arr = actions.shift();
			var player = this.player;
			eval(arr[0]);
			commandBox.highlightedLine = arr[1];
			commandBox.render();
		}
		if (inExecution && actions.length == 0 && !this.player.isDoingSomething()) {
			inExecution = false;
			commandBox.render();
		}
		this.map.update(delta);
		this.player.update(delta);
		this.render();
	}
}

var game = new Game(200, 200);

var time;
function mainLoop() {
	requestAnimationFrame(mainLoop);
	var now = new Date().getTime(),
	dt = (now - (time || now))/1000;

	time = now;
	game.update(dt);
}

function addToLog(msg) {
	
	$('#log').scrollTop($('#log')[0].scrollHeight);
	document.getElementById("log").value += msg + "\n";
}

function reset(map, player) {
	actions = [];
	// Cherche la position initiale du joueur
	
	var initx = 0;
	var inity = 0;
	
	for (var xx = 0; xx < map.tiles.length; ++xx) {
		for (var yy = 0; yy < map.tiles[0].length; ++yy) {
			if (map.tiles[yy][xx] == 2) {
				initx = xx;
				inity = yy;
				break;
			}
		}
	}
	

	player.x = initx * map.tile_size;
	player.y = inity * map.tile_size;
	player.moveTo(player.x, player.y);
}


function wait(ms) {
	now = new Date().getTime();
	var dt = 0;
	var time = now;
	while (dt < 0.5) {
		now = new Date().getTime(),
		dt = (now - (time || now))/1000;
	}
}

var a_canvas = document.getElementById("commands");
var context = a_canvas.getContext("2d");




// Creer les boutons de commandes
var ul = document.getElementById("commandsBtns");
for (var i = 0; i < commands.length; ++i) {
	var li = document.createElement("li");
	li.setAttribute("style", "list-style: none ; margin-bottom: 10px");
	var cmdBtn = document.createElement("input");
	cmdBtn.setAttribute("type", "button");
	cmdBtn.setAttribute("class", "btn btn-primary");
	cmdBtn.setAttribute("style", "width: 200px");
	cmdBtn.setAttribute("value", commands[i][0]);
	cmdBtn.setAttribute("onclick", "commandBox.addLine(" + i + ");");
	li.appendChild(cmdBtn);
	ul.appendChild(li);
}



/*************************************
				COMMANDBOX
**************************************/

var width = 320;
var height = 240;
function CommandBox(commands, width, height) {
	var commands = commands;
	var width = width;
	var height = height;
	var lineSize = 20;
	var selectedLine = 0;
	var mouseOverLine = -1;
	var code = [];
	var fontSize = 16;
	var font = "Verdana";
	var maxNbLine = 10;
	
	this.highlightedLine = -1;
	
	var canvas = document.getElementById("commands");
	canvas.height = maxNbLine*lineSize;
	var ctx = canvas.getContext("2d");
	var self = this;
	canvas.addEventListener("mousedown", doMouseDown, false);
	canvas.addEventListener('mousemove', doMouseMove, false);
	canvas.addEventListener('mouseout', doMouseOut, false);
	
	this.render = function render() {
		
		var nbLines = Math.floor(height/lineSize);
		var indentation = 25;
		
		for (var i = 0; i < nbLines; ++i) {
			ctx.fillStyle = i%2 == 0 ? "#EEEEEE" : "#DDDDDD";
			if (!inExecution && i == mouseOverLine) {ctx.fillStyle ="#FBFBFB";}
			if (!inExecution && i == selectedLine) {ctx.fillStyle ="#8888FF";}
			if (inExecution && i == this.highlightedLine) {ctx.fillStyle ="#FF8888";}
			ctx.fillRect(0, i*lineSize, width, lineSize);
			if (i < code.length) {
				ctx.font = fontSize + "px " + font;
				ctx.fillStyle ="#000000";
				var text = "";
				var indentInc = 0;
				var drawDeleteIcon = true;
				if (code[i] == -1) {
					text = "}";
					indentation -= 20;
					drawDeleteIcon = false;
				} else if (commands[code[i]][2]) {
					text = commands[code[i]][0] + " {";
					indentInc = 20;
				} else {
					text = commands[code[i]][0];
				}
				ctx.fillText(text, indentation, i*lineSize + fontSize);
				
				if (!inExecution && i == mouseOverLine) {
					ctx.font = fontSize + "px " + font;
					if (drawDeleteIcon) {
						ctx.fillStyle ="#FF0000";
						ctx.fillText("X", 5, i*lineSize + fontSize);
					}
				}
				indentation += indentInc;
			}
		}
	}
	
	this.addLine = function addLine(commandId) {
		if (inExecution) return;
		if (code.length+1 > maxNbLine || (commands[commandId][2] && code.length+2 > maxNbLine)) {
			alert("Vous ne pouvez pas dépasser "+maxNbLine+" lignes");
			return;
		}
		code.splice(selectedLine+1, 0, commandId);
		if (code.length != 1) {selectedLine++;}
		if (commands[commandId][2]) {
			code.splice(selectedLine+1, 0, -1);
		}
		this.render();
	}
	
	this.removeLine = function removeLine(line) {
		if (code[line] == -1 || inExecution) return;
		if (code[line] >= 0 && commands[code[line]][2]) {
			indent = 0;
			for (var i = line; i < code.length; ++i) {
				if (code[i] == -1) {
					indent--;
				} else {
					if (commands[code[i]][2]) indent++;
				}
				if (code[i] == -1 && indent == 0) {
					code.splice(i, 1);
					break;
				}
			}
			code.splice(line, 1);
			
		} else {
			code.splice(line, 1);
		}
		selectedLine--;
		if (code.length == 0) selectedLine = 0;
		self.render();
	}

	this.getJSCode = function getJSCode() {
		var res = "";
		for (var i = 0; i < code.length; ++i) {
			if (code[i] == -1) {
				res += "}";
			} else {
				//res += "function repeat_line"+i+"() {\n"
				//res += "if (!game.player.isDoingSomething) {\n"
				res += "executedLine = " + i +";\n"
				res += commands[code[i]][1].replace(new RegExp("\\[LINE\\]", 'g'), i);
				//res += "\n}else {\n";
				//res += "setTimeout(repeat_line"+i+", 500);\n"
				//res += "return;\n"
				//res += "}\n"
				//res += "}\n"
				if (commands[code[i]][2]) {res += " {";}
				//res += "\ngame.render();"
				//res += "\nwait(1000);"
			}
			res += "\n";
		}
		return res;
	}
	
	function doMouseDown(e) {
		var mouseX, mouseY;
		// Parceque change selon les navigateurs
		if (e.offsetX) {
			mouseX = e.offsetX;
			mouseY = e.offsetY;
		} else if (e.layerX) {
			mouseX = e.layerX;
			mouseY = e.layerY;
		}
		
		var clickedLine = Math.floor(mouseY / lineSize);
		if (code.length > clickedLine) {
			if (mouseX < 18) {
				self.removeLine(clickedLine);
			} else {
				selectedLine = clickedLine;
			}
			self.render();
		}
	}
	
	function doMouseMove(e) {
		var mouseX, mouseY;
		// Parceque change selon les navigateurs
		if (e.offsetX) {
			mouseX = e.offsetX;
			mouseY = e.offsetY;
		} else if (e.layerX) {
			mouseX = e.layerX;
			mouseY = e.layerY;
		}
		
		var overedLine = Math.floor(mouseY / lineSize);
		if (code.length > overedLine) {
			mouseOverLine = overedLine;
		}  else {
			mouseOverLine = -1;
		}
		self.render();
	}
	
	function doMouseOut(e) {
		mouseOverLine = -1;
		self.render();
	}

}

var commandBox = new CommandBox(commands, width, height);
commandBox.render();

mainLoop();

function executeAlgo() {
	reset(this.game.map, this.game.player);
	inExecution = true;
	actions = [];
	executedLine = -1;
	var player = new CollisionPlayer(game, game.player.x, game.player.y);
	eval(commandBox.getJSCode());
	actions = player.events;
}