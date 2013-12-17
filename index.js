/**
 * Created by bijan on 12/17/13.
 */
var express = require('express')
//    , stylus = require('stylus')
//    , nib = require('nib');

var app = express();
//function compile(str, path) {
//    return stylus(str)
//        .set('filename', path)
//        .use(nib())
//}
app.configure(function(){
//    app.use(express.static('public'))
    app.use(express.static(__dirname + '/public'));
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.logger('dev'));


});

app.get('/', function (req, res) {
    res.render('login.ejs',{title:'title2'});
});


app.listen(3000);

