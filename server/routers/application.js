/**
 * Created by Bijan on 05/06/2014.
 */

app.get('/api/applications', function (req,res) {

    var submittedForms = {rows: []};

    var teamID = req.user.teamID;
    var userID = req.user ? req.user._id: '';
    var query = req.query.q || '';
    var jobFilter = req.query.j || '0';

    if( query ) {
        query = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"); // Regex escape
        query = query ? '(' + req.query.q.trim().replace(/ +/g,')|(') + ')' : ''; // Ask bijan about this line!
    }

    var sortBy = {applyTime:+1};
    if( req.query.sort === 'name' )
        sortBy = {name:+1}

    BTeams.count({_id:teamID,admin:userID}, function(err,count) {
        if( err )
            return res.send(204);

        if( count > 0 ) {   // User is admin
            if ( jobFilter!=='0' ) // Filter by job
                fetchApplications([jobFilter]);
            else
                fetchTeamFlyers( function(teamFlyersID) {
                    fetchApplications(teamFlyersID);
                })
        }
        else if(userID==='') { // Public Viewer
            return res.send(200)
        }
        else { // User is member

            if ( jobFilter!=='0' ) // Filter by job
                fetchApplications([jobFilter]);
            else
                fetchAssignedFlyers( function(userFlyersID) {
                    fetchApplications(userFlyersID);
                })
        }
    });

    function fetchApplications(flyersID,flyersName) {
//                    {$and:[
//                        {name : {$type:10}},
//                        {anythingelse : {$type:10}},
//                        {workPlace : {$type:10}},
//                        {skills: {$type:10}}]}
        BApplications.find( {
                flyerID:{$in:flyersID},
                $or:[ {name:new RegExp(query, "i")},
                    {anythingelse: new RegExp(query, "i")},
                    {workPlace: new RegExp(query, "i")},
                    {workTime: new RegExp(query, "i")},
                    {skills: new RegExp(query, "i")},
                    query?
                    {$and:[
                        {name : {$type:6}},
                        {anythingelse : {$type:6}},
                        {workPlace : {$type:6}},
                        {skills: {$type:6}}]}
                        :{}

                ]
            }
//                :{}}
        ).sort(sortBy).populate('flyerID').exec(function(err,forms) {
                if( err )
                    return res.send(303,{error:err});

                for( var i=0; i<forms.length; i++ ) {
                    var form = forms[i]._doc;

                    form.position = form.flyerID.flyer ? form.flyerID.flyer.description : '';

                    // Skills
                    var skills = form.skills.length==0 ? [] : JSON.parse( form.skills );

                    // Reason: When skills contains just one item, it convert to string automatically
                    if( typeof(skills) === 'string' )
                        skills = [skills];
                    form.skills = skills;

                    // Profiles
                    form.profiles = form.profiles || '{}';
                    var profiles = JSON.parse( form.profiles );
                    var selectedProfiles = {};
                    for (var profile in profiles)
                        if ( profiles.hasOwnProperty(profile) && profiles[profile]!=='' )
                            selectedProfiles[profile] = profiles[profile];
                    form.profiles = selectedProfiles;

                    // Apply Date
                    var date = new Date( form.applyTime );
                    form.applyTime = date.toLocaleDateString();

                    // Resume
                    form.resumePath = (form.resumePath==='-') ? '' : form.resumePath;

                    // Last Activity
                    if( form.activities && form.activities.length > 0 )
                        form.lastActivity = form.activities[form.activities.length-1]['type'];
                    else
                        form.lastActivity = 'NEW'

                    // Move stage if it is interview and the date is over
                    // ToDo: This task must be done by a crone job or something like this
                    checkNeedForChangingStage(form.stage,form._id);

                    submittedForms.rows.push( form );
                }

                return res.send({candidates:submittedForms.rows});
            })
    }

    function fetchTeamFlyers(callback) {
        BFlyers.find({owner:teamID}, function(err,flyers) {
            var teamFlyersID = flyers.map( function(flyer) { return flyer._id } );
            var teamFlyersName = flyers.map( function(flyer) { return flyer.name } );
            callback(teamFlyersID,teamFlyersName)
        });
    }

    function fetchAssignedFlyers(callback) {
        BFlyers.find({autoAssignedTo:userID}, function(err,flyers) {
            var userFlyersID = flyers.map( function(flyer) { return flyer._id } );
            var teamFlyersName = flyers.map( function(flyer) { return flyer.name } );
            callback(userFlyersID,teamFlyersName)
        });
    }

    function checkNeedForChangingStage(stage,applicationID) {

        if( stage.stage===2 && stage.subStage==3 ) { // Interview
            if( (new Date())  - (new Date(stage.interviewDate)) > 0 ) { // Date is over
                BApplications.update({_id:applicationID}, {
                    stage:{stage:2,subStage:4,interviewDate:stage.interviewDate}
                }, function(err) { res.send(200) })
            }
        }

    }
});

