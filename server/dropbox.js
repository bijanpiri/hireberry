/**
 * Created by Bijan on 04/29/2014.
 */
Dropbox = require("dropbox"); // https://github.com/evnm/dropbox-node


dbclient = new Dropbox.Client({
    key: "7bdvs2t8zrdqdw8",
    secret: "5y37uqs64t0f3gc",
    sandbox     : false
    //token       : 'tf6jvJZK81wAAAAAAAAAAZiljBK7q8eeXWVAllN7Ipq2dzVdOH89XfcS-xcUZDeA',
    //tokenSecret : '5y37uqs64t0f3gc'
});
dbclient.authDriver(new Dropbox.AuthDriver.NodeServer(8191));

