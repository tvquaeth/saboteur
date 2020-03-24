var Board = require('../server/board');
var Deck = require('../server/deck');
var JobManager = require('../server/job-manager');
var Player = require('../server/player');

var GameManager = function(sockets, name, playerList) {
  var gameRules = require('./decks/standard-rules')[playerList.length - 1];

  this.name = name;
  this.deck = new Deck();
  this.jobManager = new JobManager();
  this.handSize = gameRules.hand;

  this.players = [];
  initializePlayers(this, sockets, playerList);
  this.currentPlayerIndex = 0;  // Player 1 goes first

  this.board.reset();
  this.deck.reset();
  this.jobManager.makeJobStack(gameRules.saboteurs, gameRules.miners);
};

// Helper method
var initializePlayers = function(self, sockets, playerList) {
  playerList.forEach(function(playerId, index) {
    if (index === 0) {
      self.board = new Board(sockets.sockets[playerId]);
    } else {
      var player = new Player(sockets.sockets[playerId]);
      self.players.push(player);
    }
  });
};

// Shuffle all cards
GameManager.prototype.shuffle = function() {
  this.deck.shuffle();
  this.jobManager.shuffle();
};

GameManager.prototype.start = function() {
  // deal jobs, then cards
  var self = this;
  this.players.forEach(function(player) {
    player.setJob(self.jobManager.deal());
    player.addToHand(self.deck.deal(self.handSize));
  })
};

GameManager.prototype.playCard = function(card, data) {
  console.log('Playing:', card, '('+data.type+')');
  if (data.type == 'play') {
    return this.board.placeCard(data.y, data.x, card, data.rotated);
  } else if (data.type == 'play-map') {
    this.getCurrentPlayer().socket.emit('reveal-goal', {card: card});
    return true;
  } else if (data.type == 'play-action') {
    var applyCard = this.players[data.target].applyCard(card)
    console.log('Done Applying Returned: ' + applyCard);
    
    // sends info back to blocked/free player
    if (applyCard === 'blocked') {
      this.players[data.target].socket.emit('blocked', {card: card});
    } else if (applyCard === 'freed') {
      this.players[data.target].socket.emit('freed', {card: card});
    }
    
    return applyCard;
  } else if (data.type == 'play-avalanche') {
		return this.board.removeCard(data.y, data.x);
	} else {
		return false;
	}
}

GameManager.prototype.checkForWinner = function() {
  return this.board.hasWinner();
};

GameManager.prototype.eachPlayer = function(callback) {
  var self = this;
  this.players.forEach(function(player, index) {
    callback.call(self, player, index, self);
  });
};

GameManager.prototype.getCurrentPlayer = function() {
  return this.players[this.currentPlayerIndex];
};

GameManager.prototype.getPlayer = function(id) {
  var result = null;
  this.players.forEach(function(player, index) {
    if (player.socket.id === id) {
      result = player;
    }
  });
  return result;
}

GameManager.prototype.startPlayerTurn = function() {
		this.getCurrentPlayer().socket.emit('start turn', "start player turn");
};

GameManager.prototype.nextPlayer = function(){
	this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
	this.startPlayerTurn();
};

module.exports = GameManager;