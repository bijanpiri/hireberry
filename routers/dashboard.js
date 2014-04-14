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
    var teamID = req.query.teamID;
    var userID = req.user._id;

    BTeams.count({_id:teamID,admin:userID}, function(err,count) {
        if( err )
            return res.send(204);

        if( count > 0 ) // Admin
            findFlyers({owner: teamID}); // ToDo: And is not the draft-mode form which is create by user
        else    // Team member
            findFlyers({owner: teamID, $or:[{creator:userID}, {autoAssignedTo:userID}]});
    });

    function findFlyers(query) {

        BFlyers.find(query).populate('creator owner autoAssignedTo').exec( function(err,flyers) {
            if( err )
                return res.send(502);

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
    var submittedForms = {
        cols: {
            userId: { index: 1, type: "number", unique:true, friendly:"Num" },
            lastActivity: { index: 2, type: "string", friendly:"Last Activity" },
            applyTime: { index: 3, type: "string", friendly:"Application Date/Time" },
            position: { index: 4, type: "string", friendly:"Position" },
            name: { index: 5, type: "string", friendly:"Name" },
            email: { index: 6, type: "string", friendly:"Email" },
            skills: { index: 7, type: "string", friendly:"Skills"},
            profiles: { index: 8, type: "string", friendly:"Profiles"},
            workTime: { index: 9, type: "string", friendly:"Work Time" },
            workPlace: { index: 10, type: "string", friendly:"Work Place" },
            resumePath: { index: 11, type: "string", friendly:"Resume" },
            anythingelse: { index: 12, type: "string", friendly:"Cover Letter" }
        },
        rows: []
    };

    var teamID = req.user.teamID;
    var userID = req.user._id;

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
        BApplications.find( {flyerID:{$in:flyersID} })
            .populate('flyerID')
            .exec(function(err,forms) {
                if( err )
                    return res.send(303,{error:err});

                for( var i=0; i<forms.length; i++ ) {
                    var form = forms[i]._doc;

                    // userId
                    form.userId = i+1;
                    form.checked = false;
                    form.position = form.flyerID.flyer.description;

                    // Skills
                    var skills = form.skills.length==0 ? [] : JSON.parse( form.skills );

                    // Reason: When skills contains just one item, it convert to string automatically
                    if( typeof(skills) === 'string' )
                        skills = [skills];

                    var selectedSkill = '';
                    for (var j=0; j<skills.length; j++)
                        selectedSkill += '<span class="spanBox">' + skills[j] + '</span>';
                    form.skills = selectedSkill;

                    // Profiles
                    form.profiles = form.profiles || '{}';
                    var profiles = JSON.parse( form.profiles );
                    var selectedProfiles = '';
                    for (var profile in profiles)
                        if ( profiles.hasOwnProperty(profile) && profiles[profile]!=='' )
                            selectedProfiles +=
                                '<span class="spanBox">' +
                                    makeLinkTag(profile,profiles[profile],false) +
                                    '</span>';
                    form.profiles = selectedProfiles;

                    // Workplace
                    //form.workPlace = (form.workPlace=='fulltime') ?

                    // Email
                    form.email = makeLinkTag( form.email, form.email, true );

                    // Apply Date
                    var date = new Date( form.applyTime );
                    form.applyTime = date.toLocaleDateString();

                    // Resume
                    form.resumePath = (form.resumePath==='-') ? '' : makeLinkTag( 'link', form.resumePath, false);

                    // Last Activity
                    if( form.activities && form.activities.length > 0 )
                        form.lastActivity = form.activities[form.activities.length-1]['type'];
                    else
                        form.lastActivity = 'NEW'

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
}

module.exports.updateApplication = function(req,res) {
    var appID = req.params.applicationID;
    var activity = {
        type:req.body.activity,
        data:req.body.data,
        timestamp: new Date() };

    BApplications.update({_id:appID}, {$push:{activities:activity}}, function(err) {
        res.send(200);
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