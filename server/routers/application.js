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
                    var form = prepareApplicationForClient( forms[i]._doc );

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
        BFlyers.find({ $or:[{autoAssignedTo:userID},{commentators:userID}] }, function(err,flyers) {
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
                        'Sincerely<br/>' + team.name;

                    var emailBody = req.body.data.invitationMessage || '';
                    var message = {
                        "html": emailBody.replace('\n','<br/>'),
                        "text": emailBody.replace('\n','\r\n') ,
                        "subject": "Interview Invitation",
                        "from_email": emailConfig.fromAddress,
                        "from_name": team.name,
                        "to": [{
                            "email": req.body.data.invitedEmail,
                            "name": req.body.data.invitedName,
                            "type": "to"
                        }],
                        "headers": {
                            "Reply-To": emailConfig.replyAddress
                        }
                    };

                    // 1- Save invitation
                    BApplicantsResponses({applicationID:appID,request:message,text:messageText}).save( function(err,invitation) {

                        // 2- Send invitation email
                        // ToDo: Change base url
                        message.html += '<br/></br><a href="'+ req.headers.origin +'/applicant/message/view/1/' + invitation._id + '">Click here to response to invitation</a>';
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
                        'Sincerely<br/>' + team.name;

                    var emailBody = req.body.data.invitationMessage || '';
                    var message = {
                        "html": emailBody.replace('\n','<br/>'),
                        "text": emailBody.replace('\n','\r\n') ,
                        "subject": "Interview Invitation",
                        "from_email": emailConfig.fromAddress,
                        "from_name": team.name,
                        "to": [{
                            "email": req.body.data.invitedEmail,
                            "name": req.body.data.invitedName,
                            "type": "to"
                        }],
                        "headers": {
                            "Reply-To": emailConfig.replyAddress
                        }
                    };

                    // 1- Save invitation
                    BApplicantsResponses({applicationID:appID,request:message,text:messageText}).save( function(err,invitation) {

                        // 2- Send invitation email
                        // ToDo: Change base url
                        message.html += '<a href="' + req.headers.origin + '/applicant/message/view/2/' + invitation._id + '">Response to the offer</a>';
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

app.post('/api/application/:appID/visitedState',function(req,res){

    if(!checkUser(req,res))
        return;

    var userID = req.user._id;
    var appID = req.params.appID;
    var visitedState = req.body.visited;

    BApplications.findOne({_id:appID})
        .populate('flyerID')
        .exec( function(err,application){

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

function notifyAllForAppComment(app,commentator) {
    var job=app.flyerID;
    var users={};
    job.commentators.forEach(function(c){users[c]=true;});
    users[job.autoAssignedTo]=true;
    delete users[commentator];

    var now=Date.now();
    var notifs=Object.keys(users).map(
        function(userId){
            return {time:now,visited:false,user:userId,app:app._id};
        });

    notifs.forEach(function(not){BAppNotification(not).save();});
}
app.post('/api/application/:appID/comment', function(req,res) {
    // Add a new comment on this application

    BApplications.findOne({_id:req.params.appID})
        .populate('flyerID','commentators autoAssignedTo')
        .exec( function(err,application) {
        if( err || !application )
            return res.send(404);

        canCurrentUserLeaveComment(req.user._id, req.user.teamID, application.flyerID,
            function(err,can){

                if(!err && can) {
                    BApplicationComments({
                        team: req.user.teamID,
                        user: req.user._id,
                        application: req.params.appID,
                        text: req.body.text,
                        date: new Date()
                    }).save( function(err,newComment) {

                        // ToDo: Implement Notification Strategy Here

                        BApplicationComments.findOne({_id:newComment._id})
                            .populate('user','displayName email')
                            .exec(function(err,newComment) {
                                res.send(200, newComment);
                            });
                        notifyAllForAppComment(application,req.user._id);
                    });
                }
            });
        });
});
app.get('/api/application/:appID/comments', function(req,res) {
    // Get all comments on this application

    BApplications.findOne({_id:req.params.appID}, function(err,application) {

        if( err || !application )
            return res.send(404);

        canCurrentUserLeaveComment(req.user._id,req.user.teamID,application.flyerID,function(err,can){
            if(!err && can) {
                BApplicationComments.find({application: req.params.appID})
                    .populate('user','displayName email')
                    .exec(function(err,comments) {
                        res.send(200,{comments:comments});
                    });
            }
        });

    });
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

        application = prepareApplicationForClient(application._doc)

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

function prepareApplicationForClient(form) {
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

    return form;
}

function canCurrentUserAceessApplciation(userID, appID, callback) {

    BApplications.findOne( {_id:appID}).populate('flyerID').exec(  function(err,application) {
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