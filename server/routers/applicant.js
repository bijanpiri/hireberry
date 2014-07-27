/**
 * Created by coybit on 5/4/14.
 */

var request=require('request');
var Parse = require('parse').Parse;

//var APP_ID = '5zDqBqs1fKZXlB5LyQf4XAyO8L5IOavBnZ8w03IJ';
//var MASTER_KEY = 'qM1rJ9yEksZbNAYbY9CXx5hVlLBYuPU29n8v9vwR';
var APP_ID='qoMkGPujIUWxjrHi28WCcOoSrl755V8CgFYrdC59';
var JavaScript_Key='xCzRaCEshLWlg6XGvnBxLdRRcv6BRGNY4MUQhgvn';

//Parse.initialize(APP_ID, JavaScript_Key);
//var Resume=Parse.Object.extend("Resume");
app.get('/job/dropboxAuth', function (req,res){

    var flyerID = req.query.flyerid;

    dbclient.authenticate(function(error, client) {
        if (error)
            return res.send(502,{error:error})

        BFlyers.update( {_id:flyerID}, {dbToken:client._oauth._token}, function(err){

            if(!err)
                res.send(200, { token: client._oauth._token } )
        });

    });

    /*
     // Once-Time Authentication. See This: http://stackoverflow.com/a/16336113/946835
     dbclient.authDriver(new Dropbox.AuthDriver.NodeServer(8191));

     dbclient.authenticate(function(error, client) {
     if (error) {
     console.log("Some shit happened trying to authenticate with dropbox");
     console.log(error);
     return;
     }


     client.writeFile("test.txt", "sometext", function (error, stat) {
     if (error) {
     console.log(error);
     return;
     }

     console.log("file saved!");
     console.log(stat);
     });
     });
     */
} );

app.get('/liprofile/:q', function (req,res) {

    //***************************************************************************************
    //Reference code  :  https://github.com/tgig/Node.js-for-Bing-API/blob/master/web.js
    //***************************************************************************************
    var searchTerm = req.params.q.trim().replace(" ","%20")+"%20linkedin";
    var apiKey = 'Vxa0lRW5bpcIJx2yqL5QXC2u+g9wrsBf7kAXc+qIYRY';
    var callURI ='https://api.datamarket.azure.com/Bing/Search/v1/Web?$format=json&Query=%27'+searchTerm+'%27';

    var options = {
        method: 'GET',
        uri: callURI,
        headers: {
            'Authorization': 'Basic ' + new Buffer(apiKey + ':' + apiKey).toString('base64')
        }
    };

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            //return body;
            res.send(200,body);
        }
        else if (error) {
            console.log("error: " + error);
            //return 'error, check console log';
            res.send(500,'error, check console log');
        }
        else {
            console.log("Response code: " + response.statusCode + "\nContent: " + body);
            //return 'error, check console log';
            res.send(500,'error, check console log');
        }
    });

    //CoyBit code
    /*linkedin_client.apiCall('GET', '/people-search',
     {
     token: {
     oauth_token: '3eb3752a-f1c9-4221-9ea3-c555000bf673',
     oauth_token_secret: 'befb401a-4cc7-4b12-ae20-967a4246454f'
     },
     keyword: 'Mohsen%20Alijanpour'
     }
     , function (error, result) {
     res.send(200, {error:error,result:result} );
     }
     );*/
} )

app.get('/gravatar/:email', function (req,res){
    var crypto = require('crypto');
    var email = req.params.email.trim().toLowerCase();
    var md5 = require('crypto').createHash('md5').update(email).digest('hex');
    var path = 'public/gravatar/' + md5;

    var options = {
        host: 'www.gravatar.com',
        port: 80,
        path: '/avatar/' + md5
    }

    var request = http.get(options, function(response){
        var imagedata = ''
        response.setEncoding('binary')

        response.on('data', function(chunk){
            imagedata += chunk
        })

        response.on('end', function(){
            fs.writeFile(path, imagedata, 'binary', function(err){
                if (err)
                    throw err

                res.send(200, { url : '/gravatar/' + md5 } );
            })
        })

    })
} )

app.get('/twprofile/:q', function (req,res){

    try {
        twitter.search({ q : req.params.q },TwitterAccessToken,TwitterAccessTokenSecret, function(err, data, response){
            if(!err)
                res.send(data);
            else
                res.send({});
        });
    }
    catch(e) {
        res.send({})
    }
})

