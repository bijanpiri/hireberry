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

if(process.argv.indexOf('--client')>=0)
    mongoHQConenctionString = 'mongodb://127.0.0.1:27017/booltindb';

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
    tempToken:String
});

BFlyers = mongoose.model( 'flyers', {
    flyer: Object,
    owner: String,
    publishTime: String,
    disqusShortname: String,
    dbToken:String
});

BTeam = mongoose.model( 'teams', {
    name: String,
    admin: String,
    members: []
})

BInvitation = mongoose.model( 'invitation', {
    inviterTeam: String,
    invitedEmail: String,
    inviteTime: String
})

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
                    email: linkedinUserMetadata.emailAddress,
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

// region Flyers
app.get('/flyer/new',function(req,res){
    var flyerid=req.cookies.flyerid;
    res.redirect('/flyer/editor/0');
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
            if(!err){
                res.send(200);
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
        viewMode: "embeded",
        existFlyer: true
    });

})

app.get('/flyer/:mode/:tid', function(req,res){

    var flyerid;
    var templateID = req.params.tid;
    var editMode = (req.params.mode || 'view').toLowerCase() !== 'view';
    var existFlyer = false;
    var flyerName = '';

    if( editMode && checkUser(req,res)==false )
        return;

    var renderNewFlyerView = function() {
        res.render('flyerEditor.ejs',{
            title:'Flyer Editor',
            boards:[],
            flyerid:flyerid,
            templateID:templateID,
            editMode: editMode,
            viewMode: "fullpage",
            existFlyer: existFlyer
        });
    }

    var getLastFlyer = function() {

        flyerid = req.query.flyerid;

        if( flyerid ) { // Edit Flyer (FlyerID is passed by Query String)
            if(editMode)
                res.cookie('flyerid',flyerid);
            existFlyer = true;
            renderNewFlyerView();
        }
        else {          // Query String is empty
            flyerid = req.cookies.flyerid;

            if( !flyerid ) {        // Cookie is empty. So make a new flyer

                var newflyer = BFlyers({owner:req.user._id});
                newflyer.save(function (err) {
                    flyerid = newflyer._id;
                    res.cookie('flyerid',flyerid);
                    renderNewFlyerView();
                });

            } else {        // Cookie isn't empty. So laod it
                BFlyers.count({_id:flyerid}, function(err,count){
                    if(!err && count>0){
                        existFlyer = true;
                        renderNewFlyerView();
                    }
                    else {  // Flyer Draft is deleted.
                        // ToDo: Handle this situation better
                        res.clearCookie('flyerid');
                        return res.redirect('/flyer/new');
                    }
                });
            }
        }
    };

    getLastFlyer();
});

app.get('/flyer/remove/:id', function(req,res){
    if(checkUser(req,res)){
        var flyerid = req.params.id;
        BFlyers.findOne({_id:flyerid},function(err,flyer){
            if(flyer.owner==req.user._id){

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

// endregion

// region Team
app.post('/team/invite', function(req,res){

    if( checkUser(req,res) )
        return;

    var userID = req.user._id;
    var teamID = '';
    var invitedEmail = req.body.email;

    // ToDo: Find in user's team and send invitation behind team to email address

    res.send(200);
});

app.get('/user/invitations', function(req,res){

    if( checkUser(req,res) )
        return;

    var userID = req.user._id;
    var email = req.user.email;

    // ToDo: Find in invitation list

    res.send(200,{
        invited:'no'
    });
});

app.post('/team', function(req,res){

    if( checkUser(req,res) )
        return;

    var userID = req.user._id;
    var teamName = req.body.teamName;

    // ToDo: Create team and add user as its admin

    res.send(200);
});

app.post('/team/member', function(req,res){

    if( checkUser(req,res) )
        return;

    var userID = req.user._id;
    var teamID = req.body.teamID;

    // ToDo:

    res.send(200);
});

app.post('/team/admin', function(req,res){

    if( checkUser(req,res) )
        return;

    var adminID = req.body.userID;
    var teamID = req.body.teamID;

    // ToDo:

    res.send(200);
});

// endregion

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

app.get('/user/:id',function(req,res){
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

app.delete('/api/1.0/flyer', function(req,res) {
    var tempToken = req.query.tempToken;
    var flyerid = req.query.flyerid;

    console.log('>>>>>>>>>>Removing flyer '+tempToken);

    // ToDo: Check ownership of flyer
});

//endregion
