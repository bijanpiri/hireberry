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

    BTeam.count({_id:teamID,admin:userID}, function(err,count) {
        if( err )
            return res.send(204);

        if( count > 0 ) {   // User is admin
            BFlyers.find( {owner: teamID}, function(err,flyers) {
                if( err )
                    return res.send(502);

                // Reduce
                // ToDo: Make reducing async
                var forms = flyers.map( function(flyer) {
                    var description = (flyer.flyer && flyer.flyer.description && flyer.flyer.description.length > 0)  ? flyer.flyer.description : 'Untitlted';

                    return {
                        formName:description,
                        formID:flyer._id,
                        mode: flyer.publishTime ? "(Published)" : "(Draft)"
                    }
                } );

                res.send( {forms: forms} );
            } );
        }
        else {
            BFlyers.find( {owner: teamID, assignedTo:userID}, function(err,flyers) {
                if( err )
                    return res.send(502);

                // Reduce
                // ToDo: Make reducing async
                var forms = flyers.map( function(flyer) {
                    var description = (flyer.flyer && flyer.flyer.description && flyer.flyer.description.length > 0)  ? flyer.flyer.description : 'Untitlted';

                    return {
                        formName:description,
                        formID:flyer._id,
                        mode: flyer.publishTime ? "(Published)" : "(Draft)"
                    }
                } );

                res.send( {forms: forms} );
            } );
        }
    });

}

// Return all the submitted form as a data-source
module.exports.applications = function (req,res) {

    // Data-Source template (for WaTable.js)
    var submittedForms = {
        cols: {
            userId: { index: 1, type: "number", unique:true, friendly:"Num" },
            lastActivity: { index: 2, type: "string", friendly:"Last Activity" },
            applyTime: { index: 3, type: "string", friendly:"Application Date/Time" },
            name: { index: 4, type: "string", friendly:"Name" },
            email: { index: 5, type: "string", friendly:"Email" },
            skills: { index: 6, type: "string", friendly:"Skills"},
            profiles: { index: 7, type: "string", friendly:"Profiles"},
            workTime: { index: 8, type: "string", friendly:"Work Time" },
            workPlace: { index: 9, type: "string", friendly:"Work Place" },
            resumePath: { index: 10, type: "string", friendly:"Resume" },
            anythingelse: { index: 11, type: "string", friendly:"Cover Letter" }
        },
        rows: []
    };

    // ToDo: Check whether current user is owner of this forms or not.

    var flyerID = req.query.formID;
    var teamID = req.query.teamID;
    var userID = req.user._id;

    BTeam.count({_id:teamID,admin:userID}, function(err,count) {
        if( err )
            return res.send(204);

        if( count > 0 ) {   // User is admin
            fetchApplications();
        }
        else {

            BFlyers.count( {_id: flyerID, assignedTo:userID}, function(err,count) {
                if( count > 0 )
                    fetchApplications();
                else
                    res.send(200,submittedForms);
            });

        }
    });

    function fetchApplications() {
        MApplyForm.find( {flyerID: flyerID}, function(err,forms) {
            if( err )
                return res.send(303,{error:err});

            for( var i=0; i<forms.length; i++ ) {
                var form = forms[i]._doc;

                // userId
                form.userId = i+1;
                form.checked = false;

                // Skills
                var skills = form.skills.length==0 ? [] : JSON.parse( form.skills );
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
}

module.exports.updateApplication = function(req,res) {
    var appID = req.params.applicationID;
    var activity = {
        type:req.body.activity,
        data:req.body.data,
        timestamp: new Date() };

    MApplyForm.update({_id:appID}, {$push:{activities:activity}}, function(err) {
        res.send(200);
    })
}

module.exports.statisticalInfo = function(req,res) {

    var userID = req.user._id;

    BFlyers.find({owner:userID}, function(err,flyers) {

        var flyerIDList = flyers.map( function(flyer){return flyer._id});

        MApplyForm.find( {flyerID:{$in:flyerIDList}}, function(err,applications) {

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