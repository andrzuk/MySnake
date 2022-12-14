const API_URL = "https://andrzej.zukowski.edu.pl/apps/snake/api/";
const STORE_LOCAL = true;

$(document).ready(function() {
	
	var canvas = document.getElementById("game-canvas");
	var ctx = canvas.getContext("2d");
	
	var gameScore = 0;
	var gameTick = 0;
	var animationReady = false;
	
	canvas.width = parseInt($("canvas#game-canvas").css("width"));
	canvas.height = parseInt($("canvas#game-canvas").css("height"));
	
	var gameArea = {
		cellSize: 15,
		cellDist: 2,
		colsCount: 60,
		rowsCount: 28,
		diamond: { x: 0, y: 0 },
		init: function() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			for (i = 0; i < this.colsCount; i++) {
				for (j = 0; j < this.rowsCount; j++) {
					paintCell(i, j, "#cde");
				}
			}
			gameScore = 0;
			animationReady = true;
			$("span#score").text(gameScore.toString());
		},
		setDiamond: function() {
			var freePlace = false;
			while (!freePlace) {
				freePlace = true;
				this.diamond.x = Math.floor(Math.random() * gameArea.colsCount);
				this.diamond.y = Math.floor(Math.random() * gameArea.rowsCount);
				for (i = 0; i < snake.length; i++) {
					if (snake.points[i].x == this.diamond.x && snake.points[i].y == this.diamond.y) {
						freePlace = false;
					}
				}
			}
			paintCell(this.diamond.x, this.diamond.y, "#0c0");
		},
		saveScore: function() {
			if (STORE_LOCAL) {
				localStorage.setItem('Snake Player Name', player.name);
				localStorage.setItem('Snake Player Score', gameScore);
				localStorage.setItem('Snake Score Saved', new Date().toISOString().split('T')[0]);
				$("div#player-caption").text(player.name + " (" + gameScore + ")");
			}
			else {
				$.post(API_URL + "store_score.php", { player: player.name, score: gameScore }, function(data, status) {
					var response = JSON.parse(data);
					player.name = response.player;
					player.score = response.score;
					$("div#player-caption").text(player.name + " (" + player.score + ")");
				});	
			}
		},
		getScores: function() {
			$('div#scores-modal').modal('show');
			$("table#scores-list tbody").empty();
			var tableHeader = '<tr><th width="10%">Pozycja</th><th width="25%">Gracz</th><th width="25%">Adres IP</th><th width="25%" style="text-align: center;">Data</th><th width="15%" style="text-align: right;">Punkty</th></tr>';
			$("table#scores-list tbody").append(tableHeader);
			if (STORE_LOCAL) {
				var playerName = localStorage.getItem('Snake Player Name');
				var gameScore = localStorage.getItem('Snake Player Score');
				var scoreSaved = localStorage.getItem('Snake Score Saved');
				var tableRow = "<tr><td>-</td><td>" + playerName + "</td><td>-</td><td class='scores-saved'>" + scoreSaved + "</td><td class='scores-score'>" + gameScore + "</td></tr>";
				$("table#scores-list tbody").append(tableRow);
			}
			else {
				$.get(API_URL + "get_scores.php", function(data, status) {
					var response = JSON.parse(data);
					jQuery.each(response, function(index, item) {
						var tableRow = "<tr><td>" + (index + 1).toString() + "</td><td>" + item.player + "</td><td>" + item.ip + "</td><td class='scores-saved'>" + item.saved + "</td><td class='scores-score'>" + item.score + "</td></tr>";
						$("table#scores-list tbody").append(tableRow);
					});
				});	
			}
		}
	};
	
	var snake = {
		x: 0,
		y: 0,
		direction: null,
		length: 0,
		growing: 3,
		mode: 0,
		speed: $("select#period").val(),
		points: null,
		init: function() {
			this.points = [];
			this.length = 10;
			this.x = Math.floor(Math.random() * (gameArea.colsCount - 2 * this.length)) + this.length;
			this.y = Math.floor(Math.random() * (gameArea.rowsCount - 2 * this.length)) + this.length;
			this.points.push({ x: this.x, y: this.y });
			var x = this.x, y = this.y;
			var directions = ['left', 'right', 'up', 'down'];
			this.direction = directions[Math.floor(Math.random() * 4)];
			this.mode = 0;
			for (i = 0; i < this.length - 1; i++) {
				if (this.direction == 'left') {
					x++;
				}
				if (this.direction == 'right') {
					x--;
				}
				if (this.direction == 'up') {
					y++;
				}
				if (this.direction == 'down') {
					y--;
				}
				this.points.push({ x: x, y: y });
			}
			for (i = 0; i < this.length; i++) {
				paintCell(this.points[i].x, this.points[i].y, "#c00");
			}
		},
		checkCollision: function() {
			for (i = 1; i < this.length; i++) {
				if (this.x == this.points[i].x && this.y == this.points[i].y) {
					return false;
				}
			}
			return true;
		},
		checkDiamondHit: function() {
			if (this.x == gameArea.diamond.x && this.y == gameArea.diamond.y) {
				return true;
			}
			return false;
		},
		growLength: function() {
			for (i = 0; i < this.growing; i++) {
				this.points.push({ x: this.points[this.length - 1].x, y: this.points[this.length - 1].y });
				this.length++;
			}
		}
	};
	
	var player = {
		name: null,
		score: 0,
		showInput: function() {
			$('div#player-modal').modal('show').on('shown.bs.modal', function() {
				$('div#player-modal input#player-name').focus().keypress(function(event) {
					if (event.keyCode == 13) {
						$('button#save-player-name').click();
					}
				});
			});
		},
		getName: function() {
			if (!this.name) {
				this.name = 'Anonymous';
			}
			this.getScore();
		},
		getScore: function() {
			if (STORE_LOCAL) {
				var playerName = localStorage.getItem('Snake Player Name') || player.name;
				var gameScore = localStorage.getItem('Snake Player Score') || player.score;
				$("div#player-caption").text(playerName + " (" + gameScore + ")");
			}
			else {
				$.post(API_URL + "get_score.php", { player: this.name }, function(data, status) {
					var response = JSON.parse(data);
					this.name = response.player;
					this.score = response.score;
					$("div#player-caption").text(this.name + " (" + this.score + ")");
				});
			}
		}	
	};
	
	function startAnimation() {
		snake.mode = 1;
		if (animationReady) {
			animationStep();
		}
	}
	
	function stopAnimation() {
		snake.mode = 0;
	}
	
	function animationStep() {
		animationReady = false;
		setTimeout(function() {
			paintCell(snake.points[snake.length - 1].x, snake.points[snake.length - 1].y, "#cde");
			if (snake.direction == 'up') {
				if (snake.y > 0) snake.y--;
				else snake.y = gameArea.rowsCount - 1;
			}
			if (snake.direction == 'down') {
				if (snake.y < gameArea.rowsCount - 1) snake.y++;
				else snake.y = 0;
			}
			if (snake.direction == 'left') {
				if (snake.x > 0) snake.x--;
				else snake.x = gameArea.colsCount - 1;
			}
			if (snake.direction == 'right') {
				if (snake.x < gameArea.colsCount - 1) snake.x++;
				else snake.x = 0;
			}
			for (i = snake.length - 1; i > 0; i--) {
				snake.points[i].x = snake.points[i - 1].x;
				snake.points[i].y = snake.points[i - 1].y;
			}
			snake.points[0].x = snake.x;
			snake.points[0].y = snake.y;
			if (snake.checkCollision()) {
				if (snake.checkDiamondHit()) {
					paintCell(snake.x, snake.y, "#600");
					gameScore += snake.growing;
					$("span#score").text(gameScore.toString());
					snake.growLength();
					gameArea.setDiamond();
				}
				else {
					paintCell(snake.x, snake.y, "#c00");
					gameTick++;
					if (gameTick % 1000 == 0) {
						gameTick = 0;
						stopAnimation();
					}
					animationReady = true;
				}
			}
			else {
				paintCell(snake.x, snake.y, "#000");
				stopAnimation();
				showExplosion();
				snake.mode = 2;
			}
			if (snake.mode == 1) {
				animationStep();
			}
		}, snake.speed);
	}
	
	function showExplosion() {
		var color_1 = "#cc0";
		var color_2 = "#e90";
		setTimeout(function() {
			paintCell(snake.x - 1, snake.y - 1, color_1);
			paintCell(snake.x, snake.y - 1, color_1);
			paintCell(snake.x + 1, snake.y - 1, color_1);
			paintCell(snake.x - 1, snake.y, color_1);
			paintCell(snake.x + 1, snake.y, color_1);
			paintCell(snake.x - 1, snake.y + 1, color_1);
			paintCell(snake.x, snake.y + 1, color_1);
			paintCell(snake.x + 1, snake.y + 1, color_1);
			setTimeout(function() {
				paintCell(snake.x - 2, snake.y - 2, color_2);
				paintCell(snake.x - 1, snake.y - 2, color_2);
				paintCell(snake.x, snake.y - 2, color_2);
				paintCell(snake.x + 1, snake.y - 2, color_2);
				paintCell(snake.x + 2, snake.y - 2, color_2);
				paintCell(snake.x - 2, snake.y - 1, color_2);
				paintCell(snake.x + 2, snake.y - 1, color_2);
				paintCell(snake.x - 2, snake.y, color_2);
				paintCell(snake.x + 2, snake.y, color_2);
				paintCell(snake.x - 2, snake.y + 1, color_2);
				paintCell(snake.x + 2, snake.y + 1, color_2);
				paintCell(snake.x - 2, snake.y + 2, color_2);
				paintCell(snake.x - 1, snake.y + 2, color_2);
				paintCell(snake.x, snake.y + 2, color_2);
				paintCell(snake.x + 1, snake.y + 2, color_2);
				paintCell(snake.x + 2, snake.y + 2, color_2);
				setTimeout(function() {
					gameArea.saveScore();
					gameArea.init();
					snake.init();
					gameArea.setDiamond();
				}, 5000);
			}, 100);
		}, 100);
	}
	
	function resetGame() {
		gameArea.init();
		snake.init();
		gameArea.setDiamond();
	}
	
	function changeDirection(direction) {
		var speedIndex = $("select#period").prop('selectedIndex');
		var speedCount = $("select#period").children('option').length;
		if (direction == 'up') {
			if (snake.direction == 'up') {
				if (speedIndex > 0) {
					speedIndex--;
					$("select#period").prop('selectedIndex', speedIndex);
					$("select#period").change();
				}
				return;
			}
			if (snake.direction == 'down') {
				if (speedIndex < speedCount - 1) {
					speedIndex++;
					$("select#period").prop('selectedIndex', speedIndex);
					$("select#period").change();
				}
				return;
			}
			snake.direction = 'up';
		}
		if (direction == 'down') {
			if (snake.direction == 'down') {
				if (speedIndex > 0) {
					speedIndex--;
					$("select#period").prop('selectedIndex', speedIndex);
					$("select#period").change();
				}
				return;
			}
			if (snake.direction == 'up') {
				if (speedIndex < speedCount - 1) {
					speedIndex++;
					$("select#period").prop('selectedIndex', speedIndex);
					$("select#period").change();
				}
				return;
			}
			snake.direction = 'down';
		}
		if (direction == 'left') {
			if (snake.direction == 'left') {
				if (speedIndex > 0) {
					speedIndex--;
					$("select#period").prop('selectedIndex', speedIndex);
					$("select#period").change();
				}
				return;
			}
			if (snake.direction == 'right') {
				if (speedIndex < speedCount - 1) {
					speedIndex++;
					$("select#period").prop('selectedIndex', speedIndex);
					$("select#period").change();
				}
				return;
			}
			snake.direction = 'left';
		}
		if (direction == 'right') {
			if (snake.direction == 'right') {
				if (speedIndex > 0) {
					speedIndex--;
					$("select#period").prop('selectedIndex', speedIndex);
					$("select#period").change();
				}
				return;
			}
			if (snake.direction == 'left') {
				if (speedIndex < speedCount - 1) {
					speedIndex++;
					$("select#period").prop('selectedIndex', speedIndex);
					$("select#period").change();
				}
				return;
			}
			snake.direction = 'right';
		}
		gameTick = 0;
	}
	
	$("button#play-start").on('click', function() {
		startAnimation();
	});
	
	$("button#play-pause").on('click', function() {
		stopAnimation();
	});
	
	$("button#move-up").on('click', function() {
		changeDirection('up');
	});
	
	$("button#move-down").on('click', function() {
		changeDirection('down');
	});
	
	$("button#move-left").on('click', function() {
		changeDirection('left');
	});
	
	$("button#move-right").on('click', function() {
		changeDirection('right');
	});
	
	$("select#period").on('change', function() {
		snake.speed = $("select#period").val();
	});
	
	$("button#save-player-name").on('click', function() {
		player.name = $("#player-name").val().trim().substring(0, 20);
		$("#player-welcome").text("Hello, " + player.name.toUpperCase() + "!");
		player.getName();
	});
	
	$("a#show-scores").on('click', function() {
		gameArea.getScores();
	});
	
	document.addEventListener('keydown', function(event) {
		/*
		event.preventDefault();
		*/
		var keyCode = event.keyCode;
		if (keyCode == 37) changeDirection('left');
		if (keyCode == 38) changeDirection('up');
		if (keyCode == 39) changeDirection('right');
		if (keyCode == 40) changeDirection('down');
		if (keyCode == 13) startAnimation();
		if (keyCode == 32) stopAnimation();
		if (keyCode == 27) resetGame();
	});
	
	function paintCell(x, y, color) {
		ctx.fillStyle = color;
		ctx.fillRect(x * gameArea.cellSize + gameArea.cellDist / 2, y * gameArea.cellSize + gameArea.cellDist / 2, gameArea.cellSize - gameArea.cellDist, gameArea.cellSize - gameArea.cellDist);
	}
	
	gameArea.init();
	snake.init();
	gameArea.setDiamond();
	player.showInput();
  
});

