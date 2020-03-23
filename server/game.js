var Names = require('./names');
var GameManager = require('./game-manager');

var Game = function(sockets, hostSocket) {
  this.sockets = sockets;
  this.host = hostSocket;
  //this.name = Math.random().toString(20).substr(2, 5);
  var rand1 = Math.floor(Math.random() * Names.colors.length);
  var rand2 = Math.floor(Math.random() * Names.adjectives.length);
  var rand3 = Math.floor(Math.random() * Names.nouns.length);
  this.name = Names.adjectives[rand2] + ' ' + Names.colors[rand1] + ' ' + Names.nouns[rand3];
  //this.name = Names.adjectives[rand3];
  this.players = [];
  this.playerLimit = 10;
  this.state = 'waiting';

};

Game.prototype.serialize = function() {
  return {
    name: this.name,
    players: this.players
  };
};

Game.prototype.join = function(socket) {
  socket.join(this.name);
  this.players.push(socket.id);
  this.sockets.to(this.name).emit('joined', {playerId: socket.id, game: this.serialize()});
};

Game.prototype.start = function(socket) {
  this.state = 'start game';
  this.gameManager = new GameManager(this.sockets, this.name, this.players);
  this.gameManager.shuffle();
  this.gameManager.start();
  console.log('game manager is ready');

  this.gameManager.eachPlayer(function(player) {
    console.log('sending to ' + player.socket.id);
    player.socket.emit('start', player.serialize());
  });

  this.gameManager.board.socket.emit('start', this.gameManager.board.serialize());
	this.gameManager.startPlayerTurn();
};

Game.prototype.play = function(socket, card, data) {
  if (this.gameManager.playCard(card, data) || card === 'discard-card' ) {
    
    var flipGoalLocation = this.gameManager.board.checkToFlipGoal(data.y, data.x, card);
    
    if (flipGoalLocation) {
      this.host.emit('flip goal', {row: flipGoalLocation.row, column: flipGoalLocation.column});
    }
    
    if (this.gameManager.checkForWinner()) {
      this.sockets.to(this.name).emit('winner', {
        winner: 'miners',
        goldCard: this.gameManater.board.gold
      });
    } else {
      // check if last card
      var saboteursWin = true;
      this.gameManager.eachPlayer(function(player) {
        if (player.hand.length > 0) {
          saboteursWin = false;
        }
      });

      if (saboteursWin) {
        this.sockets.to(this.name).emit('winner', {
          winner: 'saboteurs'
        });
      } else {
        this.gameManager.getCurrentPlayer().socket.emit('deal', {card: this.gameManager.deck.deal()});
        this.sockets.to(this.name).emit('next player', {currentPlayer: this.gameManager.getCurrentPlayer().socket.id, type: data.type});
        this.gameManager.nextPlayer();
      }
    }

  } else {
    socket.emit('client-err', data);
  }
};

Game.prototype.leave = function(socket) {
  if (socket.id === this.host) {
    this.sockets.to(this.name).emit('host left', this.serialize());
  }
  this.players.splice(this.players.indexOf(socket.id), 1)
  this.sockets.to(this.name).emit('left', {playerId: socket.id, game: this.serialize()});
  socket.leave(this.name);
}

exports.Game = Game;
