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

    var resumeFileName;
    var resumeUrl=req.body.resumeUrl;

    if(  req.files.resume && req.files.resume.size > 0 )
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
        activities:[{type:'Application is sent',timestamp:new Date()}]
    }).save( function(err, application) {
        if(err){
            res.send(404,{});
        } else {
            uploadResume( application._id );
        }
    });

    var uploadResume = function( applicationID ) {
        if( req.files.resume && req.files.resume.size > 0 ) {

            // Read from temp file
            fs.readFile(req.files.resume.path, function (err, data) {

                // Find dropbox token
                BFlyers.findOne( {_id:req.body.flyerid}, function(err,flyer) {

                    if( flyer.dbToken )
                        saveOnDropbox( flyer.dbToken, data, resumeFileName, applicationID );
//                    else
//                        saveOnParse( data, resumeFileName, applicationID);
                })
            });
        }
        else {
            res.send(200,{});
        }
    }


    var saveOnDropbox = function( dbToken, data, resumeFileName, applicationID ) {

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
                    BApplications.update({_id:applicationID},{resumePath:data.url}, function() {
                        res.send(200,{});
                    });
                else
                    res.send(200,{});

            })

        });

    }
} );

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

        var msg = messages[i].msg;

        /*
         base64: false
         content: "FILE TEXT"
         name: "filename.txt"
         type: "text/plain"
         */

        var resumeFileName = '';
        var resumeContent = '';
        var resumeType = '';
        //Upload attached files to Parse and save their links as resume
        for(var filename in msg.attachments) {
            resumeContent = msg.attachments[filename].content;
            resumeType = msg.attachments[filename].type;
            resumeFileName = msg.attachments[filename].filename;
        }

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

                uploadResume( application._id, req.params.formID, resumeFileName, resumeContent );

                if( ++savedCounter == messagesCount )
                    res.send(200);
            });

        var uploadResume = function( applicationID, flyerID, resumeFilename, resumeContent ) {
            BFlyers.findOne( {_id:flyerID}, function(err,flyer) {

                console.log('Saving ', resumeFilename, flyerID, resumeContent);

                // ToDo: Implement saving resume
                if( flyer.dbToken )
                    ;//saveOnDropbox( flyer.dbToken, resumeContent, resumeFilename, applicationID );
                else
                    ;//saveOnParse( resumeContent, resumeFileName, applicationID);
            });
        }
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
app.post('/applicant/message/:messageType/:messageID', function (req,res){

    var messageID = req.params.messageID;
    var messageType = req.params.messageType.toLowerCase();
    var response = req.body.response;

    BApplicantsResponses.update({_id:messageID},{response:response}, function(err){

        // Move application to next stage (response is received)
        BApplicantsResponses.findOne({_id:messageID}).populate('applicationID').exec( function(err,message){

            var newStage = {};

            if( messageType==='1' ) { // Interview invitation
                    newStage = ( response==="YES") ? {stage:2,subStage:3} : {stage:2,subStage:2}

                if( response==="YES" ){
                    addEvent('Interview with ' + message.applicationID.stage.invitedName,
                        message.applicationID.stage.interviewDate,
                        message.applicationID.stage.interviewer,
                        message.applicationID.stage.interviewTeam, function() {})

                    // ToDo: Notify responder & HM
                }
            }
            else if(messageType==='2' ) { // Job offer
                newStage = ( response==="YES") ? {stage:3,subStage:2} : {stage:3,subStage:3}

                if( response==="YES" ){
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

                    res.send(200);
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



