var HandView = function(app) {
  console.log('hand view');
  var playerStatus = 'free';
	var playerColour = '';
	var handView = null;
	
	$(document).ready(() => {
		handView = $("#hand-view");
		console.log(handView.find('#hand-game'));
		handView.find('#hand-game').attr('page', 'hand-lobby-controller');
		handView.find('#hand-join-game').off().on('click', function(event) {
			console.log('id: ' + app.player.id);
			app.socket.emit('join', handView.find('#hand-input-code').val());
		});
		handView.find('.ready-button').off().on('click', function(event) {
			if (app.game.playerCount >= 3) {
				handView.find('.ready-button').hide();
				console.log('triggered start game');
				app.socket.emit('start');
			}
		});

		handView.find('#hand-input-code').keydown(function(event) {
			if (event.keyCode === 13) {
				console.log('pressed enter');
				handView.find('#hand-join-game').click();
			}
		});

  
		// Joining Screens
		app.socket.on('joined', function (data) {  
			console.log(data);
			app.game.playerCount = data.game.players.length - 1;
			console.log("num players: " + app.game.playerCount);
			playerColour = playerColours[app.game.playerCount];
			
			
			if (app.player.id == data.playerId) {
				handView.find('#hand-game').attr('page', 'hand-join-mobile');
				handView.find('body').addClass(playerColour);
				handView.find('body').addClass('current-player');
				
				handView.find('.player-text').append(app.game.playerCount);
				if (app.game.playerCount > 1) {
					handView.find('.ready-button').hide();
				} else {
					app.player.isHost = true;
				}
			}
			if (app.player.isHost && app.game.playerCount >= 3) {
				handView.find('.ready-button').text('Start Game');
			}
		});
		
		app.socket.on('game-full', function(data) {
				console.log(data);
		});
		
		// When Clicking on DPad
		var bindDPad = function() {
			handView.find('.left-button').off().on('click', function() {
				app.socket.emit('card-action', {type: 'left', cardType: typeOfCard(handView.find('.selected-card').attr('card')) });
			});
			handView.find('.right-button').off().on('click', function() {
				app.socket.emit('card-action', {type: 'right', cardType: typeOfCard(handView.find('.selected-card').attr('card')) });
			});
			handView.find('.up-button').off().on('click', function() {
				app.socket.emit('card-action', {type: 'up', cardType: typeOfCard(handView.find('.selected-card').attr('card')) });
			});
			handView.find('.down-button').off().on('click', function() {
				app.socket.emit('card-action', {type: 'down', cardType: typeOfCard(handView.find('.selected-card').attr('card')) });
			});  
		}
		
		var unBindDPad = function() {
			handView.find('.left-button').unbind('click');
			handView.find('.right-button').unbind('click');
			handView.find('.up-button').unbind('click');
			handView.find('.down-button').unbind('click');
		}
		
		// so that you can't click anything
		var unBindCardClick = function() {
			handView.find('.card').unbind('click');
		};
		
		// handling what happens when you click card from hand view
		var bindCardClick = function() {
			unBindCardClick();
					 
			handView.find('.card').off().on('click', function() {
				
				var card = handView.find(this).attr('card');
				var cardType = typeOfCard(handView.find(this).attr('card'));
				
			 
					handView.find('.play-card > div').removeAttr('card').removeClass();
					handView.find('.play-card > div').attr('card', handView.find(this).attr('card')).addClass('selected-card');
					
					// disables rotate if not a map card
					if (handView.find('.selected-card[card*=connected]').length === 0 && handView.find('.selected-card[card*=deadend]').length === 0 || playerStatus === 'blocked') {
						handView.find('.rotate-button').css('background-color', 'grey');
						handView.find('.rotate-button').unbind('click');
					} else {
						handView.find('.rotate-button').off().on('click', function() {    
							handView.find('.selected-card').toggleClass('rotated');            
							app.socket.emit('card-action', {type: 'rotate'});  
						});
					}
								
					// if the player is block no click function for card
					if (typeOfCard(handView.find(this).attr('card')) != 'path' || playerStatus === 'free') {
					
						// updates play button based on card picked
						handView.find('.play-button').off().on('click', function() {
							app.socket.emit('player-action', {card: card, type: 'submit', cardType: cardType}); 
						});
					
						app.socket.emit('player-action', {card: card, type: 'preview', cardType: cardType});
					}
				
					handView.find('#hand-game').attr('page', 'hand-play-card');    
				
			});
		};
		
		// when turn is over
		app.socket.on('next player', function(data) {
			console.log('card accepted by server');
			// removing card from hand
			// change colours to tell player that it is not their turn anymore.
			handView.find('body').removeClass('current-player');
			unBindCardClick();
			unBindDPad();
			handView.find('.hand [card='+handView.find('.selected-card').attr('card')+']').first().remove();
			handView.find('#hand-game').attr('page', 'hand-hand');
			handView.find('.hand').fadeIn(400).delay(300).queue( function(next){ 
				handView.find(this).css('left', '0');
				next(); 
			});
		});
		
		// Game Screens
		app.socket.on('start', function(data) {
			handView.find('body').removeClass('current-player');
			console.log('game started', data);
			
			if (data.job == "gold-digger") {
				handView.find('.flip-card-back').append('<img src="/images/job-miner.jpg"/>');  
			}
			if (data.job == "saboteur") {
				 handView.find('.flip-card-back').append('<img src="/images/job-saboteur.jpg"/>'); 
			} 
			
			var list = handView.find('<ul />');
			data.hand.forEach(function(card) {
				list.append(handView.find('<li />').attr('card', card).addClass('card'));
			});
			
			handView.find('.hand').html(list); // or handView.find('.hand').append(list) to add to existing cards    
			
			handView.find('.hand').css('width', window.innerWidth-45);
			handView.find('.hand ul').css('width', window.innerWidth-45);
			
			//bindCardClick();
			
			handView.find('#hand-game').attr('page', 'hand-choose-role');
		});
			
		app.socket.on('start turn', function(data){
			handView.find('body').addClass('current-player');
			console.log('turn started');
		 
			bindCardClick();
			if (playerStatus === 'free') {
				 bindDPad();
			}
			
		});
			

		handView.find('.job-card').off().on('click', function() {
			// flip cards
			handView.find('.job-card').addClass('flip');
			
			handView.find('.job-card').off().on('click', function() {
				handView.find('#hand-game').attr('page', 'hand-hand');
				handView.find('.hand').fadeIn(400).delay(300).queue( function(next){ 
					handView.find(this).css('left', '0');
					next(); 
				});
			});
		});  
		
		var unbindButtons = function() {
			handView.find('.rotate-button').unbind('click');
			handView.find('.play-button').unbind('click');
			
			if (handView.find('.selected-card[card*=connected]').length === 0 && handView.find('.selected-card[card*=deadend]').length === 0) {
				handView.find('.rotate-button').css('background-color', '');
			} else {       
				if (handView.find('rotated')) {
					handView.find('.selected-card').toggleClass('rotated');  
				}
			}
		};
		
		handView.find('.back-button').off().on('click', function() {
			unbindButtons();
			
			// telling server that the card needs to be removed from board view
			app.socket.emit('player-action', {type: 'back', cardType: typeOfCard(handView.find('.selected-card').attr('card'))});
			handView.find('#hand-game').attr('page', 'hand-hand');
		});
		
		handView.find('.discard-button').off().on('click', function() {
			unbindButtons();
			
			// telling server that the card needs to be removed from board view
			handView.find('.hand [card='+handView.find('.selected-card').attr('card')+']').first().remove();
			app.socket.emit('player-action', {card: handView.find('.selected-card').attr('card'), type: 'discard', cardType: typeOfCard(handView.find('.selected-card').attr('card'))});
			handView.find('#hand-game').attr('page', 'hand-hand');
		});
		
		// On Deal
		app.socket.on('deal', function(data) {
			// console.log('dealt ' + data.card + ' to player');
			handView.find('.hand ul').append(handView.find('<li />').attr('card', data.card).addClass('card'));
		});
		
		// After Map Card is Played
		app.socket.on('reveal-goal', function(data) {
			// console.log('reveal goal: ' + data.card);
			handView.find('.revealed-goal').attr('card', data.card).removeClass('hide');
			handView.find('.hand').addClass('hide');
			handView.find('.revealed-goal').addClass('flip-goal');
		});
		
		handView.find('.revealed-goal').off().on('click', function() {
			handView.find('.revealed-goal').removeClass('flip-goal');
			handView.find('.revealed-goal').removeAttr('card');
			handView.find('.revealed-goal').addClass('hide');
			handView.find('.hand').removeClass('hide');
		});
		
		// When Blocked
		app.socket.on('blocked', function(data) {
			console.log('you are now blocked');
			playerStatus = 'blocked';
		});
		
		// When Freed
		app.socket.on('freed', function(data) {
			console.log('you are now free');
			playerStatus = 'free';
		});
		
		// Winner detected
		app.socket.on('winner', function(data) {
			console.log('We have a winner! ', data);
			
			// TODO: show end game screen
		});
		
	});
  
};
