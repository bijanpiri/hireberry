express = require('express');
util = require('util');
everyauth = require('everyauth');
mongoose =  require('mongoose');
Promise = require('promise');
engine = require('ejs-locals');
crypto = require('crypto');
upload = require('jquery-file-upload-middleware'); // Don't Forget Creating /public/tmp and /public/uploads
mandrill  = require('node-mandrill');
fs = require('fs');
http = require('http')
Dropbox = require("dropbox"); // https://github.com/evnm/dropbox-node
twitterAPI = require('node-twitter-api');
linkedin_client = require('linkedin-js')('75ybminxyl9mnq', 'KsgqEUNsLSXMAKg6', 'callbackURL')
routerForm = require('./routers/form');
routerDashboard = require('./routers/dashboard');

//region Initialization
var LINKEDIN_CONSUMER_KEY = "77pqtwladavveq";
var LINKEDIN_CONSUMER_SECRET = "OtnTkyKjGB6gY2J5";
var TWITTER_CONSUMER_KEY = "IrzgMx7fEYybvrN25eiv1w";
var TWITTER_CONSUMER_SECRET = "gE9FopMHdlSnTunNlAqvKv6ZwQ8QkEo3gsrjGyenr0";
var GOOGLE_CLIENT_ID = '892388590141-l0qsh6reni9i0k3007dl7q4340l7nkos.apps.googleusercontent.com';
var GOOGLE_CLIENT_SECRET = 'YzysmahL5LX4GLIydqBXN1zz';
var Facebook_AppID='241341676042668';
var Facebook_AppSecret='2e748d80c87a8594e792eeb482f7c87d';
var mongoHQConenctionString = 'mongodb://admin:admin124578@widmore.mongohq.com:10000/booltindb';
var keySize=512;
var hashIteration=1;

dbclient = new Dropbox.Client({
    key: "7bdvs2t8zrdqdw8",
    secret: "5y37uqs64t0f3gc",
    sandbox     : false
    //token       : 'tf6jvJZK81wAAAAAAAAAAZiljBK7q8eeXWVAllN7Ipq2dzVdOH89XfcS-xcUZDeA',
    //tokenSecret : '5y37uqs64t0f3gc'
});
dbclient.authDriver(new Dropbox.AuthDriver.NodeServer(8191));


TwitterAccessToken = '267915249-EKZZ2KneSOf06oIOMXFKWoSEsXQTg3EwjH4Z4dU1';
TwitterAccessTokenSecret = 'ReF8CIy5IdFCmasTlKaayYAoSEIzYL4b4VLcp8IwBLVMD';
twitter = new twitterAPI({
    consumerKey: 'Lw7YsCYUV2Dv9yYViTvPQ',
    consumerSecret: '1MUO7r44h230yRcASFNzSVlBlssvSSEqnarWpztbfw',
    callback: 'http://localhost:5000/'
});

var app = express();
var options = {
    server: {
        socketOptions: {
            connectTimeoutMS: 1000000000 ,
            keepAlive: 1 }},
    replset:{
        socketOptions : {
            keepAlive: 1 }}
};

mongoose.connect(mongoHQConenctionString,options);
everyauth.debug = true;
everyauth.helpExpress(app);

// For Sending Logs to Client Console Output
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
server.listen(5001);

// configure upload middleware
upload.configure({
    tmpDir: __dirname + '/public/tmp',
    uploadDir: __dirname + '/public/uploads',
    uploadUrl: '/flyer/upload',
    imageVersions: {
        thumbnail: {
            width: 80,
            height: 80
        }
    }
});

upload.on('begin', function (fileInfo) {
    // fileInfo structure is the same as returned to browser
    // {
    //     name: '3 (3).jpg',
    //     originalName: '3.jpg',
    //     size: 79262,
    //     type: 'image/jpeg',
    //     delete_type: 'DELETE',
    //     delete_url: 'http://yourhost/upload/3%20(3).jpg',
    //     url: 'http://yourhost/uploads/3%20(3).jpg',
    //     thumbnail_url: 'http://youhost/uploads/thumbnail/3%20(3).jpg'
    // }

    fileInfo.name = crypto.randomBytes(12).readUInt32LE(0) + fileInfo.name.substr(fileInfo.name.lastIndexOf('.'));
    console.log(fileInfo);
});
upload.on('abort', function (fileInfo) { });
upload.on('end', function (fileInfo) { });
upload.on('delete', function (fileInfo) {  });
upload.on('error', function (e) {
    console.log(e.message);
});


//endregion

//region Mongose Models
var BUsers = mongoose.model( 'users', {
    email: String,
    password: Buffer,    salt: Buffer,
    twittername:String,
    twitterid:String,
    twitterAccessToken:String,
    twitterAccessSecretToken:String,
    facebookName:String,
    facebookid:String,
    facebookAccessToken:String,
    facebookAccessTokenExtra:String,
    googlename:String,
    googleid:String,
    googleAccessToken:String,
    googleAccessSecretToken:String,
    linkedinname:String,
    linkedinid:String,
    linkedinAccessToken:String,
    linkedinAccessSecretToken:String,
    tempToken:String});
var BBoards = mongoose.model( 'boards', {name: String, category: String, privacy: String, locationlng: Number, locationlat: Number,tag:String});
var BBoardsTags = mongoose.model( 'boardsTags', {board:String,tag:String});
var BFlyersTags = mongoose.model( 'flyersTags', {flyer:String,tag:String});
var BTag = mongoose.model( 'tags', {name:String});
var BUsersBoards = mongoose.model( 'usersboards', {board:String, user:String});
BFlyers = mongoose.model( 'flyers', {flyer: Object, owner: String, publishTime: String, disqusShortname: String, dbToken:String});
var BFlyersBoards = mongoose.model( 'flyersboards', {flyer:String,board:String});
var BBoardsFollwoing = mongoose.model( 'boardsfollowing', {board:String,follower:String});
var BFlyersTickets = mongoose.model( 'flyerstickets', {flyer:String,user:String});