app.post('/api/applications/:applicationID',  function(req,res) {

    if( !checkUser(req,res) )
        return;

    if( req.body.activity )
        newActivity();
    else
        updateApplication();

    function updateApplication() {

        var nName = req.body.name;
        var nEmail = req.body.email;
        var nTel = req.body.tel;
        var nWebsite = req.body.website;
        var nNote = req.body.note;

        BApplications.update({_id:req.params.applicationID},{
            note: nNote,
            name: nName,
            email: nEmail,
            tel: nTel,
            website: nWebsite
        },function(err) {
            res.send(200);
        });
    }

    function newActivity() {
        var activities = [
            'Stage Changing',
            'Asking For Comment'
        ];

        var appID = req.params.applicationID;
        var activity = {
            type: activities[ req.body.activity ],
            data: req.body.data,
            timestamp: new Date()
        };

        if( req.body.activity == 0 ) { // Changing stage activity;

            // Inviting for an interview
            if( req.body.data.stage==2 && req.body.data.subStage==1 ) {

                BTeams.findOne({_id:req.user.teamID}, function(err,team){

                    var messageText = 'Dear ' + req.body.data.invitedName + ', <br>' +
                        'You are invited for interviewing at <b>' + req.body.data.interviewDate + '</b><br/>' +
                        'Let we know whether you will come or not.<br/><br/>' +
                        'Sincerely<br/>' +
                        team.name;


                    var message = {
                        "html": req.body.data.invitationMessage,
                        "text": req.body.data.invitationMessage ,
                        "subject": "Interview Invitation",
                        "from_email": "message.from_email@example.com",
                        "from_name": "Booltin",
                        "to": [{
                            "email": req.body.data.invitedEmail,
                            "name": "Recipient Name",
                            "type": "to"
                        }],
                        "headers": {
                            "Reply-To": "message.reply@example.com"
                        }
                    };

                    // 1- Save invitation
                    BApplicantsResponses({applicationID:appID,request:message,text:messageText}).save( function(err,invitation) {

                        // 2- Send invitation email
                        // ToDo: Change base url
                        message.html += '<a href="http://localhost:5000/applicant/message/view/1/' + invitation._id + '">Response to invitation</a>';
                        mandrill_client.messages.send({"message": message, "async": false}, function(result) {/*Succeed*/ }, function(e) {/*Error*/});

                        // 3- Save new stage
                        var newStage = {
                            stage: req.body.data.stage,
                            subStage: req.body.data.subStage,
                            invitation: invitation._id,
                            invitedName: req.body.data.invitedName,
                            interviewDate: req.body.data.interviewDate,
                            interviewTeam: req.user.teamID,
                            interviewer: req.user._id
                        };

                        BApplications.update({_id:appID}, {stage:newStage}, function(err) {

                            // 4- Add new activity
                            addNewActivity(appID,activity, function() {
                                res.send(200)
                            });
                        })
                    });
                });

            }
            // Job offer
            else if( req.body.data.stage==3 && req.body.data.subStage==1 ) {

                BTeams.findOne({_id:req.user.teamID}, function(err,team){

                    var messageText = 'Dear ' + req.body.data.offeredName + ', <br>' +
                        'You are offered a job.<br/>' +
                        'Let we know whether you will accept or not.<br/><br/>' +
                        'Sincerely<br/>' +
                        team.name;

                    var message = {
                        "html": req.body.data.offerMessage,
                        "text": req.body.data.offerMessage,
                        "subject": "Job Offer",
                        "from_email": "message.from_email@example.com",
                        "from_name": "Booltin",
                        "to": [{
                            "email": req.body.data.offeredEmail,
                            "name": "Recipient Name",
                            "type": "to"
                        }],
                        "headers": {
                            "Reply-To": "message.reply@example.com"
                        }
                    };

                    // 1- Save invitation
                    BApplicantsResponses({applicationID:appID,request:message,text:messageText}).save( function(err,invitation) {

                        // 2- Send invitation email
                        // ToDo: Change base url
                        message.html += '<a href="http://localhost:5000/applicant/message/view/2/' + invitation._id + '">Response to the offer</a>';
                        mandrill_client.messages.send({"message": message, "async": false}, function(result) {/*Succeed*/ }, function(e) {/*Error*/});

                        // 3- Save new stage
                        var newStage = {
                            stage: req.body.data.stage,
                            subStage: req.body.data.subStage
                        };

                        BApplications.update({_id:appID}, {stage:newStage}, function(err) {

                            // 4- Add new activity
                            addNewActivity(appID,activity, function() {
                                res.send(200)
                            });
                        })
                    });
                });

            }
            else {
                var newStage = {
                    stage: req.body.data.stage,
                    subStage: req.body.data.subStage
                };
                BApplications.update({_id:appID}, {stage:newStage}, function(err) {
                    addNewActivity(appID,activity, function() {
                        res.send(200)
                    });
                })
            }
        }
        else { // General Activities
            addNewActivity(appID,activity);
        }

        function addNewActivity(applicationID,activity,callback) {
            BApplications.update({_id:applicationID}, { $push:{activities:activity} }, function(err) {
                callback(err);
            })
        }
    }
});

