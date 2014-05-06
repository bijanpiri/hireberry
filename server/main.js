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

util = require('util');
Promise = require('promise');
engine = require('ejs-locals');
crypto = require('crypto');
fs = require('fs');
http = require('http');
authentication = require('./authentication');
fileupload = require('./upload');
express = require('express');

app = express();

//region Configure Express
app.configure(function() {
    app.engine('ejs',engine);
    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/../views');
    app.use(express.logger('dev'));
    app.use(express.static(__dirname + '/../public'));
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


models = require('./models');
routerDashboard = require('./routers/dashboard');
utilities = require('./utilities');
routerFlyer = require('./routers/flyer');
generalFlyer = require('./routers/general');
teamFlyer = require('./routers/team');
application = require('./routers/application');
applicantRelationship = require('./routers/applicant');