app.post('/apply', function (req,res) {

    var incomingSource = req.body.isInternalApply ? 'A teammate added this applicant' : 'Applicant sent application';

    var resumeFileName;
    var resumeUrl=req.body.resumeUrl;

    if( req.files && req.files.resume && req.files.resume.size > 0 )
        resumeFileName = req.files.resume.path.replace(/^.*[\\\/]/, '') + req.files.resume.name;
    else
        resumeFileName = '-';

    var skills = req.body.skill;

    var profiles = {
        github: req.body.ghprofile,
        stackoverflow: req.body.soprofile,
        dribbble: req.body.drprofile,
        behance: req.body.beprofile,
        linkedin: req.body.liprofile,
        twtitter: req.body.twprofile
    }

    // ToDo: Save Form In The Database
    BApplications({
        flyerID: req.body.flyerid,
        name:req.body.name,
        email:req.body.email,
        tel:req.body.tel,
        website:req.body.website,
        avatarURL: req.body.avatarURL,
        applyTime: new Date(),
        skills:JSON.stringify(skills),
        workPlace:req.body.workPlace,
        workTime:req.body.workTime,
        profiles:JSON.stringify(profiles),
        anythingelse:req.body.anythingElse,
        resumePath: resumeUrl || resumeFileName,
        stage: { stage:1, subStage:1 },
        activities:[{type:incomingSource, timestamp:new Date()}]
    }).save( function(err, application) {
        if(err){
            res.send(404,{});
        } else {
            uploadResume( application._id );
        }
    });

    var uploadResume = function( applicationID ) {
        if( req.files && req.files.resume && req.files.resume.size > 0 ) {

            // Read from temp file
            fs.readFile(req.files.resume.path, function (err, data) {

                // Find dropbox token
                BFlyers.findOne( {_id:req.body.flyerid}, function(err,flyer) {

                    if( flyer.dbToken )
                        saveOnDropbox( flyer.dbToken, data, resumeFileName, function(err,fileUrl) {
                            BApplications.update({_id:applicationID},{resumePath:fileUrl}, function() {
                                res.send(200,{applicationID:applicationID});
                            });
                        });
//                    else
//                        saveOnParse( data, resumeFileName, applicationID);
                })
            });
        }
        else {
            res.send(200,{applicationID:applicationID});
        }
    }
} );

function saveOnDropbox( dbToken, data, resumeFileName, applicationID ) {

    var dbclient = new Dropbox.Client({
        key: "7bdvs2t8zrdqdw8",
        secret: "5y37uqs64t0f3gc",
        sandbox     : false,
        token       : dbToken,
        tokenSecret : '5y37uqs64t0f3gc'
    });

    // ToDo: Choose Unique Name
    dbclient.writeFile(resumeFileName, data, function(error, stat) {
        if (error) {
            return showError(error);  // Something went wrong.
        }

        fs.unlink( req.files.resume.path );

        // Create Share Link
        dbclient.makeUrl(resumeFileName,{}, function(err,data) {
            if( !err )
                callback( null, data.url );
            else
                callback( err, null );
        })

    });

}

app.post('/parse/upload', function(req,res){
    if( req.files && req.files.resume && req.files.resume.size > 0 ) {

        Buffer.prototype.toByteArray = function () {
            return Array.prototype.slice.call(this, 0)
        }

        // Read from temp file
        fs.readFile(req.files.resume.path, function (err, data) {
            var byteArray = data.toByteArray();
            byteArray = {base64:tbase64};
            saveOnParse( byteArray, 'testfile.txt', 'test', function(err, fileUrl) {
                console.log(fileUrl);
            });
        });
    }
});

function saveOnParse( data, filename, callback ) {
    var file = new Parse.File( filename, data );

    file.save().then(function() {

        console.log('+++++++++++'+file.url());

        callback( null, file.url() );
    }, function(error) {
        callback( error, null);
    });
}

app.get('/api/resume', function(req,res) {

    var resumeURI = decodeURI(req.query.f);

    request({
        uri: resumeURI,
        method: "GET",
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10
    }, function(error, response, body) {
        // ToDo: Convert this byte array to file and send to client
        res.send(200, JSON.parse(body) );
    });
} );

app.post('/api/resume', function(req,res) {

    if( !req.user )
        res.send(304);

    var resumeURI = decodeURI(req.body.resume);
    var applicationID = req.body.applicationID;
    var userID = req.user._id;

    canCurrentUserAceessApplciation( userID, applicationID, function(err,can) {
        if( can ) {
            BApplications.update({_id:applicationID},{resumePath:resumeURI}, function(err) {
                res.send(200);
            });
        }
        else {
            res.send(304);
        }
    });
});


app.head('/api/applications/applyByEmail/:teamID', function(req,res) {
    res.send(200);
});

