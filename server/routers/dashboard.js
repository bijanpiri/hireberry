/**
 * Created by coybit on 3/16/14.
 */

// region Views
app.get('/dashboard', function (req,res) {

    if( !req.user )
        return res.redirect('/');

    var teamID = req.user.teamID;
    var userID = req.user._id;

    res.render('dashboard.ejs', {
        title: 'Dashboard',
        userID: userID,
        teamID: teamID
    });
} );
// endregion

app.get('/api/applications/stat', function(req,res) {

    var teamID = req.user.teamID;

    BTeams.findOne({_id:teamID}, function(err,team) {
        var membersCount = team.members.length;

        BFlyers.find({owner:teamID}, function(err,flyers) {

            var flyerIDList = [];
            var publishedCount = 0;

            for( var i=0; i<flyers.length; i++ ) {

                if( team.admin.toString()===req.user._id.toString() ||
                    (flyers[i].autoAssignedTo && flyers[i].autoAssignedTo.toString() === req.user._id.toString()) )
                    flyerIDList.push( flyers[i]._id );

                if( !flyers[i].publishTime )
                    publishedCount++;
            }

            BApplications.find( {flyerID:{$in:flyerIDList}}, function(err,applications) {

                var numNewApplications = 0;
                var numTodayApplication = 0;

                for( var i=0; i<applications.length; i++ ) {
                    var activities = applications[i].activities;
                    if( activities && activities.length==1 )
                        numNewApplications++;

                    var applicationDate = new Date( applications[i].applyTime );
                    var today = new Date();
                    if( today.toLocaleDateString() == applicationDate.toLocaleDateString() )
                        numTodayApplication++;
                }

                res.send({
                    numForms: flyers.length,
                    numTeamMembers: membersCount,
                    numPublished: publishedCount,
                    numApplications: applications.length,
                    numTodayApplications: numTodayApplication,
                    numNewApplications: numNewApplications
                });

            })
        });

    })
} )