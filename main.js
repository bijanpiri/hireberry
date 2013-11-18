var express = require("express");
var app = express();
app.use(express.logger());

app.get('/', function(request, response) {
  response.send('Hello World!');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
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