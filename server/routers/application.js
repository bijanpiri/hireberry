/**
 * Created by Bijan on 05/06/2014.
 */

app.get('/api/applications', function (req,res) {

    var submittedForms = [];

    if( !req.user )
        return res.send(404);

    var details = req.query.d;
    var teamID = req.user.teamID;
    var userID = req.user ? req.user._id: '';
    var query = req.query.q || '';
    var jobFilter = req.query.j || '0';
    var filtered = (query!='' || jobFilter!='0') ? true : false;

    if( query ) {
        query = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"); // Regex escape
        query = query ? '(' + req.query.q.trim().replace(/ +/g,')|(') + ')' : ''; // Do you have any question about this line? Ask bijan!
    }

    var sortBy = {applyTime:+1};
    if( req.query.sort === 'name' )
        sortBy = {name:+1}

    BTeams.count({_id:teamID,admin:userID}, function(err,count) {
        if( err )
            return res.send(204);

        if( count > 0 ) {   // User is admin
            if ( jobFilter!=='0' ) // Filter by job
                fetchTeamFlyers( [jobFilter], function(teamFlyersID,teamFlyers) {
                    fetchApplications(teamFlyersID,teamFlyers);
                })
            else
                fetchTeamFlyers( null, function(teamFlyersID,teamFlyers) {
                    fetchApplications(teamFlyersID,teamFlyers);
                });
        }
        else if(userID==='') { // Public Viewer
            return res.send(200)
        }
        else { // User is member

            if ( jobFilter!=='0' ) // Filter by job
                fetchAssignedFlyers( [jobFilter], function(userFlyersID,teamFlyers) {
                    fetchApplications(userFlyersID,teamFlyers);
                });
            else
                fetchAssignedFlyers( null, function(userFlyersID,assignedFlyers) {
                    fetchApplications(userFlyersID,assignedFlyers);
                });
        }
    });

    function fetchApplications(flyersID,flyersList) {
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
            }).sort(sortBy).populate('flyerID').exec(function(err,forms) {
                if( err )
                    return res.send(303,{error:err});

                for( var i=0; i<forms.length; i++ ) {
                    var form = forms[i]._doc;//prepareApplicationForClient( forms[i]._doc );

                    // Move stage if it is interview and the date is over
                    // ToDo: This task must be done by a crone job or something like this
                    checkNeedForChangingStage(form.stage,form._id);

                    if( details )
                        submittedForms.push({
                            appID:form._id,
                            stage:form.stage,
                            application: prepareApplicationForClient( form, flyersList[form.flyerID._id.toString()], req.user._id )
                        });
                    else
                        submittedForms.push({
                            appID:form._id,
                            stage:form.stage
                        });
                }

                BApplications.count({flyerID:{$in:flyersID}}, function(err,count) {
                    return res.send({
                        timeStamp: (new Date()).getTime(),
                        allowToShowEmptyState: !filtered, // Don't show empty state for filtered mode
                        candidates:submittedForms
                    });
                });
            })
    }

    function fetchTeamFlyers(flyersIDFilter, callback) {

        var query = flyersIDFilter ? {owner:teamID, _id:{$in:flyersIDFilter}} : {owner:teamID};

        BFlyers.find(query).populate('owner').exec(function(err,flyers) {
            var teamFlyersID = flyers.map( function(flyer) { return flyer._id } );

            var teamFlyers = {};
            flyers.forEach( function(flyer) {
               teamFlyers[flyer._id.toString()] =  flyer;
            });

            callback(teamFlyersID,teamFlyers);
        });
    }

    function fetchAssignedFlyers(flyersIDFilter, callback) {

        var query = flyersIDFilter ?
        {owner: teamID, flyerID:{$in:flyersIDFilter}} :
        {owner: teamID, $or:[{autoAssignedTo:userID},{commentators:userID}]};

        BFlyers.find(query).populate('owner').exec( function(err,flyers) {
            var userFlyersID = flyers.map( function(flyer) { return flyer._id } );

            var teamFlyers = {};
            flyers.forEach( function(flyer) {
                teamFlyers[flyer._id.toString()] =  flyer;
            });

            callback(userFlyersID,teamFlyers)
        });
    }

    function checkNeedForChangingStage(stage,applicationID) {

        if( stage.stage===2 && stage.subStage==3 ) { // Interview
            if( (new Date())  - (new Date(stage.interviewDate)) > 0 ) { // Date is over
                BApplications.update({_id:applicationID}, {
                    stage:{stage:2,subStage:4,interviewDate:stage.interviewDate}
                }, function(err) {return;})
            }
        }

    }
});

