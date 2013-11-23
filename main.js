var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , TwitterStrategy = require('passport-twitter').Strategy;

var TWITTER_CONSUMER_KEY = "IrzgMx7fEYybvrN25eiv1w";
var TWITTER_CONSUMER_SECRET = "gE9FopMHdlSnTunNlAqvKv6ZwQ8QkEo3gsrjGyenr0";

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: "http://booltin.heroku.com/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
  	});
  }));

var app = express();

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});


app.get('/auth/twitter',passport.authenticate('twitter'),function(req, res){});

app.get('/info'), function(req,res) {
	res.send('Version 1.0.0');
});

app.get('/openapp'), function(req,res) {
	res.redirect("booltin://Yah");
});

app.get('tweet/:message', function(req,res) {
	var msg = req.params['message'];

	twitter.statuses("update", { status: msg },
	    accessToken,
	    accessTokenSecret,
	    function(error, data, response) {
	        if (error) {
	            // something went wrong
	        } else {
	            // data contains the data sent by twitter
	        }
	    }
	);
});

app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
