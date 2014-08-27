var compression = require('compression')

mandrill = require('mandrill-api/mandrill');
mandrill_client = new mandrill.Mandrill('suHojSqi5KWbijUgT-nzsQ');

Dropbox = require("dropbox"); // https://github.com/evnm/dropbox-node
dbclient = new Dropbox.Client({
    key: "7bdvs2t8zrdqdw8",
    secret: "5y37uqs64t0f3gc",
    sandbox     : false
    //token       : 'tf6jvJZK81wAAAAAAAAAAZiljBK7q8eeXWVAllN7Ipq2dzVdOH89XfcS-xcUZDeA',
    //tokenSecret : '5y37uqs64t0f3gc'
});
dbclient.authDriver(new Dropbox.AuthDriver.NodeServer(8191));

var APP_ID = '5zDqBqs1fKZXlB5LyQf4XAyO8L5IOavBnZ8w03IJ';
var MASTER_KEY = 'Sp6Folp3xhpVlphiJ8MyuEfbhg67iqy8hCESnc3L';
Parse = require('parse').Parse;
Parse.initialize(APP_ID,MASTER_KEY);

emailConfig = {
    from: "Hireberry",
    fromAddress: "job@hireberry.com",
    replyAddress: "no-reply@hireberry.com",
    returnBackHost: 'www.hireberry.com'
};

util = require('util');
Promise = require('promise');
engine = require('ejs-locals');
crypto = require('crypto');
fs = require('fs');
http = require('http');
authentication = require('./etc/authentication');
//fileupload = require('./etc/upload');
express = require('express');

app = express();
var cwd=process.cwd();

//region Configure Express
app.configure(function() {
    app.engine('ejs',engine);
    app.set('view engine', 'ejs');
    app.set('views', cwd+ '/views');
    app.use(compression()); // This middleware should be one of the first you "use" to ensure all responses are compressed.
    app.use(express.logger('dev'));
    app.use(express.static(cwd+'/public'));
    app.use(express.logger());
    app.use(express.cookieParser());
//    app.use('/flyer/upload', upload.fileHandler());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.session({
        secret: 'keyboard cat',
        maxAge: false, //1 Hour
        expires: false //1 Hour
    }));
    app.use(sessionLogin);
    app.use(autoLogin);
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

models = require('./etc/models');
dashboardRouters = require('./routers/dashboard');
utilitiesRouters = require('./etc/utilities');
billing = require('./routers/billing');
jobRouters = require('./routers/job');
generalRouters = require('./routers/general');
teamRouters = require('./routers/team');
applicationRouters = require('./routers/application');
applicantRelationshipRouters = require('./routers/applicant');


function sessionLogin(req, res, next) {


    var sessionCookie= req.cookies['bltn.session.login'];
    if(sessionCookie)
    {
        var cookieContent=sessionCookie.split('&');
        login=cookieContent[0];
        var token=cookieContent[1];
        BUsers.findOne({ email: login}, function (err, user) {
            if (err)
                return next();

            console.log(user);

            if (!user)
            {
                res.clearCookie('bltn.session.login');
                return next();
            }

            if(!user.password || !user.salt)
            {
                res.clearCookie('bltn.session.login');
                return next();
            }
            var password_token = user.password.toString('base64');

            var eq=true;
            var password_token =user.password.toString('base64');
            if(token!==password_token)
                eq=false;
            if(!eq)
            {
                res.clearCookie('bltn.persistent.login');
                return next();
            }
            else
            {
                req.user = user;
                var auth = req.session && req.session.auth;
                var everyauthLocal = auth || {};
                everyauthLocal.loggedIn = true;
                everyauthLocal.user = user;
                everyauthLocal.userId = user._id;

                req.session.auth = everyauthLocal;

                res.locals.everyauth = everyauthLocal;
                res.locals['user'] = req.user;

                return next();
            }
        });
    }

    else {
        return next();
    }
}

function autoLogin(req, res, next) {

    var persitCookie = req.cookies['bltn.persistent.login'];

    if(persitCookie) {
        var cookieContent = persitCookie.split('&');
        var login = cookieContent[0];

        BPersistLogin.findOne({token: cookieContent[1]}, function (err, user) {
            if (err){
                res.clearCookie('bltn.persistent.login');
                return next();
            }
            else if(!user) {
                res.clearCookie('bltn.persistent.login');
                return next();
            }
            else {
                var exipreDate = new Date(user.expireDate);

                if(exipreDate && exipreDate < new Date()) {

                    //If expire date is invalid remove info from database and clear cookie
                    var cookieContent = req.cookies['bltn.persistent.login'].split('&');

                    BPersistLogin.remove({username : cookieContent[0], token: cookieContent[1]});
                    res.clearCookie('bltn.persistent.login');

                    return next();
                }
            }
            if (!login)
                return next();

            BUsers.findOne({email: login}, function (err, user) {
                if (err || !user)
                    return next();

                req.user = user;
                var auth = req.session && req.session.auth;
                var everyauthLocal = auth || {};
                everyauthLocal.loggedIn = true;
                everyauthLocal.user = user;
                everyauthLocal.userId = user._id;

                req.session.auth = everyauthLocal;

                res.locals.everyauth = everyauthLocal;
                res.locals['user'] = req.user;

                return next();
            });
        });
    }
    else {
        return next();
    }
}