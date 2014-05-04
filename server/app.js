/**
 * Created by Bijan on 04/29/2014.
 */

app = express();

// For Sending Logs to Client Console Output
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
server.listen(5001);

// Mandrill
mandrill_client = new mandrill.Mandrill('suHojSqi5KWbijUgT-nzsQ');

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
