var playerColours = new Array ( "", "red", "orange", "yellow", "green", "blue", "indigo", "violet" );

var Application = function() {
  var app = {
    socket: io.connect(), // Connect to server
    player: {
      id: null,
      isHost: false
    },
    game: {
      playerCount: 0
    },
  };

  // Getting Player Name
  app.socket.on('identity', function (data) {
    app.player.id = data;
  });

  // Loading screen
  app.socket.on('connect', function (data) {
		new HandView(app);
		new BoardView(app);
		// var url = new URL(window.location.href);
		// url.pathname.includes("board")
  });
 
  return app;
}

// Used to adjust borders on mobile
var windowHeight = window.innerHeight/2-40;
var windowWidth = window.innerWidth-40;
$('.screen').css('height', windowHeight + 'px')
$('.screen').css('width', windowWidth + 'px')

window.onresize = function(event) {
  windowHeight = window.innerHeight/2-40;
  windowWidth = window.innerWidth-40;
  
  $('.screen').css('height', windowHeight + 'px')
  $('.screen').css('width', windowWidth + 'px')
  $('.hand').css('width', window.innerWidth-45);
  $('.hand ul').css('width', window.innerWidth-45);
};

var application = new Application();
