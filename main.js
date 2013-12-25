var express = require('express');
var passport = require('passport');
var util = require('util');
var everyauth = require('everyauth');
var mongoose =  require('mongoose');
var Promise = require('promise');
var engine = require('ejs-locals');
var crypto = require('crypto');
var $=require('jquery');

everyauth.debug = true;

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
var GOOGLE_CLIENT_ID = '892388590141-l0qsh6reni9i0k3007dl7q4340l7nkos.apps.googleusercontent.com';
var GOOGLE_CLIENT_SECRET = 'YzysmahL5LX4GLIydqBXN1zz';
var mongoHQConenctionString = 'mongodb://admin:admin124578@dharma.mongohq.com:10064/booltindb';

var app = express();
mongoose.connect(mongoHQConenctionString);

var BUsers = mongoose.model( 'users', {
    email: String,
    password: String,
    salt: String,
    twitterid:String,
    twitterAccessToken:String,
    twitterAccessSecretToken:String,
    googleid:String,
    googleAccessToken:String,
    googleAccessSecretToken:String,
    tempToken:String});

var BBoards = mongoose.model( 'boards', {name: String, category: String, privacy: String, locationlng: Number, locationlat: Number,tag:String});
var BBoardsTags = mongoose.model( 'boardsTags', {board:String,tag:String});
var BTag= mongoose.model( 'tags', {name:String});
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
        var promise = this.Promise();

        BUsers.findOne({twitterid:twitterUserMetadata.id}, function(err,user){

            if(err)
                return promise.fail([err]);

            if(!user){
                console.log("User Not Exist ... Creating ");
                var newUser = BUsers({
                    twitterid:twitterUserMetadata.id,
                    twitterAccessToken:accessToken,
                    twitterAccessSecretToken:accessTokenSecret
                });
                newUser.save(function(err){
                    if(err)
                        promise.fail([err]);
                    else
                        promise.fulfill(newUser);
                });
            } else {
                promise.fulfill(user);
            }
        });

        return promise;
    })
    .redirectPath('/');

everyauth.google
    .appId(GOOGLE_CLIENT_ID)
    .appSecret(GOOGLE_CLIENT_SECRET)
    .scope('https://www.googleapis.com/auth/userinfo.profile https://www.google.com/m8/feeds/')
    .handleAuthCallbackError( function (req, res) {
        res.redirect('/afterLoginWithGoolge');
    })
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, googleUserMetadata) {
        // find or create user logic goes here
        //googleUser.refreshToken = extra.refresh_token;
        //googleUser.expiresIn = extra.expires_in;

        var promise = this.Promise();
        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$' + googleUserMetadata + googleUserMetadata.id);
        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$' + accessTokenExtra);
        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$' + accessToken);

        BUsers.findOne({googleid:googleUserMetadata.id}, function(err,user){

            if(err)
                return promise.fail([err]);

            console.log(googleUserMetadata);

            if(!user){
                console.log("User Not Exist ... Creating ");
                var newUser = BUsers({
                    googleid:googleUserMetadata.id,
                    googleAccessToken:accessToken,
                    googleAccessSecretToken:accessTokenExtra
                });
                newUser.save(function(err){
                    if(err)
                        promise.fail([err]);
                    else
                        promise.fulfill(newUser);
                });
            } else {
                console.log("User Exist ... Returning ");
                promise.fulfill(user);
            }
        });

        return promise;

    })
    .redirectPath('/afterLoginWithGoolge');



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

app.get('/afterLoginWithGoolge', function(req,res){
    if(req.cookies.iDevice == 1)
        res.redirect('/openapp');
    else
        res.redirect('/');
})

app.get('/web/auth/google', function(req,res){
    res.cookie('iDevice',0);
    //res.redirect('/afterLoginWithGoolge');
    res.redirect('/auth/google');
});

app.get('/idevice/auth/google', function(req,res){
    res.cookie('iDevice',1);
    //res.redirect('/afterLoginWithGoolge');
    res.redirect('/auth/google');
});

app.get('/info', function(req,res) {
    res.send('Version ?.?.? - 920926-15:23');
});

