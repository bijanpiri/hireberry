var express = require('express');
var passport = require('passport');
var util = require('util');
var everyauth = require('everyauth');
var mongoose =  require('mongoose');
var Promise = require('promise');
var engine = require('ejs-locals');

/*
    /auth/twitter
    /auth/google
    /logout
    /register
    /login
 */

/************** Initialization ****************/

var TWITTER_CONSUMER_KEY = "IrzgMx7fEYybvrN25eiv1w";
var TWITTER_CONSUMER_SECRET = "gE9FopMHdlSnTunNlAqvKv6ZwQ8QkEo3gsrjGyenr0";
var GOOGLE_CLIENT_ID = '105806305660-2k8f0sr0mg8a36rn8fmn0fsh9ls85iio.apps.googleusercontent.com';
var GOOGLE_CLIENT_SECRET = 'uFr61pADo3O5b1uyaEk5Cmuh';
var mongoHQConenctionString = 'mongodb://admin:admin124578@dharma.mongohq.com:10064/booltindb';

var app = express();
mongoose.connect(mongoHQConenctionString);

var BUsers = mongoose.model( 'users', {email: String, password: String, salt: String} );
var BBoards = mongoose.model( 'boards', {name: String, category: String, locationlng: Number, locationlat: Number});
var BUsersBoards = mongoose.model( 'usersboards', {board:String, user:String});
var BFlyers = mongoose.model( 'flyers', {text: String, owner: String});
var BFlyersBoards = mongoose.model( 'flyersboards', {flyer:String,board:String});

everyauth.everymodule
    .findUserById( function (id, callback) {
        BUsers.findOne({_id:id}, function(err,user) {
            callback(null, user);
        });
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
    .appId(GOOGLE_CLIENT_ID)
    .appSecret(GOOGLE_CLIENT_SECRET)
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

everyauth.password
    .loginWith('email')
    .getLoginPath('/login')
    .postLoginPath('/login')
    .loginView('login.ejs')
    .loginLocals( function (req, res, done) {
        setTimeout( function () {
            done(null, {
                title: 'Async login'
            });
        }, 200);
    })
    .authenticate( function (login, password) {
        var errors = [];
        if (!login)
            errors.push('Missing login');
        if (!password)
            errors.push('Missing password');
        if (errors.length)
            return errors;

        var promise = this.Promise()
        BUsers.findOne({ email: login}, function (err, user) {
          if (err)
              return promise.fulfill([err]);

            console.log(user);

            if (!user)
                return ['Login failed'];
            if (user.password !== password)
                return ['Login failed'];

          promise.fulfill(user);
        });
       return promise;
    })
    .loginSuccessRedirect('/profile')

    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('register.ejs')
    .registerLocals( function (req, res, done) {
        setTimeout( function () {
            done(null, {
                title: 'Async Register'
            });
        }, 200);
    })
    .validateRegistration( function (newUserAttributes) {
        return null;
    })
    .registerUser( function (newUserAttributes) {
        var user = BUsers({email: newUserAttributes.email, password: newUserAttributes.password, salt: ''});
        user.save();
        return user;
    })
    .registerSuccessRedirect('/profile');

// configure Express
app.configure(function() {
  app.engine('ejs',engine);
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');
  app.use(express.logger('dev'));
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

app.get('/', function(req,res) {
    if( req.user )
        res.redirect('/profile');
    else
        res.redirect('/login');
});

app.get('/info', function(req,res) {
	res.send('Version ?.?.? - 920926-15:23');
});

app.get('/openapp', function(req,res) {
	res.send('<script type="text/javascript">window.location = "booltin://?"</script><a href="booltin://?">open</a>');
});

app.get('/profile', function(req,res) {
    if( req.user ){

        BUsersBoards.find({user:req.user._id}).count(function (err, bcount) {
            if (err)    return handleError(err);

            BFlyers.find({owner:req.user._id}).count(function (err, fcount) {
                res.render('profile.ejs',{
                    title:'Profile',
                    email:req.user,
                    boardsCount:bcount,
                    flyersCount:fcount
                });
            });
        });
    }
    else
        res.redirect('/login');
});

app.post('/profile', function(req,res) {
    var newPassword = req.body.newpassword;

    if( req.body.newpassword != req.body.confirmnewpassword)
        res.send('Not matched!');
    if( req.user ){
        console.log(req.user);
        BUsers.update( { email: req.user.email, password: req.body.oldpassword },
            { $set: { password: newPassword }},
            function (err, numberAffected, raw) {
                if (err)
                    return handleError(err);
                else
                    res.send('Password is changed successfuly!');
        });
    }
});

app.get('/board/new', function(req,res){
    res.render('boardnew.ejs',{title:'new flyer'});
});

app.post('/board/new', function(req,res){

    //req.body.name
    //req.body.category
    //req.body.locationlng
    //req.body.locationlat

    // Add to Boards collection
    var newboard = BBoards({
        name: 'test',
        category: 'sport',
        locationlng: '100',
        locationlat: '200'
    });
    newboard.save(function (err, product, numberAffected) {
        if (err)
            res.send('Failed 01');
        else{
            // Add to Boards-Users collection
            var newboarduser = BUsersBoards({
                board: newboard._id,
                user: req.user._id
            });
            newboarduser.save();
        }
    });

    res.send('OK');
});

app.get('/flyer/new', function(req,res){

    BBoards.find({}, function (err, boards){
        res.render('flyernew.ejs',{
                title:'new flyer',
                boards:boards
        });
    });
});

app.post('/flyer/new', function(req,res){
    var flyerText = req.body.flyertext;
    var flyerBoard = req.body.board;

    var newflyer = BFlyers({text:flyerText, owner:req.user._id});
    newflyer.save(function (err, product, numberAffected) {
        BFlyersBoards({flyer:newflyer._id,board:flyerBoard}).save(function (err, product, numberAffected) {
            res.redirect('/profile');
        });
    });
});
/*************************************/
