
var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , TwitterStrategy = require('passport-twitter').Strategy;

//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new TwitterStrategy({
    consumerKey: 'IrzgMx7fEYybvrN25eiv1w',
    consumerSecret: 'gE9FopMHdlSnTunNlAqvKv6ZwQ8QkEo3gsrjGyenr0',
    callbackURL: "booltin.heroku.com:3000/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

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

app.get('/info', function(req, res) {
	res.send('Hi!');
});

app.get('/auth/twitter',
  passport.authenticate('twitter'),
  function(req, res){});

app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.listen(3000);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
/*
// These two lines are required to initialize Express in Cloud Code.
var express = require('express');

var app = express();
 
// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body
app.use(express.session({ secret: 'keyboard cat' }));

var passport = require('passport')
var TwitterStrategy = require('passport-twitter').Strategy;

passport.use(new TwitterStrategy({
    consumerKey: 'IrzgMx7fEYybvrN25eiv1w',
    consumerSecret: 'gE9FopMHdlSnTunNlAqvKv6ZwQ8QkEo3gsrjGyenr0',
    callbackURL: "http://www.example.com/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
      done(null, user);
  }
));

// Redirect the user to Twitter for authentication.  When complete, Twitter
// will redirect the user back to the application at
//   /auth/twitter/callback
app.get('/auth/twitter', passport.authenticate('twitter'));

// Twitter will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { successRedirect: '/',
                                     failureRedirect: '/login' }));

// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.
app.get('/info', function(req,res) {
	res.send('<h1>Booltin Vitrine</h1>');
});
 
app.get('/shareOnTwitter/:message', function(request,response) {
	var msg = request.params['message'];


});

app.get('/flyer/:id', function(req, res) {
  //res.render('hello', { message: 'Congrats, you just set up your app!' + req.params["id"] });
  var query = new Parse.Query("Flyers");
  query.equalTo("objectId", req.params["id"]);
  query.find({
    success: function(results) {
    	if( results.length==0 )
    		res.render('hello', { message: 'You want to see ' + req.params["id"] + ' ,but you\'re wrong!' });
    	else
    		res.render('hello', { message: 'Title is: ' + results.get('title') });
    },
    error: function() {
      res.error("flyer lookup failed");
    }
  });
});

// This line is required to make Express respond to http requests.
app.listen(5000);
*/