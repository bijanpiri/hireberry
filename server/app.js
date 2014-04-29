/**
 * Created by Bijan on 04/29/2014.
 */

app = express();

// For Sending Logs to Client Console Output
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
server.listen(5001);