app.head('/api/applications/applyByEmail/:teamID', function(req,res) {
    res.send(200);
});

app.post('/api/applications/applyByEmail/:teamID',  function(req,res) {

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

        //Upload attached files to Parse and save their links as resume
        //for(var filename in msg.attachments) {
        //msg.attachments[filename].content;
        //msg.attachments[filename].type;
        //resumeFileName = msg.attachments[filename].filename;
        //}

        BAppliedByEmail({
            teamID: req.params.teamID,
            name: msg["from_name"],
            from: msg["from_email"],
            subject: msg["subject"],
            text:  msg["html"],
            resume: resumeFileName
        }).save( function(err) {
                if( ++savedCounter == messagesCount )
                    res.send(200);
            });

    }

});

app.post('/api/team/application/askForComment', function(req,res){

    if( !checkUser(req,res) )
        return;

    //var userID = req.user._id;
    var userID = req.body.userID;
    var appID = req.body.appID;
    var note = req.body.note;
    var teamID = req.user.teamID;

    // Check whether current user is admin or not
    askForCommentOnApplication(note,userID,req.user._id, appID, teamID, function(err) {
        res.send(200)
    } );

});

app.get('/api/user/application/askedForComment',function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;
    var teamID = req.user.teamID;

    getAskedForCommentApplications(userID, teamID, function(err,applications) {
        res.send(200,{applications:applications});
    })
});

app.post('/api/application/:appID/visitedState',function(req,res){

    if(!checkUser(req,res))
        return;

    var userID = req.user._id;
    var appID = req.params.appID;
    var visitedState = req.body.visited;

    BApplications.findOne({_id:appID}).populate('flyerID').exec( function(err,application){

        // Check whether user is responder of job or not
        if( application.flyerID.autoAssignedTo.toString() === userID.toString() ) {
            BApplications.update({_id:appID},{visited:visitedState}, function(err) {
                if( err )
                    res.send(504);
                else
                    res.send(200);
            })
        }
        else
            res.send(304);
    });
});

app.post('/api/comments/mark-as-read',function(req,res){

    if(!checkUser(req,res))
        return;

    var userID = req.user._id;
    var teamID = req.user.teamID;
    var commentID = req.body.commentID;

    markCommentAsRead(userID, teamID, commentID,function(err){
        res.send(200, {});
    });
});

app.get('/api/application/comments',function(req,res){
    if(!checkUser(req,res))
        return;
    var appID=req.query.appID;
    getApplicationComments(appID,function(err,comments){
        res.send(200,
            {
                comments:comments,
                user:req.user._id
            });
    });
});

app.post('/api/application/comments',function(req,res) {
    if(!checkUser(req,res))
        return;

    var commentID=req.body.commentID;
    var comment=req.body.comment;
    BComments.update(
        {_id:commentID,commenter:req.user._id},
        {comment:comment,commentTime:new Date()},
        function(err,affected){
            if(affected==0)
                res.send(401)
            else if(err)
                res.send(500);
            else
                addNotification('commentOnApplication',{commentID:commentID}, function(){
                    res.send(200);
                })
        }
    )
});

app.get('/api/application/json/:appID', function(req,res) {

    if( !checkUser(req,res) )
        return;

    canCurrentUserAceessApplciation( req.user._id, req.params.appID, function(err,allowed,application) {
        if( err )
            return res.send(306);

        if(allowed)
            application._doc.currentUser = 'allowed';
        else
            application._doc.currentUser = 'denied';

        res.send(application);
    });
})

app.post('/api/application/:appID/note', function(req,res) {

    if( !checkUser(req,res) )
        return;

    canCurrentUserAceessApplciation( req.user._id, req.params.appID, function(err,allowed,application) {
        if( err || allowed==false)
            return res.send(306);
        else
            BApplications.update({_id:req.params.appID},{note:req.body.note},function(err) {
                res.send(200);
            })
    });

});

function canCurrentUserAceessApplciation(userID, appID, callback) {

    BApplications.findOne( {_id:appID}).exec(  function(err,application) {
        if( err )
            return callback(err,false,null);

        BFlyers.findOne({_id:application.flyerID}).populate('owner', 'admin').exec( function(err,flyer) {

            if( err )
                return callback(err,false,null);

            var teamID = flyer.owner.admin;
            var responderID = flyer.autoAssignedTo;

            if( userID.toString()===teamID.toString() || userID.toString()===responderID.toString())
                return callback(null,true,application);
            else
                return callback(null,false,application);
        })

    })
}