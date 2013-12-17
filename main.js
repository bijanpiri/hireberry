var express = require('express')
var passport = require('passport')
var util = require('util')
var everyauth = require('everyauth');


/************** Initialization ****************/

var TWITTER_CONSUMER_KEY = "IrzgMx7fEYybvrN25eiv1w";
var TWITTER_CONSUMER_SECRET = "gE9FopMHdlSnTunNlAqvKv6ZwQ8QkEo3gsrjGyenr0";

var app = express();

everyauth.everymodule
    .findUserById( function (id, callback) {
        callback(null, usersById[id]);
    });

everyauth.twitter
    .consumerKey(TWITTER_CONSUMER_KEY)
    .consumerSecret(TWITTER_CONSUMER_SECRET)
    .findOrCreateUser( function (session, accessToken, accessTokenSecret, twitterUserMetadata) {
        // find or create user logic goes here
        Console.log('Logged In With Twitter')
    })
    .redirectPath('/');

everyauth.google
    .appId('105806305660-2k8f0sr0mg8a36rn8fmn0fsh9ls85iio.apps.googleusercontent.com')
    .appSecret('uFr61pADo3O5b1uyaEk5Cmuh')
    .scope('https://www.google.com/m8/feeds') // What you want access to
    .handleAuthCallbackError( function (req, res) {
        // If a user denies your app, Google will redirect the user to
        // /auth/facebook/callback?error=access_denied
        // This configurable route handler defines how you want to respond to
        // that.
        // If you do not configure this, everyauth renders a default fallback
        // view notifying the user that their authentication failed and why.
    })
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, googleUserMetadata) {
        // find or create user logic goes here
        // Return a user or Promise that promises a user
        // Promises are created via
        //     var promise = this.Promise();
    })
    .redirectPath('/');

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('views engine', 'ejs');
  app.use(express.static(__dirname + '/public'));
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(everyauth.middleware());
});

/************** Starting Server ****************/

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});

module.exports = app;

/************** Application Routers ****************/

app.get('/info', function(req,res) {
	res.send('Version 2.1.0');
});

app.get('/openapp', function(req,res) {
	res.send('<script type="text/javascript">window.location = "booltin://?"</script><a href="booltin://?">open</a>');
});

/*************************************/
