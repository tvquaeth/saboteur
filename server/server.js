var static = require('node-static');
var Game = require('./game').Game;

// socket.emit('request', /* */); // emit an event to the socket
// io.emit('broadcast', /* */); // emit an event to all connected sockets
// socket.on('reply', function(){ /* */ }); // listen to the event

// Server module
var Server = function() {
  var self = {
    games: {},
    
    listen: function() {
		
      console.log('Creating server...');
      
			var express = require('express');
			var app = express();
      var server = require('http').Server(app);
      var io = require('socket.io')(server);
      self.io = io;
      
      server.listen(8080);
      //io.set('log level', 1);	// Debug
			app.use(express.static('client'));
			
			app.get('/', function (req, res) {
				res.sendFile('index.html', {root: 'client'});
			});
			app.get('/board', function (req, res) {
				res.sendFile('index.html', {root: 'client'});
			});
      
      io.on('connection', (socket) => {
				console.log('Connection established with ' + socket.id);
				socket.emit('identity', socket.id);
				
				socket.on('create', self.handlers.createGame(socket));
        socket.on('join', self.handlers.joinGame(socket));
        socket.on('leave', self.handlers.leaveGame(socket));
        socket.on('start', self.handlers.startGame(socket));
        socket.on('board-action', self.handlers.boardAction(socket));
        socket.on('card-action', self.handlers.cardAction(socket));
        socket.on('player-action', self.handlers.playerAction(socket));
				socket.on('disconnect', self.handlers.disconnect(socket));
				
				socket.on('message', function(message) {
					if (socket.game) {
						console.log('[' + socket.game + '] Message: ' + message);
						socket.to(socket.game).send(message);
					} else {
						console.log('Message: ' + message);
						//socket.broadcast.send(message);	// TODO remove this
					}
        });
				
			});
			
		},

    handlers: {

      boardAction: (socket) => {
        return (data) => {
					console.log('BOARD ACTION', data);
					var game = self.games[socket.game];
					// console.log(data);
					
					if (game) {
						if (data.type === 'play') {
							// place card on the board if not valid then tell board to blink red
							 game.play(socket, data.card, {type: data.type, x: data.position.column, y: data.position.row, rotated: data.position.rotated});
						}
						if (data.type === 'play-action') {
							// TODO: get board to send the target player's number
							game.play(socket, data.card, {type: data.type, target: data.target});
						}
						if (data.type === 'play-map') {
							// send current player the selected card
							game.play(socket, data.card, {type: data.type});
						}
						if (data.type === 'play-avalanche') {
							game.play(socket, 'avalanche', {type: data.type, x: data.position.column, y: data.position.row});
						}
					}
        };
      },
      
      cardAction: (socket, callback) => {
        return (data) => {
					var game = self.games[socket.game];
					if (game) {  
						// sending to host
						game.host.emit('card-action', {type: data.type, cardType: data.cardType});
					}
        }
      },
      
      playerAction: (socket, callback) => {
        return (data) => {
					console.log('\n-------------------');
					console.log('PLAYER ACTION', data);
					console.log('by', socket.id);
					var game = self.games[socket.game];
					if (game) {  
						// sending to host
						if (data.type == 'preview'){
							if (data.cardType == 'path'){
								game.host.emit('player-action', {card: data.card, type: data.type});
							} 
							if (data.cardType == 'action') {
								// get all the players and their blocks on them and display them on the board
								// for each player emit their block cards to the board, then tell the board to update the view with the selected card.
								console.log('SERVER.JS - Emitting player block cards');
								for (var i=0; i < game.gameManager.players.length; i++) {
									game.host.emit('player-block-status', {playerNumber: i, isBlocked: game.gameManager.players[i].isBlocked(), blocks: game.gameManager.players[i].getBlocks()});
								}
								game.host.emit('player-action-card', {card: data.card, currentPlayer: game.gameManager.currentPlayerIndex});
							}
							if (data.cardType == 'map') {
								// send server goal positions that are not flipped
								// emit coordinates of goals to board in array
								console.log('SERVER.JS - Player played a map card');
								game.host.emit('map-card', {card: data.card, location: game.gameManager.board.goalLocations});
							}
							if (data.cardType == 'avalanche') {
								console.log('SERVER.JS - Player played a avalanche card');
								game.host.emit('avalanche-card', {card: data.card, location: game.gameManager.board.startLocation});
							}
						}
							
						if (data.type == 'back') {
							game.host.emit('player-action', {type: data.type, cardType: data.cardType});
						}
						
						// if is submitted, then trigger turn ending event (deal new card and move to next player)
						if (data.type == 'submit') {
							game.host.emit('player-action', {type: data.type, cardType: data.cardType});
						};
						
						if (data.type == 'discard') {
							game.play(socket, 'discard-card', {type: data.type, cardType: data.cardType});              }
					}

        }
      },
      
      createGame: (socket, callback) => {
        return () => {
          (self.handlers.leaveGame(socket, function() {
            var game = new Game(self.io.sockets, socket);
						socket.game = game.name;
						self.games[game.name] = game;
						console.log('Device created game ' + game.name);
						game.join(socket);
						
						if (callback) callback.call(self);
          }))();
        }
      },
      
      joinGame: (socket, callback) => {
        return (id) => {
          id = id.trim().toLowerCase();
          var game = self.games[id];
          if (!game) {
            console.log('Device tried to join non-existing game ' + id);
            socket.emit('client-err', {code: 404, message: 'Failed to join game ' + id});
          } else if (game.players[game.playerLimit]) {
            console.log('Device attempted to join but game is full ' + id);
            socket.emit('game-full', 'Game is Full');
            socket.emit('client-err', {code: 404, message: 'Failed to join game ' + id});
          } else {
            (self.handlers.leaveGame(socket, function() {
							socket.game = id;
							game.join(socket);
              if (callback) callback.call(self);
            }))();	// Call leave game
          }
        }
      },
      
      startGame: (socket, callback) => {
        return (id) => {
					var game = self.games[socket.game];
					if (game) {  
						game.start(socket);
						console.log('Game ' + socket.game + ' has started');
					} else {
						console.log('Device tried to start non-existing game ' + id);
						socket.emit('client-err', {code: 404, message: 'Failed to join game ' + id});
					}
					if (callback) callback.call(self);
        }
      }, 
      
      leaveGame: (socket, callback) => {
        return () => {
          // TODO check if in game
					if (socket.game) {
						socket.game = null;
						var game = self.games[socket.game];
						if (game) {
							game.leave(socket); 
							console.log('Device left game ' + socket.game);
							
							if (game.players.length === 0) {
								delete self.games[socket.game];
							}
						}
					}
					if (callback) callback.call(self);
        }
      },
      
      disconnect: (socket) => {
        return () => {
					if (socket.game) {
						self.games[socket.game].leave(socket);
						console.log('client in game',socket.game,'disconnected',socket.id);
					} else {
						console.log('client disconnected',socket.id);
					}
			};
      },
			
    }
		
  };
  
  return self;
	
};

module.exports = Server;
