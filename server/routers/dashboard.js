/**
 * Created by coybit on 3/16/14.
 */

module.exports.showDashboard = function (req,res) {

    if( !req.user )
        return res.redirect('/');

    var teamID = req.user.teamID;
    var userID = req.user._id;

    res.render('dashboard.ejs', {
        title: 'Dashboard',
        userID: userID,
        teamID: teamID
    });
}

// Return all the created forms (template)
module.exports.forms = function(req,res){
    var teamID = req.user.teamID;
    var userID = req.user._id;

    BTeams.count({_id:teamID,admin:userID}, function(err,count) {
        if( err )
            return res.send(204);

        if( count > 0 ) // Admin
        // About Query: All his-owned flyers + other's published flyers + other's Asked-For-Publish flyers
            findFlyers({
                owner: teamID,
                $or:[
                    {publishTime:{$ne:''}},
                    {creator: userID},
                    {askedForPublish:true}
                ]
            });
        else    // Team member
            findFlyers({owner: teamID, $or:[{autoAssignedTo:userID}]});
    });

    function findFlyers(query) {

        BFlyers.find(query).populate('creator owner autoAssignedTo').exec( function(err,flyers) {
            if( err )
                return res.send(502,{error:err});

            // Reduce
            // ToDo: Make reducing async
            var forms = flyers.map( function(flyer) {
                var description = (flyer.flyer && flyer.flyer.description && flyer.flyer.description.length > 0)  ? flyer.flyer.description : 'Untitlted';
                var currentMode;

                if( flyer.askedForPublish == true )
                    currentMode = 'Asked For Publish';
                else
                    currentMode = flyer.publishTime ? "published" : "drafted";

                return {
                    formName:description,
                    formID:flyer._id,
                    autoAssignedTo: flyer.autoAssignedTo,
                    creator: flyer.creator,
                    mode: currentMode
                }
            } );

            res.send( {forms: forms} );
        });

    }

}

// Return all the submitted form as a data-source
module.exports.applications = function (req,res) {

    // Data-Source template (for WaTable.js)
    var submittedForms = {rows: []};

    var teamID = req.user.teamID;
    var userID = req.user._id;
    var query = req.query.q || '';
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
            fetchTeamFlyers( function(teamFlyersID) {
                fetchApplications(teamFlyersID);
            })
        }
        else { // User is member
            fetchAssignedFlyers( function(userFlyersID) {
                fetchApplications(userFlyersID);
            })
        }
    });

    function fetchApplications(flyersID,flyersName) {
        BApplications.find( {
            flyerID:{$in:flyersID},
            $or:[
                {name: new RegExp(query, "i")},
                {anythingelse: new RegExp(query, "i")},
                {workPlace: new RegExp(query, "i")},
                {workTime: new RegExp(query, "i")},
                {skills: new RegExp(query, "i")}
            ]}).sort(sortBy).populate('flyerID').exec(function(err,forms) {
                if( err )
                    return res.send(303,{error:err});

                for( var i=0; i<forms.length; i++ ) {
                    var form = forms[i]._doc;

                    form.position = form.flyerID.flyer.description;

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

                res.send(submittedForms);
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
}

module.exports.updateApplication = function(req,res) {

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
            BApplicantsResponses({applicationID:appID,request:message}).save( function(err,invitation) {

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
            })

        }
        // Job offer
        else if( req.body.data.stage==3 && req.body.data.subStage==1 ) {

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
            BApplicantsResponses({applicationID:appID,request:message}).save( function(err,invitation) {

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
        }
        else {
            var newStage = {
                stage: req.body.data.stage,
                subStage: req.body.data.subStage
            };
            BApplications.update({_id:appID}, {stage:newStage}, function(err) { res.send(200) })
        }
    }
    else { // General Activities
        addNewActivity(appID,activity);
    }
}

function addNewActivity(applicationID,activity,callback) {
    BApplications.update({_id:applicationID}, { $push:{activities:activity} }, function(err) {
        callback(err);
    })
}

module.exports.statisticalInfo = function(req,res) {

    var userID = req.user.teamID;

    BFlyers.find({owner:userID}, function(err,flyers) {

        var flyerIDList = flyers.map( function(flyer){return flyer._id});

        BApplications.find( {flyerID:{$in:flyerIDList}}, function(err,applications) {

            var numNewApplications = 0;
            var numTodayApplication = 0;

            for(var i=0; i<applications.length; i++ ) {
                var activities = applications[i].activities;
                if( activities && activities.length==1 )
                    numNewApplications++

                var applicationDate = new Date( applications[i].applyTime );
                var today = new Date();
                if( today.toLocaleDateString() == applicationDate.toLocaleDateString() )
                    numTodayApplication++;
            }

            res.send({
                numForms: flyers.length,
                numApplications: applications.length,
                numTodayApplications: numTodayApplication,
                numNewApplications: numNewApplications
            });

        })
    });
}

function makeLinkTag(display, url, mailto) {
    return '<a href="'+ (mailto?'mailto:':'') + url + '">' + display + '</a>';
}