function sendEmail(userID,teamID,applicationID,metadata,emailType,callback) {

    BTeams.findOne({_id:teamID}, function(err,team){
        BApplications.findOne({_id:applicationID}).populate('flyerID').exec(function(err,application) {

            var job = application.flyerID.flyer ? application.flyerID.flyer.description : '';
            var time = new Date(metadata.interviewDate);
            var message;
            var applicantName;
            var applicantEmail;
            var answersText = [];
            if( emailType==1 ) {
                message = metadata.invitationMessage
                applicantName = metadata.invitedName;
                applicantEmail = metadata.invitedEmail;
                answersText = ['Accept', 'Decline'];
            }
            else if( emailType==2 ) {
                message = metadata.offerMessage;
                applicantName = metadata.offeredName;
                applicantEmail = metadata.offeredEmail
                answersText = ['Accept', 'Decline'];
            }
            // ToDo: Show interview date and time in better way

            message = message.replace(/\n/g,'<br/>')
            message = message.replace(/\{\{interview-date\}\}/g, time);
            message = message.replace(/\{\{job-title\}\}/g, job );
            message = message.replace(/\{\{team-name\}\}/g, team.name );
            if( emailType==1 ) {
                message = message.replace(/\{\{applicant-name}\}/g, metadata.invitedName);
                message = message.replace(/\{\{interview-location\}\}/g, metadata.interviewLocation);
            }
            else if( emailType==2) {
                message = message.replace(/\{\{applicant-name}\}/g, metadata.offeredName);
            }

            var email = {
                "html": message,
                "text": message ,
                "subject": "Interview Invitation",
                "from_email": emailConfig.fromAddress,
                "from_name": team.name,
                "to": [{
                    "email": applicantEmail,
                    "name": applicantName,
                    "type": "to"
                }],
                "headers": {
                    "Reply-To": emailConfig.replyAddress
                }
            };
            var title = 'Interview with ' + metadata.invitedName + '(Waiting)';
            var contributor = [userID];

            addEvent( title, time, contributor,  teamID, true, applicationID, application.flyerID, function(err, event) {

                    BApplicantsResponses({applicationID:applicationID,request:message,text:message,event:event}).save( function(err,invitation) {

                        /// /applicant/message/:messageType/:messageID
                        var YESLink = emailConfig.returnBackHost +'/applicant/message/' + emailType + '/' + invitation._id + '?response=1';
                        var NOLink = emailConfig.returnBackHost +'/applicant/message/' + emailType + '/' + invitation._id + '?response=0';
                        var redButtonStyle = 'padding: 8px;background: rgb(220, 108, 108); margin: 8px; line-height: 4em;font-weight: 700;color: #fff; text-decoration: none;border-radius: 9px;';
                        var greenButtonStyle = 'padding: 8px;background: rgb(81, 161, 80); margin: 8px; line-height: 4em;font-weight: 700;color: #fff; text-decoration: none;border-radius: 9px;';

                        email.html += '<br/><br/><hr style="border-color: #000;">Your answer is: '+
                            '<a style="' + greenButtonStyle + '" href="' + YESLink + '">' + answersText[0] + '</a>'+
                            '<a style="' + redButtonStyle + '" href="' + NOLink + '">' + answersText[1] + '</a>';

                        mandrill_client.messages.send({"message": email, "async": false}, function(result) {
                            /*Succeed*/
                            callback(result,invitation._id);
                        }, function(e) {
                            /*Error*/
                            callback(e,invitation._id);
                        });

                    });

                });

        });
    });

}

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
        var nSkills = req.body.skills;
        var nWorkPlace = req.body.workplace;
        var nWorkTime = req.body.worktime;

        BApplications.update({_id:req.params.applicationID},{
            note: nNote,
            name: nName,
            email: nEmail,
            tel: nTel,
            website: nWebsite,
            skills: nSkills,
            workPlace: nWorkPlace,
            workTime: nWorkTime
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
        var newStage = {
            stage: req.body.data.stage,
            subStage: req.body.data.subStage,
            invitedName: req.body.data.invitedName,
            interviewDate: req.body.data.interviewDate,
            interviewTeam: req.user.teamID,
            interviewer: req.user._id
        };

        if( req.body.activity == 0 ) { // Changing stage activity;

            // Inviting for an interview
            if( req.body.data.stage==2 && req.body.data.subStage==1 ) {
                sendEmail(req.user._id, req.user.teamID, appID, req.body.data, 1, function(err,invitationID) {

                    newStage.invitation = invitationID;
                    newStage.invitedName = req.body.data.invitedName;
                    newStage.interviewDate = req.body.data.interviewDate;
                    newStage.interviewTeam = req.user.teamID;
                    newStage.interviewer = req.user._id;

                    BApplications.update({_id:appID}, {stage:newStage,$push:{activities:activity}}, function(err) {
                        return res.send(200);
                    })
                });
            }
            // Job offer
            else if( req.body.data.stage==3 && req.body.data.subStage==1 ) {
                sendEmail(req.user._id, req.user.teamID, appID, req.body.data, 2, function(err,invitationID) {

                    newStage.invitation = invitationID;

                    BApplications.update({_id:appID}, {stage:newStage,$push:{activities:activity}}, function(err) {
                        return res.send(200);
                    })
                })
            }
            else {
                BApplications.update({_id:appID}, {stage:newStage,$push:{activities:activity}}, function(err) {
                    return res.send(200);
                })
            }
        }
        else { // General Activities
            BApplications.update({_id:appID}, {$push:{activities:activity}}, function(err) {
                return res.send(200);
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
        if( application.flyerID.autoAssignedTo && application.flyerID.autoAssignedTo.toString() === userID.toString() ) {
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

function notifyAllForAppComment(app,comment) {
    var job=app.flyerID;
    var users={};
    job.commentators.forEach(function(c){users[c]=true;});
    users[job.autoAssignedTo]=true;
    delete users[comment.user._id];

    var now=Date.now();
    var notifs=Object.keys(users).map(
        function(userId){
            return {
                time:now,
                visited:false,
                user:userId,
                comment:comment,
                editor:comment.user,
                app:app._id};
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
                    BAppComments({
                        team: req.user.teamID,
                        user: req.user._id,
                        app: req.params.appID,
                        text: req.body.text,
                        date: new Date()
                    }).save( function(err,newComment) {

                        // ToDo: Implement Notification Strategy Here

                        BAppComments.findOne({_id:newComment._id})
                            .populate('user','displayName email')
                            .exec(function(err,newComment) {
                                res.send(200, newComment);
                                notifyAllForAppComment(application,newComment);
                            });
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
                BAppComments.find({app: req.params.appID})
                    .populate('user','displayName email')
                    .populate('comment','user text')
                    .populate('comment.user','displayName email')
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

        application = prepareApplicationForClient(application._doc);

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

function prepareApplicationForClient(form,flyer,currentUserID) {
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
        form.lastActivity = 'NEW';

    // Removing flyer for decrease data volume
    form.flyerID = { _id: form.flyerID._id };

    //
    if( flyer ) {
        var teamID = flyer.owner.admin;
        var responderID = flyer.autoAssignedTo || '';


        // Permission for Mark-As-Read
        if( currentUserID.toString()===responderID.toString())
            form.permission_mark_as_read = 'allowed';
        else
            form.permission_mark_as_read = 'denied';

        // Permission for change stage
        if( currentUserID.toString()===teamID.toString() || currentUserID.toString()===responderID.toString())
            form.permission_edit = 'allowed';
        else
            form.permission_edit = 'denied';
    }

    return form;
}