app.post('/api/applications/applyByEmail/:formID',  function(req,res) {

    var messages = JSON.parse(req.body.mandrill_events);
    var messagesCount = messages.length;
    var savedCounter = 0;

    if(messagesCount==0)
        return res.send(200);

    for( var i=0; i<messagesCount; i++ ) {


        var resumeFileName = '';
        var resumeContent = '';
        var resumeType = '';
        var msg = messages[i].msg;

        //Upload attached files to Parse and save their links as resume
        for(var filename in msg.attachments) {
            resumeContent = msg.attachments[filename].content;
            resumeType = msg.attachments[filename].type;
            resumeFileName = msg.attachments[filename].filename;
        }

        console.log('++++ type: ' + resumeType );
        console.log('++++ filename: ' + resumeFileName );

        BAppliedByEmail({email:resumeContent}).save( function(err) {
            BApplications({
                flyerID: req.params.formID,
                name: msg["from_name"],
                email: msg["from_email"],
                applyTime: new Date(),
                anythingelse: msg["html"],
                //resumePath: resumeUrl || resumeFileName,
                stage: { stage:1, subStage:1 },
                activities:[{type:'Application is sent (by email)',timestamp:new Date()}]
            }).save( function(err, application) {
                    uploadResume( application._id, req.params.formID, resumeFileName, resumeContent, function() {
                        if( ++savedCounter == messagesCount )
                            res.send(200);
                    });
                });
        });
    }


    /*
     base64: false
     content: "FILE TEXT"
     name: "filename.txt"
     type: "text/plain"
     */

    var uploadResume = function( applicationID, flyerID, resumeFilename, resumeContent, callback ) {
        BFlyers.findOne( {_id:flyerID}, function(err,flyer) {

            //console.log('Saving ', resumeFilename, flyerID, resumeContent);

            // ToDo: Implement saving resume
            if( flyer.dbToken )
                saveOnDropbox( flyer.dbToken, resumeContent, resumeFilename, function(err,fileUrl) {
                    BApplications.update({_id:applicationID},{resumePath:fileUrl}, function() {
                        callback();
                    });
                });
            else
                resumeContent = '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';

                console.log('++++ saving ...' );

                saveOnParse( {base64:resumeContent}, resumeFileName || 'no-name', function(err,fileUrl) {

                    console.log('++++ saved ' + fileUrl );

                    BApplications.update({_id:applicationID},{resumePath:fileUrl}, function() {
                      callback();
                   });

                });
        });
    }
});

// Mark as read
app.post('/applicant/message/notified/:messageID', function (req,res){

    var messageID = req.params.messageID;

    // ToDo: Check whether current user is responder or not.

    BApplicantsResponses.update({_id:messageID},{responderNotified:true}, function(err){
        res.send(200);
    })
});

// Show message to applicant
app.get('/applicant/message/view/:messageType/:messageID', function (req,res){

    BApplicantsResponses.findOne({_id:req.params.messageID}, function(err,message) {

        if( message.response ) {
            res.send(200,'This invitation is responded already!')
        }
        else

            res.render('applicant.ejs', {
                messageType: req.params.messageType,
                messageID: req.params.messageID,
                messageText: message.text
            });

    });
});

// Save response of applicant
app.get('/applicant/message/:messageType/:messageID', function (req,res){

    var messageID = req.params.messageID;
    var messageType = req.params.messageType.toLowerCase();
    var response = req.query.response;

    BApplicantsResponses.update({_id:messageID,response:{$exists:false}},{response:response}, function(err,count){

        if( err)
            return res.send(403);

        if(count == 0)
            return res.send(200,'You\'ve responded to this request');

        // Move application to next stage (response is received)
        BApplicantsResponses.findOne({_id:messageID}).populate('applicationID').exec( function(err,message){

            var newStage = {};

            if( messageType==='1' ) { // Interview invitation
                    newStage = ( response==="1") ? {stage:2,subStage:3} : {stage:2,subStage:2};

                if( response==="1" ){
                    updateEvent(message.event,
                        'Interview with ' + message.applicationID.stage.invitedName,
                        message.applicationID.stage.interviewDate,
                        message.applicationID.stage.interviewer,
                        message.applicationID.stage.interviewTeam,
                        false,
                        message.applicationID, function() {});

                    // ToDo: Notify responder & HM
                }
                else {
                    deleteEvent(message.event, function(){});
                }
            }
            else if(messageType==='2' ) { // Job offer
                newStage = ( response==="1") ? {stage:3,subStage:2} : {stage:3,subStage:3}

                if( response==="1" ){
                    // ToDo: Notify responder & HM
                }
            }

            BApplications.findOne( {_id:message.applicationID}, function(err,application){

                newStage.interviewDate = application.stage.interviewDate;

                var activity = {
                    type: 'Stage Changing', // ToDo: Use constant for type instead of literal
                    data: newStage,
                    timestamp: new Date()
                };

                BApplications.update( {_id:message.applicationID}, {stage:newStage,$push:{activities:activity}}, function(err){
                    return res.render('applicant.ejs');
                })

            })

        })

    })

});

// Get response of applicant
app.get('/applicant/message/:messageID', function (req,res){

    var messageID = req.params.messageID;

    BApplicantsResponses.find({_id:messageID}, function(err,message){
        res.send(200,message.response);
    })
});