app.get('/openapp', function(req,res) {

    if( req.user ){
        crypto.randomBytes(48, function(ex, buf) {
            var token = buf.toString('hex');

            BUsers.update(
                {_id:req.user.id},
                {$set:{tempToken:token}},
                function (err) {
                    if (err)
                        return handleError(err);
                    else {
                        var url = '"booltin://?temptoken=' + token +'"';
                        res.send('<script type="text/javascript">window.location = ' + url + '</script><a href=' + url + '>Successed - open</a>');
                    }
                });
        });
    }
    else
        res.send('<script type="text/javascript">window.location = "booltin://?"</script><a href="booltin://?">Faild - open</a>');
});

app.get('/profile', function(req,res) {
    if( req.user ){

        BUsersBoards.find({user:req.user._id}, function (err, boards) {
            if (err)
                return handleError(err);

            BFlyers.find({owner:req.user._id}, function (err, flyers) {
                BBoards.find({privacy:'public'},function(err,pBoards){
                    res.render('profile.ejs',{
                        title:'Profile',
                        email:req.user,
                        boards:boards,
                        pBoards:pBoards,
                        flyers:flyers
                    });

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
    if(checkUser(req,res))
        res.render('boardnew.ejs',{title:'new flyer'});
});

app.post('/board/new', function(req,res){

    //req.body.name
    //req.body.category
    //req.body.locationlng
    //req.body.locationlat

    if(!checkUser(req,res)) return;
    // Add to Boards collection
    var newboard = BBoards({
        name: req.body.name,
        category: req.body.category,
        privacy:req.body.privacy,
        locationlat: req.body.lat,
        locationlng: req.body.lng
    });

    var tags=req.body.tags.split(',');
    newboard.save(function (err) {
        if (err)
            res.send('Failed 01');
        else{
            // Add to Boards-Users collection
            var newboarduser = BUsersBoards({
                board: newboard._id,
                user: req.user._id
            });
            newboarduser.save(boardSaved);
        }
    });
    function boardSaved(err){
        tags.forEach(function(tg,i){
            BTag.findOne({name:tg},
                function(err, tag){
                    if(tag){
                        BBoardsTags({board:newboard._id,tag:tag._id}).save();
                    }else{
                        var newtag=BTag({name:tg});
                        newtag.save(function(){
                            var boardTag=BBoardsTags({board:newboard._id,tag:newtag._id});
                            boardTag.save();
                        });
                    } });
        });
    }



    res.send('OK');
});

app.get('/board/categories', function(req,res){
    res.send([
        {name:'event',id:1},
        {name:'sell/buy',id:2},
        {name:'school/university',id:3},
        {name:'general',id:4},
        {name:'other',id:5}]);
});
app.get('/board/get/public',function(req,res){
//    if( req.user ){

    BBoards.find({privacy:'public'}, function (err, boards) {
        res.json(boards);
    });
//    }else
//        res.write('log in please');
});

app.get('/board/:id', function(req,res){
    var boardid = req.params.id;

    BBoards.findOne({_id:boardid}, function(err,board){
        if(err)
            res.send('Oh oh error');

        if(board){
            BFlyersBoards.find({board:boardid}, function(err,flyers){
                res.render('board.ejs',{
                    title:board.name,
                    board:board,
                    flyers:flyers
                });
            })
        }
        else
            res.send('404, Not Found! Yah!');
    });
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
    newflyer.save(function (err) {
        BFlyersBoards({flyer:newflyer._id,board:flyerBoard}).save(
            function (err, product, numberAffected) {
                res.redirect('/profile');
            });
    });
});
app.post('/flyer/putup', function(req,res){
    var flyerid=req.body.flyerid;
    var boardid=req.body.boardid;
    var BFB=BFlyersBoards({flyer:flyerid,board:boardid}).save(
        function(err){
            res.redirect('/board/'+boardid);
        }
    )
});
app.get('/flyer/remove/:id', function(req,res){
    var flyerid = req.params.id;

    BFlyersBoards.remove({flyer:flyerid}, function(err){
        if(!err){
            BFlyers.remove({_id:flyerid}, function(err){
                if(!err)
                    res.redirect('/profile');
            });
        }
    });
});

app.get('/flyer/:id', function(req,res){
    var flyerid = req.params.id;

    BFlyers.findOne({_id:flyerid}, function(err,flyer){
        if(err)
            res.send('Oh oh error');

        if(flyer)
            res.render('flyer.ejs',{title:flyer.text,flyer:flyer});
        else
            res.send('404, Not Found! Yah!');
    });
});

/***************** Low Level API ********************/

/*
 GET
 /ison
 /profile
 /flyers/:id
 /boards/:id
 POST
 /register
 /login
 /logout
 /flyers
 /boards
 PUT
 /profile/:id
 DELETE
 /flyers/:id
 */

app.get('/api/1.0/ison', function(req,res){
    res.send(200,{status:'is on'});
});

function login(res,email,password){
    BUsers.findOne({email:email,password:password}, function(err,user){
        if(err) res.send('Faild');
        else if(!user) res.send('Wrong');
        else {
            crypto.randomBytes(48, function(ex, buf) {
                var token = buf.toString('hex');
                user.tempToken = token;

                BUsers.update(
                    {email:email,password:password},
                    {$set:{tempToken:token}},
                    function (err, numberAffected, raw) {
                        if (err)    return handleError(err);
                        else{
                            console.log('>>>>>>>>>>Login Request for '+email+' is accepeted.');
                            res.send(200,user);
                        }
                    });
            });
        }
    });
}

function logout(res,tempToken) {
    BUsers.update(
        {tempToken:tempToken},
        {$set:{tempToken:''}},
        function (err, numberAffected, raw) {
            if (err)    return handleError(err);
            else {
                console.log('>>>>>>>>>>Logout Request for tempToken: '+tempToken+' is accepeted.');
                res.send(200,{});
            }
        });
}

function findTempTokenOwner(res,temptoken){
    BUsers.findOne({tempToken:temptoken}, function(err,user){
        if(err) res.send(200,'{}');
        else if(!user) res.send(200,'{}');
        else res.send(200,user);
    });
}

function changePassword(res,tempToken,oldpassword,newpassword) {
    BUsers.update( { tempToken: tempToken, password: oldpassword },
        { $set: { password: newpassword }},
        function (err, numberAffected, raw) {
            if (err) return handleError(err);
            else res.send(200,{});
        });
}

function createBoard(res,tempToken,userid,name,category,tags,privacy,lng,lat) {

    var newboard = BBoards({
        name: name,
        category: category,
        privacy:privacy,
        locationlng: lng,
        locationlat: lat
    });
    newboard.save(function (err,board,affectedRowNum) {
        if (err) return handleError(err);
        else{
            // Add to Boards-Users collection
            var newboarduser = BUsersBoards({
                board: newboard._id,
                user: userid
            });
            newboarduser.save(function(err){
                if(!err){

                    // ToDo: Add Tags To BoardsTags Collection

                    res.send(200,{});
                }
            });
        }
    });
}

function createFlyer(res,userid,flyerText) {
    var newflyer = BFlyers({text:flyerText, owner:userid});
    newflyer.save(function (err) {
        if(err)  handleError(err);
        else res.send(200,{});
    });
}

function getFlyers(res,userid) {
    BFlyers.find({owner:userid}, function(err,flyers){
        if(err)  handleError(err);
        else { console.log(flyers); res.send(200,flyers); }
    });
}

function getBoards(res,userid) {
    BUsersBoards.find({user:userid}, function (err, userBoards) {
        if (err)
            return handleError(err);
        else{

            var boardIDList = [];
            for(var i=0; i<userBoards.length; i++){
                boardIDList.push(userBoards[i].board);
            }



/****************** RESTful API *********************/

app.post('/api/1.0/register', function(req,res) {
    var email = req.body.email;
    var password = req.body.password;

    var newUser = BUsers({email:email,password:password});
    newUser.save(function(err){
        if(err) res.send('Error in stroing!');
        else{
            console.log('>>>>>>>>>>Register Request for '+email+' is accpeted');
            login(res,email,password);
        }
    });
});

app.post('/api/1.0/login', function(req,res) {
    var email = req.body.email;
    var password = req.body.password;

    console.log('>>>>>>>>>>Login: '+email);

    login(res,email,password);
});

app.post('/api/1.0/logout', function(req,res) {
    var tempToken = req.body.tempToken;
    logout(res,tempToken)
});

app.post('/api/1.0/temptokenOwner', function(req,res) {
    var tempToken = req.body.tempToken;
    findTempTokenOwner(res,tempToken);
});


app.post('/api/1.0/profile/password', function(req,res) {
    var tempToken = req.body.temptoken;
    var oldpassword = req.body.oldpassword;
    var newpassword = req.body.newpassword;

    console.log('>>>>>>>>>>ChanginPassword: '+tempToken);

    changePassword(res,tempToken,oldpassword,newpassword);
});

app.post('/api/1.0/board', function(req,res) {
    var tempToken = req.body.temptoken;
    var boardname = req.body.boardname;
    var boardcategory = req.body.boardcategory;
    var boardtags = req.body.boardtags;
    var boardlocationLng = req.body.boardlocationLng;
    var boardlocationLat = req.body.boardlocationLat;
    var boardPrivacy = req.body.boardprivacy;

    console.log('>>>>>>>>>>Creating Board for  '+tempToken);

    BUsers.findOne({tempToken:tempToken}, function(err,user){
        if(err) return handleError(err);
        if(!user) res.send(500,'Unauthorized')
        else {
            createBoard(res,tempToken,user._id,
                boardname,
                boardcategory,
                boardtags,
                boardPrivacy,
                boardlocationLng,
                boardlocationLat);
        }
    });

});

app.post('/api/1.0/flyer', function(req,res) {
    var tempToken = req.body.temptoken;
    var flyerText = req.body.flyertext;

    console.log('>>>>>>>>>>Creating Flyer for  '+tempToken);

    BUsers.findOne({tempToken:tempToken}, function(err,user){
        if(err) return handleError(err);
        if(!user) res.send(500,'Unauthorized')
        else {
            createFlyer(res,tempToken,user._id,flyerText);
        }
    });

});

app.get('/api/1.0/flyer', function(req,res) {
    var tempToken = req.query.tempToken;

    console.log('>>>>>>>>>>Getting Flyers of '+tempToken);

    BUsers.findOne({tempToken:tempToken}, function(err,user){
        if(err) return handleError(err);
        if(!user) res.send(500,'Unauthorized')
        else {
            getFlyers(res,user._id);
        }
    });

});

app.get('/api/1.0/board', function(req,res) {
    var tempToken = req.query.tempToken;

    console.log('>>>>>>>>>>Getting Boards of '+tempToken);

    BUsers.findOne({tempToken:tempToken}, function(err,user){
        if(err) return handleError(err);
        if(!user) res.send(500,'Unauthorized')
        else {
            getBoards(res,user._id);
        }
    });

});

<<<<<<< HEAD
    function checkUser(req,res){
        if(!req.user)
        res.redirect('/login');
        return req.user!=null;
        }
    =======
    app.delete('/api/1.0/flyer', function(req,res) {
    var tempToken = req.query.tempToken;
    var flyerid = req.query.flyerid;

    console.log('>>>>>>>>>>Removing flyer '+tempToken);

    // ToDo: Check ownership of flyer

    // Remove It
    BFlyersBoards.remove({flyer:flyerid}, function(err){
        if(!err){
            BFlyers.remove({_id:flyerid}, function(err){
                if(!err) res.send(200,{});
            });
        }
    });

});

app.post('/api/1.0/board/putup', function(req,res) {
    var tempToken = req.body.tempToken;
    var flyerid = req.body.flyerid;
    var boardid = req.body.boardid;

    console.log('>>>>>>>>>> Puting Up Flyer of '+tempToken);

    BFlyersBoards({
        flyer:flyerid,
        board:boardid})
        .save(function (err) {
            if(!err) res.send(200,{})
        });

});
>>>>>>> 35a255b83d62890557c1b77a8aaae64f3efd8f34