MApplyForm = mongoose.model( 'applyForm', {
    flyerID: String,
    name:String,
    email:String,
    skills:[],
    applyTime:String,
    workPlace:String,
    workTime:String,
    profiles:String,
    anythingelse:String,
    resumePath:String,
    dbToken:String,
    activities:[]
});

//endregion

//region Configure every modules in everyauth
everyauth.everymodule
    .findUserById( function (id, callback) {
        BUsers.findOne({_id:id}, function(err,user) {
            callback(null, user);
        });
    });
//endregion

//region Twitter Authentication Configuration
everyauth.linkedin
    .consumerKey(LINKEDIN_CONSUMER_KEY)
    .consumerSecret(LINKEDIN_CONSUMER_SECRET)
    .findOrCreateUser( function (session, accessToken, accessTokenSecret, linkedinUserMetadata) {
        // find or create user logic goes here
        var promise = this.Promise();

        BUsers.findOne({linkedinid:linkedinUserMetadata.id}, function(err,user){

            if(err)
                return promise.fail([err]);

            if(!user){
                console.log("User Not Exist ... Creating ");
                var newUser = BUsers({
                    linkedinname:linkedinUserMetadata.lastName,
                    linkedinid:linkedinUserMetadata.id,
                    linkedinAccessToken:accessToken,
                    linkedinAccessSecretToken:accessTokenSecret
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
//endregion

//region Facebook Authentication Configuartion
everyauth
    .facebook
    .appId(Facebook_AppID)
    .appSecret(Facebook_AppSecret)
    .scope('email')
    .fields('id,name,email,picture')
    .handleAuthCallbackError( function (req, res) {
        BLog('Facebook login denied by user');
        req.redirect('/login');
    })
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, fbUserMetadata) {
        BLog(fbUserMetadata);
        BLog(accessToken);
        BLog(accessTokenExtra);
        var promise=this.Promise();
        BUsers.findOne({facebookid:fbUserMetadata.id},function(err,user){
            if(err)
                return promise.fail([err]);
            if(!user){
                BLog('Facebook user not exist');
                var newUser=BUsers({
                    facebookid:fbUserMetadata.id,
                    facebookName:fbUserMetadata.name,
                    facebookAccessToken:accessToken,
                    facebookAccessTokenExtra:accessTokenExtra
                });
                newUser.save(function(err){
                    if(err)
                        promise.fail([err]);
                    else
                        promise.fulfill(newUser);
                });
            }else
                promise.fullfill(user);
        });
        return promise;
    })
    .redirectPath('/');
//endregion

//region Twitter Authentication Configuration
everyauth.twitter
    .consumerKey(TWITTER_CONSUMER_KEY)
    .consumerSecret(TWITTER_CONSUMER_SECRET)
    .findOrCreateUser( function (session, accessToken, accessTokenSecret, twitterUserMetadata) {
        // find or create user logic goes here
        var promise = this.Promise();

        BUsers.findOne({twitterid:twitterUserMetadata.id}, function(err,user){

            if(err)
                return promise.fail([err]);

            BLog('hello');
            BLog( twitterUserMetadata );

            if(!user){
                console.log("User Not Exist ... Creating ");
                var newUser = BUsers({
                    twittername:twitterUserMetadata.name,
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
//endregion

//region Google Authentication Configuration
everyauth.google
    .appId(GOOGLE_CLIENT_ID)
    .appSecret(GOOGLE_CLIENT_SECRET)
    .scope('https://www.googleapis.com/auth/userinfo.email')
    //.scope('https://www.googleapis.com/auth/userinfo.profile https://www.google.com/m8/feeds/')
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

                // ToDo: A Problem - Sometime google returns email, sometime returns name !!!
                var newUser = BUsers({
                    googlename:(googleUserMetadata.name || googleUserMetadata.email),
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
//endregion

//region Local Username/Password Registration and Authentication Configuration
everyauth.password
    .loginWith('email')
    .getLoginPath('/login')
    .postLoginPath('/login')
    .loginView('login.ejs')
    .loginLocals( function (req, res, done) {
        setTimeout( function () {
            done(null, {
                title: 'Login'
            });
        }, 200);
    })
    .respondToLoginSucceed( function (res, user) {
        if (user)
            res.json({
                success: true,
                lastPage: '/profile.ejs'//(req.session.lastPage || '/profile.ejs')
            }, 200);
        else
            res.json({ success: false }, 501);
    })
    .respondToLoginFail( function (req, res, errors, login) {
        if (errors && errors.length)
            res.json({ success: false, errors: errors });
    })
    .authenticate( function (login, password) {
        var errors = [];
        if (!login)
            errors.push('Missing login');
        if (!password)
            errors.push('Missing password');
        if (errors.length)
            return errors;

        var promise = this.Promise();
        BUsers.findOne({ email: login}, function (err, user) {
            if (err)
                return promise.fulfill([err]);

            console.log(user);

            if (!user)
                return promise.fulfill(['invalid user']);
            if(!user.password || !user.salt)
                return promise.fulfill(['Server authentication error.']);

            crypto.pbkdf2( password, user.salt, hashIteration, keySize,
                function(err, dk) {
                    var eq=true;
                    var key=user.password;
                    for(var i=0;i<keySize;i++) eq &= key[i] == dk[i];
                    if(!eq)
                        promise.fulfill(['Invalid password']);
                    else
                        promise.fulfill(user);

                }
            );

//            if (user.password !== password)
//                return promise.fulfill(['Login failed']);
        });
        return promise;
    })
    .loginSuccessRedirect('/')
    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('register.ejs')
    .registerLocals( function (req, res, done) {
        setTimeout( function () {
            done(null, {
                title: 'Register'
            });
        }, 200);
    })
    .validateRegistration( function (newUserAttributes) {
        return null;
    })
    .registerUser( function (newUserAttributes) {
        var promise = this.Promise(),
            password=newUserAttributes.password;

        delete newUserAttributes[password]; // Don't store password
//        newUserAttributes.salt = bcrypt.genSaltSync(10);
//        newUserAttributes.hash = bcrypt.hashSync(password, newUserAttributes.salt);
//

        BUsers.count({email:newUserAttributes.email}, function(err,count){
            if(count>0)
                return promise.fail(['This email address has already registered']);
            else{
                var salt = crypto.randomBytes(128).toString('base64');

                crypto.pbkdf2( password, salt, hashIteration, keySize,
                    function(err, dk) {
                        var user = BUsers(
                            {
                                email: newUserAttributes.email,
                                password: dk,
                                salt:salt
                            });
                        user.save(function(err){return promise.fulfill(user);});
                    }
                );


            }
        });

        return promise;
    })
    .registerSuccessRedirect('/');
//endregion

//region Configure Express
app.configure(function() {
    app.engine('ejs',engine);
    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/views');
    app.use(express.logger('dev'));
    app.use(express.static(__dirname + '/public'));
    app.use(express.logger());
    app.use(express.cookieParser());
    app.use('/flyer/upload', upload.fileHandler());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.session({
        secret: 'keyboard cat',
        maxAge: false, //1 Hour
        expires: false //1 Hour
    }));
    app.use(everyauth.middleware());
});
//endregion

//region Starting Server
var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});

module.exports = app;
//endregion

//region Hiring Form
app.get('/job/dropboxAuth', routerForm.dropboxAuthentication );
app.get('/liprofile/:q', routerForm.findLinkedInProfile )
app.get('/gravatar/:email', routerForm.findGravatarProfile )
app.get('/twprofile/:q', routerForm.findTwitterProfile )
app.post('/apply', routerForm.apply );
app.get('/dashboard', routerDashboard.showDashboard );
app.get('/api/forms', routerDashboard.forms );
app.get('/api/applications', routerDashboard.applications );
app.post('/api/applications/:applicationID', routerDashboard.updateApplication );
app.get('/api/applications/stat', routerDashboard.statisticalInfo )
//endregion

//region Application Routers

app.get('/', function(req,res) {
    if( req.user )
        res.redirect('/flyer/new');
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
    res.redirect('/auth/google');
});

app.get('/idevice/auth/google', function(req,res){
    res.cookie('iDevice',1);
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

app.get('/setting', function(req,res){

    if( !checkUser(req,res))
        return;

    res.render('setting.ejs',{title:'Setting'});
});
app.get('/boards/name',function(req,res){
    var FindUserBoards = function() {
        BUsersBoards.find({user:req.user._id}, function (err, userBoards) {
            if (err)
                return handleError(err);

            var boardsIDList = [];
            for(var i=0; i<userBoards.length; i++)
                boardsIDList.push(userBoards[i].board);
            FindUserBoardsDetails(boardsIDList);

        });

    }
    var FindUserBoardsDetails = function(boardsIDList) {
        BBoards.find({_id:{$in:boardsIDList}}, function(err, b) {
            if(!err){
                var names=[];
                for(var i=0;i< b.length;i++)
                    names.push(b[i].name);
                res.send(names);
            }
        });
    }
    if(req.user)
        FindUserBoards();
    else
        res.send('Login to get boards');
});
app.get('/boards',function(req,res){
    var FindUserBoards = function() {
        BUsersBoards.find({user:req.user._id}, function (err, userBoards) {
            if (err)
                return handleError(err);

            var boardsIDList = [];
            for(var i=0; i<userBoards.length; i++)
                boardsIDList.push(userBoards[i].board);
            FindUserBoardsDetails(boardsIDList);

        });

    }

    var FindUserBoardsDetails = function(boardsIDList) {
        BBoards.find({_id:{$in:boardsIDList}}, function(err, b) {
            res.send(b);
        });
    }
    if(req.user)
        FindUserBoards();
    else
        res.send('Login to get boards');
});

app.get('/profile', function(req,res) {

    var PrepareAndRender = function(user) {
        FindUserBoards(user);
    }

    var FindUserBoards = function(user) {
        BUsersBoards.find({user:user._id}, function (err, userBoards) {
            if (err)
                return handleError(err);

            var boardsIDList = [];
            for(var i=0; i<userBoards.length; i++)
                boardsIDList.push(userBoards[i].board);

            FindUserBoardsDetails(boardsIDList);
        });
    }

    var FindUserBoardsDetails = function(boardsIDList) {
        BBoards.find({_id:{$in:boardsIDList}}, function(err, userBoard) {
            FindUserFlyers(userBoard);
        });
    }

    var FindUserFlyers = function(userBoards) {
        BFlyers.find({owner:req.user._id}, function (err, userFlyers) {
            FindUserFollowingBoards(userBoards, userFlyers);
        });
    }

    var FindUserFollowingBoards = function(userBoards,userFlyers) {
        BBoardsFollwoing.find({follower:req.user._id}, function(err,followingBoardRows){
            if(err) return res.send(500,{result:'DB Error'});

            var followingBoardsIDList = [];
            for(var i=0; i<followingBoardRows.length; i++)
                followingBoardsIDList.push(followingBoardRows[i].board);

            FindUserFollowingBoardsDetails(userBoards,userFlyers,followingBoardsIDList);
        });
    }

    var FindUserFollowingBoardsDetails = function(userBoards,userFlyers,followingBoardsIDList){
        BBoards.find({_id:{$in:followingBoardsIDList}}, function(err, followingBoards) {
            FindUserPocketedFlyer(userBoards,userFlyers,followingBoards);
        });
    }

    var FindUserPocketedFlyer = function(userBoards,userFlyers,followingBoards) {
        BFlyersTickets.find({user:req.user._id}, function(err,ticketedFlyersRows){

            var ticketFlyersIDList = [];
            for(var i=0; i<ticketedFlyersRows.length; i++)
                if(ticketedFlyersRows[i].flyer)
                    ticketFlyersIDList.push(ticketedFlyersRows[i].flyer);

            FindUserPocketedFlyerDetails(userBoards,userFlyers,followingBoards,ticketFlyersIDList);
        });
    }

    var FindUserPocketedFlyerDetails = function(userBoards,userFlyers,followingBoards,ticketFlyersIDList) {
        BFlyers.find({_id:{$in:ticketFlyersIDList}}, function(err,existTicketedFlyers){
            if(err) return res.send(500,{result:'DB Error'});


            process.nextTick( function() {
                var ticketedFlyers = [];

                for( var i=0; i<ticketFlyersIDList.length; i++ ) {

                    var foundIndex = -1;

                    for( var j=0; j<existTicketedFlyers.length; j++ ) {
                        if( existTicketedFlyers[j]._id == ticketFlyersIDList[j] ){
                            foundIndex = j;
                            break;
                        }
                    }

                    if( foundIndex >= 0 )
                        ticketedFlyers.push({
                            isDeleted:false,
                            flyer:existTicketedFlyers[foundIndex]
                        });
                    else
                        ticketedFlyers.push({
                            isDeleted:true
                        });
                }

                FindPublicBoard(userBoards,userFlyers,followingBoards,ticketedFlyers);
            });
        });
    }

    var FindPublicBoard = function(userBoards,userFlyers,followingBoards,ticketedFlyers) {
        BBoards.find({privacy:'public'},function(err,pBoards){

            // Add User's boards to public boards list (board which user can put on theme)
            pBoards = pBoards || [];
            Array.prototype.push.apply(pBoards, userBoards);

            RenderPage(userBoards,userFlyers,followingBoards,ticketedFlyers,pBoards);
        });
    }

    var RenderPage = function(userBoards,userFlyers,followingBoards,ticketedFlyers,pBoards) {

        res.render('profile.ejs',{
            title:'Profile',
            email:req.user,
            boards:userBoards,
            pBoards:pBoards,
            flyers:userFlyers,
            followingBoards:followingBoards,
            ticketedFlyers:ticketedFlyers
        });
    }

    if( checkUser(req,res) )
        PrepareAndRender(req.user);
    else
        res.redirect('/login');
});

app.post('/profile', function(req,res) {

    if( !checkUser(req,res) )
        return res.send(401);

    var newPassword = req.body.newpassword;

    if( req.body.newpassword != req.body.confirmnewpassword)
        res.send(401,{error:'Not matched!'});
    if( req.user ){

        BUsers.update( { email: req.user.email, password: req.body.oldpassword },
            { $set: { password: newPassword }},
            function (err,nAffected) {
                if (err)
                    return handleError(err);

                if(nAffected==0)
                    res.send(401);
                else
                    res.send(200);
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

    var tags=req.body.tags.split(',');

    if(!checkUser(req,res))
        return;

    // Add to Boards collection
    var newboard = BBoards({
        name: req.body.name,
        category: req.body.category,
        privacy:req.body.privacy,
        locationlat: req.body.lat,
        locationlng: req.body.lng
    });

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
        res.redirect('/profile');
        tags.forEach(function(tagName,i){
            BTag.findOne({name:tagName}, function(err, tag){
                if(tag){
                    BBoardsTags({
                        board:newboard._id,
                        tag:tag._id
                    }).save();
                }else{
                    var newtag = BTag({name:tagName});
                    newtag.save(function(){
                        var boardTag = BBoardsTags({
                            board:newboard._id,
                            tag:newtag._id});
                        boardTag.save();
                    });
                } });
        });
    }




});

app.get('/board/categories', function(req,res){
    res.send([
        {name:'event',id:1},
        {name:'sell/buy',id:2},
        {name:'school/university',id:3},
        {name:'general',id:4},
        {name:'other',id:5}]);
});

app.get('/board/public',function(req,res){
    BBoards.find({privacy:'public'}, function (err, boards) {
        res.json(boards);
    });
});

app.post('/board/follow', function(req,res){

    checkUser(req,res);

    var boardid = req.body.boardid;
    var userid = req.user._id;

    // Store Following Relationship Board
    BBoardsFollwoing.findOne({follower:userid,board:boardid}, function(err,row) {
        if(err) return res.send(500,{result:'DB Error'});
        if(!row)
            BBoardsFollwoing({follower:userid,board:boardid}).save(function(err){
                if(err) return res.send(500,{result:'DB Error'});
                else return res.send(200,{result:'OK'});
            });
        else
            BBoardsFollwoing.remove({follower:userid,board:boardid}, function(err){
                if(err) return res.send(500,{result:'DB Error'});
                else return res.send(200,{result:'OK'});
            });
    });
});

app.get('/board/follow', function(req,res){

    if( !req.user )
        return res.send(501,{result:'Login first!'});

    var boardid = req.query.boardid;
    var userid = req.user._id;

    // Store Following Relationship Board
    BBoardsFollwoing.findOne({follower:userid,board:boardid}, function(err,row) {
        if(err) return res.send(500,{result:'DB Error'});
        if(!row) return res.send(200,{following:false});
        else return res.send(200,{following:true});
    });
});

app.get('/board/:id',function(req,res) {
    var boardid = req.params.id;
    var userid = (req.user) ? req.user._id : 'Unknow';

    // Find Board
    BBoards.findOne({_id:boardid}, function(err,board){
        if(err)
            return res.send('Oh oh error');
        if(!board)
            return res.send('404, Not Found! Yah!');

        // Find Flyers ID on this Board
        BFlyersBoards.find({board:boardid}, function(err,boardflyers){

            var flyersIDList = [];
            for(var i=0; i<boardflyers.length; i++)
                flyersIDList.push(boardflyers[i].flyer);

            // Find Flyers on this this Board
            BFlyers.find({_id: {$in:flyersIDList}}, function(err,flyers){

                // Check Owner Of Board is User Or Not
                BUsersBoards.count({board:board._id,user:userid}, function(err,count){
                    if( err ) return res.send('error');

                    var isOthersBoard = (count==0);

                    // add 'put-down' permission to flyers (board owner or flyer owner)
                    for(var i=0; i<flyers.length; i++)
                        flyers[i].putdownIsAllowed = (isOthersBoard==false || flyers[i].owner==userid);

                    res.render('board.ejs',{
                        title:board.name,
                        board:board,
                        flyers:flyers,
                        isOthersBoard: isOthersBoard
                    });

                });
            });
        });
    });
});

app.get('/flyer/new',function(req,res){
    var flyerid=req.cookies.flyerid;

    if(flyerid)
        res.redirect('/flyer/editor/0');
    else
        res.redirect('/flyer/template');
});

app.get('/flyer/template', function(req,res){
    res.render('flyerTemplate.ejs', {title:'Template Gallery'});
});

app.get('/flyer/:templateID/json/:id', function(req,res){

    //if(!checkUser(req,res))
    //    return;

    var flyerid = req.params.id;
    var templateID = req.params.templateID;

    if( templateID==0 ) { // Load stored flyer
        BFlyers.findOne({_id:flyerid}, function(err,flyer){
            if(err)
                res.send('Oh oh error');

            if(flyer)
                res.send(flyer.flyer);
            else
                res.send('404, Not Found! Yah!');
        });
    }
    else { // Load a pre-built template

        var templates = require('./templates.js');

        if( 0 < templateID && templateID < 10)
            res.send( templates.FlyerTemplates[ templateID ] );
        else
            res.send(200)
    }
});

app.get('/flyer/publish/:flyerid', function(req,res){
    var flyerid = req.params.flyerid;

    res.render('flyerPublish.ejs', {
        title:'Publish Flyer',
        flyerid:flyerid
    });
});

app.post('/flyer/publish', function(req,res){

    var flyer = req.body.flyer;


    BFlyers.update( {_id:flyer.flyerid}, {$set:{flyer:flyer, publishTime:new Date()}}, {upsert:true}, function(err){
            var tags=flyer.tags;
            if(!err){
                /*
                tags.forEach(function(tagName,i){
                    BTag.findOne({name:tagName}, function(err, tag){
                        if(tag){
                            BFlyersTags({
                                flyer:flyer.flyerid,
                                tag:tag._id
                            }).save();
                        }else{
                            var newtag = BTag({name:tagName});
                            newtag.save(function(){
                                var flyerTag = BFlyersTags({
                                    flyer:flyer.flyerid,
                                    tag:newtag._id});
                                flyerTag.save();
                            });
                        } });

                });
                */
                res.redirect('/profile');
            }else
                res.send(500,{result:'DB Error'});
        });

});

app.post('/flyer/inactive', function(req,res){

    var flyerID = req.body.flyerID;

    BFlyers.update( {_id:flyerID}, {$set:{publishTime:''}}, function(err){
        if(!err)
           res.send(200);
    });
});

app.post('/flyer/save', function(req,res){
    var flyer = req.body.flyer;

    BFlyers.update({_id:flyer.flyerid}, {$set:{flyer:flyer}}, function(err){
        if(err) return res.send(401,{});

        res.send(200,{});
    });
});

app.get('/flyer/embeded/:flyerID', function(req,res){

    res.render('flyerEditor.ejs',{
        title:'-',
        flyerid: req.params.flyerID,
        templateID: 0,
        editMode: false,
        viewMode: "embeded"
    });

})

app.get('/flyer/:mode/:tid', function(req,res){

    var flyerid;
    var boards = [];
    var templateID = req.params.tid;
    var editMode = (req.params.mode || 'view').toLowerCase() !== 'view';

    if( editMode && checkUser(req,res)==false )
        return;

    var renderNewFlyerView = function() {
        res.render('flyerEditor.ejs',{
            title:'Flyer Editor',
            boards:boards,
            flyerid:flyerid,
            templateID:templateID,
            editMode: editMode,
            viewMode: "fullpage"
        });
    }

    var getLastFlyer = function() {

        flyerid = req.query.flyerid;

        if( flyerid ) { // Edit Flyer
            if(editMode)
                res.cookie('flyerid',flyerid);
            renderNewFlyerView();
        }
        else {          // New Flyer
            flyerid = req.cookies.flyerid;
            if( !flyerid ) {
                var newflyer = BFlyers({owner:req.user._id});
                newflyer.save(function (err) {
                    flyerid = newflyer._id;
                    res.cookie('flyerid',flyerid);
                    renderNewFlyerView();
                });
            } else {
                BFlyers.count({_id:flyerid}, function(err,count){
                    if(!err && count>0)
                        renderNewFlyerView();
                    else {  // Flyer Draft is deleted.
                        // ToDo: Handle this situation better
                        res.clearCookie('flyerid');
                        return res.redirect('/flyer/new');
                    }
                });
            }
        }
    };

    var getPublicBoards = function() {
        BBoards.find({}, function (err, boardsList){
            boards = boardsList;
            getLastFlyer();
        });
    }

    getPublicBoards();
});

app.post('/flyer/putup', function(req,res){
    var flyerid = req.body.flyerid;
    var boardid = req.body.boardid;

    BFlyersBoards.count({flyer:flyerid,board:boardid}, function(err, count) {
        if( err )
            return res.send(401,{error:'DB Error'});
        if( count > 0 )
            return res.send(201, {error:'This Flyer is put up on this board already.'});

        BFlyersBoards({flyer:flyerid,board:boardid}).save(
            function(err){
                if(err)
                    return res.send(401,{error:'DB Error'});

                return res.send(200, {error:'The flyer is put up successfully.'});
            }
        )
    })

});
app.post('/flyer/putdown', function(req,res){
    var flyerid = req.body.flyerid;
    var boardid = req.body.boardid;

    BFlyersBoards.remove({flyer:flyerid,board:boardid}, function(err){
        if(err)
            return res.send(401,{error:'DB Error'});

        return res.send(200, {error:'The flyer is put down successfully.'});
    });

});
app.get('/flyer/remove/:id', function(req,res){
    if(checkUser(req,res)){
        var flyerid = req.params.id;
        BFlyers.findOne({_id:flyerid},function(err,flyer){
            if(flyer.owner==req.user._id){
                BFlyersBoards.remove({flyer:flyerid});
                BFlyers.remove({_id:flyerid},function(err){
                    if(!err)
                        res.redirect('/profile');
                    else
                        res.send('error deleting flyer:'+err);
                });

            }else
            {
                res.send(403, "You don't have permisson to remove this flyer");
            }
        });
    }
});

app.get('/board/remove/:id',function(req,res){

    var userid;
    if(checkUser(req,res)){
        if(req.user)
        {
            userid = req.user.id;
        }
        var boardid = req.params.id;
        BUsersBoards.findOne({user:userid},function(err,uboard){
            BBoards.findOne({_id:uboard.board},function(err){
                BBoards.remove({_id:boardid},function(err){
                    if(!err)
                        res.redirect('/profile');
                    else
                        res.send('error deleting board:'+err);
                });
                if(err)
                    res.send(403, "You don't have permisson to remove this board");
            });
            if(err){
                res.send(err);
            }
        });

    }

});
app.post('/flyer/take', function(req,res){

    if( !checkUser(req,res) )
        return;

    var flyerid = req.body.flyerid;
    var userid= req.user._id;

    BFlyersTickets.count({flyer:flyerid,user:userid}, function(err,count){

        if(count==0)
            BFlyersTickets({flyer:flyerid,user:userid}).save(function(err){
                if(err) res.send(501,{result:'DB Error!'});
                else res.send(200,{ticketed:true});
            });
        else
            BFlyersTickets.remove({flyer:flyerid,user:userid}, function(err){
                if(err) res.send(501,{result:'DB Error!'});
                else res.send(200,{ticketed:false});
            });
    });
});

app.get('/flyer/take', function(req,res){

    //if( !checkUser(req,res) )
    //    return;

    var flyerid = req.query.flyerid;
    var userid=  req.user ? req.user._id : '';

    BFlyersTickets.count({flyer:flyerid,user:userid}, function(err,count){
        if(count==0)
            res.send(200,{ticketed:false});
        else
            res.send(200,{ticketed:true});
    });
});

app.get('/flyer/:id', function(req,res){
    var flyerid = req.params.id;
    var userid = (req.user?req.user._id:'Unknow');

    BFlyers.findOne({_id:flyerid}, function(err,flyer){
        if(err)
            return res.send('Oh oh error');

        if(!flyer || !flyer.flyer)
            return res.send(404,{});

        var isOthersFlyer = (flyer.owner!=userid);

        if(flyer)
            res.render('flyer.ejs',{
                title:flyer.flyer.description,
                flyer:flyer,
                isOthersFlyer:isOthersFlyer
            });
        else
            res.send('404, Not Found! Yah!');
    });
});

app.get('/search/users', function(req,res){
    var query = req.query.q;

    // ToDo: Protect against SQLInjection Attack
    // ToDo: Complete Search Mechanics

    // Search in Users
    BUsers.find({email:{$regex : '.*'+ query +'.*'}}, function(err,users){
        if(err) return res.send('Error');
        if(!users) return req.send('Not Found');

        var results = [];
        for(var i=0; i<users.length; i++){
            results.push({
                rtype:'user',
                display:users[i].email,
                link:'/user/' + users[i]._id
            });
        }

        res.send(results);
    });
});

app.get('/search/boards/name', function(req,res){
    var query = req.query.q;

    // ToDo: Protect against SQLInjection Attack
    // ToDo: Complete Search Mechanics

    // Search in Boards
    BBoards.find({name:{$regex : '.*'+ query +'.*'}}, function(err,boards){
        if(err) return res.send('Error');
        if(!boards) return req.send('Not Found');

        var results = [];

        for(var i=0; i<boards.length; i++){
            results.push({
                rtype:'board',
                display:boards[i].name,
                link:'/board/' + boards[i]._id
            });
        }

        res.send(results);

    });

});

app.get('/search/boards/tag', function(req,res) {

    var tagName = req.query.q;

    BTag.findOne({name:tagName}, function(err, tag){

        if(tag){

            // Find all the boards with this tag
            BBoardsTags.find({tag:tag._id}, function(err, boards){

                if(err)
                    return res.send(500,{result:'DB Error'});

                // Create ID list
                var boardsIDList = [];
                for( var i=0; i<boards.length; i++ )
                    boardsIDList.push(boards[i].board);

                // Find boards
                BBoards.find({_id:{$in:boardsIDList}}, function(err, boardsDetail) {

                    if(err)
                        return res.send(500,{result:'DB Error'});

                    var results = [];

                    for(var i=0; i<boardsDetail.length; i++){
                        results.push({
                            rtype:'board',
                            display:boardsDetail[i].name,
                            link:'/board/' + boardsDetail[i]._id
                        });
                    }

                    res.send(results);
                })
            });
        }

    });

});

app.get('/timeline', function(req,res){

    if(checkUser(req,res)==false)
        return;

    var userid = req.user._id;

    // Find Board Which User Follows
    BBoardsFollwoing.find({follower:userid}, function(err,followingBoardRows){
        if(err) return res.send(500,{result:'DB Error'});

        var followingBoardsIDList = [];
        for(var i=0; i<followingBoardRows.length; i++)
            followingBoardsIDList.push(followingBoardRows[i].board);

        // Find flyers on following boards
        BFlyersBoards.find({board:{$in:followingBoardsIDList}}, function(err, flyerboardRows) {
            if(err) return res.send(500,{result:'DB Error'});

            var flyerIDList = [];
            for(var i=0; i<flyerboardRows.length; i++)
                flyerIDList.push(flyerboardRows[i].flyer);

            BFlyers.find({_id:{$in:flyerIDList}}, function (err, flyers) {
                res.render('timeline.ejs', {
                    title:'Timeline',
                    flyers:flyers
                });
            });
        });
    });
});

app.get('/user/:id',function(req,res){


    var PrepareAndRender = function(user) {
        FindUserBoards(user);
    }

    var FindUserBoards = function(user) {
        BUsersBoards.find({user:user._id}, function (err, userBoards) {
            if (err)
                return handleError(err);

            var boardsIDList = [];
            for(var i=0; i<userBoards.length; i++)
                boardsIDList.push(userBoards[i].board);

            FindUserBoardsDetails(user,boardsIDList);
        });
    }

    var FindUserBoardsDetails = function(user,boardsIDList) {
        BBoards.find({_id:{$in:boardsIDList}}, function(err, userBoard) {
            FindUserFlyers(user,userBoard);
        });
    }

    var FindUserFlyers = function(user,userBoards) {
        BFlyers.find({owner:user._id}, function (err, userFlyers) {
            FindUserFollowingBoards(user,userBoards, userFlyers);
        });
    }

    var FindUserFollowingBoards = function(user,userBoards,userFlyers) {
        BBoardsFollwoing.find({follower:user._id}, function(err,followingBoardRows){
            if(err) return res.send(500,{result:'DB Error'});

            var followingBoardsIDList = [];
            for(var i=0; i<followingBoardRows.length; i++)
                followingBoardsIDList.push(followingBoardRows[i].board);

            FindUserFollowingBoardsDetails(user,userBoards,userFlyers,followingBoardsIDList);
        });
    }

    var FindUserFollowingBoardsDetails = function(user,userBoards,userFlyers,followingBoardsIDList){
        BBoards.find({_id:{$in:followingBoardsIDList}}, function(err, followingBoards) {
            FindUserPocketedFlyer(user,userBoards,userFlyers,followingBoards);
        });
    }

    var FindUserPocketedFlyer = function(user,userBoards,userFlyers,followingBoards) {
        BFlyersTickets.find({user:user._id}, function(err,ticketedFlyersRows){

            var ticketFlyersIDList = [];
            for(var i=0; i<ticketedFlyersRows.length; i++)
                if(ticketedFlyersRows[i].flyer)
                    ticketFlyersIDList.push(ticketedFlyersRows[i].flyer);

            FindUserPocketedFlyerDetails(user,userBoards,userFlyers,followingBoards,ticketFlyersIDList);
        });
    }

    var FindUserPocketedFlyerDetails = function(user,userBoards,userFlyers,followingBoards,ticketFlyersIDList) {
        BFlyers.find({_id:{$in:ticketFlyersIDList}}, function(err,existTicketedFlyers){
            if(err) return res.send(500,{result:'DB Error'});


            process.nextTick( function() {
                var ticketedFlyers = [];

                for( var i=0; i<ticketFlyersIDList.length; i++ ) {

                    var foundIndex = -1;

                    for( var j=0; j<existTicketedFlyers.length; j++ ) {
                        if( existTicketedFlyers[j]._id == ticketFlyersIDList[j] ){
                            foundIndex = j;
                            break;
                        }
                    }

                    if( foundIndex >= 0 )
                        ticketedFlyers.push({
                            isDeleted:false,
                            flyer:existTicketedFlyers[foundIndex]
                        });
                    else
                        ticketedFlyers.push({
                            isDeleted:true
                        });
                }

                FindPublicBoard(user,userBoards,userFlyers,followingBoards,ticketedFlyers);
            });
        });
    }

    var FindPublicBoard = function(user,userBoards,userFlyers,followingBoards,ticketedFlyers) {
        BBoards.find({privacy:'public'},function(err,pBoards){

            // Add User's boards to public boards list (board which user can put on theme)
            pBoards = pBoards || [];
            Array.prototype.push.apply(pBoards, userBoards);

            RenderPage(user,userBoards,userFlyers,followingBoards,ticketedFlyers,pBoards);
        });
    }

    var RenderPage = function(user,userBoards,userFlyers,followingBoards,ticketedFlyers,pBoards) {

        res.render('profile.ejs',{
            title:'Profile',
            email:user.email,
            boards:userBoards,
            pBoards:pBoards,
            flyers:userFlyers,
            followingBoards:followingBoards,
            ticketedFlyers:ticketedFlyers
        });
    }


    BUsers.findOne({_id:req.params.id},function(err,user){
        if(user)
            PrepareAndRender(user);
        else
            res.redirect('/login');
    })
});

//endregion

//region AJAX endpoints
app.get('/flyer/:id/boards',function(req,res) {
    var flyerid = req.params.id;

    // Find Flyers ID on this Board
    BFlyersBoards.find({flyer:flyerid}, function(err,flyerBoards){

        var boardIDList = [];
        flyerBoards.forEach(function(board){
            boardIDList.push(board.board)
        });

        BBoards.find({_id:{$in:boardIDList}}, function(err,boards){
            // ToDo: Error Handling
            res.send(200, {boards:boards} );
        })
    });
});

app.get('/board/:id/flyers',function(req,res) {
    var boardid = req.params.id;

    // Find Board
    BBoards.findOne({_id:boardid}, function(err,board){
        if(err)
            return res.send(502);
        if(!board)
            return res.send(200);

        // Find Flyers ID on this Board
        BFlyersBoards.find({board:boardid}, function(err,boardflyers){

            var flyersIDList = [];
            for(var i=0; i<boardflyers.length; i++)
                flyersIDList.push(boardflyers[i].flyer);

            // Find Flyers on this this Board
            BFlyers.find({_id: {$in:flyersIDList}}, function(err,flyers){
                if( err ) return res.send(501);
                res.send(200, {flyers:flyers} );
            });
        });
    });
});
//endregion

//region Low Level API
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

function getPublicBoards(res,userid) {

    BBoards.find({privacy:'public'}, function(err,boards){
        if(err)
            return handleError(err);
        else {
            console.log('>>>>>>>>>>> boards numbers: ' + boards.length );
            res.send(200,boards);
        }
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

            BBoards.find({_id:{$in:boardIDList}}, function(err,boards){
                if(err)
                    return handleError(err);
                else {
                    console.log('>>>>>>>>>>> boards numbers: ' + boards.length );
                    res.send(200,boards);
                }
            });
        }
    });
}

function checkUser(req,res){
    //if(!req.user)
    if((req.session && req.session.auth && req.session.auth.loggedIn)==undefined){
        // Set last page url for redirecting after login
        req.session.lastPage = req.originalUrl;
        res.redirect('/login');
    }
    return req.user!=null;
}

function BLog(text){

    // Client side output
    // Server side output
    console.log('<<<<<BOOLTIN LOG>>>>>:' + text);
    io.sockets.emit('newlog', { log: text });
}

//endregion

//region RESTful API
/*
 About Login From iDevice:
 0- User Touch "Login With Google" button
 1- App Open This URL In The Default Browser: /idevice/auth/google
 2- Server Save a Cookie and Redirect Him To /auth/google
 3- Server Send Him to Google To Accept Our App Access
 4- Google Send Him to /auth/callback with A.T (Authentication Token)
 5- Server Save A.T, Generates a tempToken for Him and Re-Open App for Him and Send tempToken to App
 6- App Save tempToken and uses it to further access
 */

app.get('/api/1.0/ison', function(req,res){
    res.send(200,{status:'is on'});
});

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

app.post('/api/1.0/flyer/pocket', function(req,res) {
    var tempToken = req.body.tempToken;

    BUsers.findOne({tempToken:tempToken}, function(err,user){
        if(err) return handleError(err);
        if(!user) res.send(500,'Unauthorized')
        else {

            var flyerid = req.body.flyerid;
            var userid= user._id;

            BFlyersTickets.count({flyer:flyerid,user:userid}, function(err,count){

                if(count==0) {
                    console.log('>>>>>>>>>> Pocket flyer'+tempToken);
                    BFlyersTickets({flyer:flyerid,user:userid}).save(function(err){
                        if(err) res.send(501,{result:'DB Error!'});
                        else res.send(200,{ticketed:true});
                    });
                }
                else {
                    console.log('>>>>>>>>>> UNPocket flyer'+tempToken);

                    BFlyersTickets.remove({flyer:flyerid,user:userid}, function(err){
                        if(err) res.send(501,{result:'DB Error!'});
                        else res.send(200,{ticketed:false});
                    });
                }
            });
        }
    });

});

app.get('/api/1.0/flyer/pocket', function(req,res) {
    var tempToken = req.query.tempToken;

    BUsers.findOne({tempToken:tempToken}, function(err,user){
        if(err) return handleError(err);
        if(!user) res.send(500,'Unauthorized')
        else {

            BFlyersTickets.count({user:user._id,flyer:req.query.flyerid}, function(err,count) {
                if(err) return handleError(err);

                console.log('>>>>>>>>>> Is Flyer Pocketed? ' + count);

                return res.send(200, {isPocketed:(count!=0)} );
            })

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

app.get('/api/1.0/board/public', function(req,res) {
    var tempToken = req.query.tempToken;

    console.log('>>>>>>>>>>Getting Boards of '+tempToken);

    BUsers.findOne({tempToken:tempToken}, function(err,user){
        if(err) return handleError(err);
        if(!user) res.send(500,'Unauthorized')
        else {
            getPublicBoards(res,user._id);
        }
    });

});

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

app.post('/api/1.0/board/follow', function(req,res) {
    var tempToken = req.body.tempToken;

    BUsers.findOne({tempToken:tempToken}, function(err,user){
        if(err) return handleError(err);
        if(!user) res.send(500,'Unauthorized')
        else {

            var boardid = req.body.boardid;
            var userid= user._id;

            BBoardsFollwoing.count({board:boardid,follower:userid}, function(err,count){

                if(count==0) {
                    console.log('>>>>>>>>>> Follow Board'+tempToken);
                    BBoardsFollwoing({board:boardid,follower:userid}).save(function(err){
                        if(err) res.send(501,{result:'DB Error!'});
                        else res.send(200,{});
                    });
                }
                else {
                    console.log('>>>>>>>>>> UNFollow Board'+tempToken);

                    BBoardsFollwoing.remove({board:boardid,follower:userid}, function(err){
                        if(err) res.send(501,{result:'DB Error!'});
                        else res.send(200,{});
                    });
                }
            });
        }
    });

});

app.get('/api/1.0/board/follow', function(req,res) {
    var tempToken = req.query.tempToken;

    BUsers.findOne({tempToken:tempToken}, function(err,user){
        if(err) return handleError(err);
        if(!user) res.send(500,'Unauthorized')
        else {

            var boardid = req.query.boardid;
            var userid= user._id;

            BBoardsFollwoing.count({follower:userid,board:boardid}, function(err,count) {
                if(err) return handleError(err);

                console.log('>>>>>>>>>> Is Board Following? ' + count);

                return res.send(200, {isFollowing:(count!=0)} );
            })

        }
    });

});



//endregion
