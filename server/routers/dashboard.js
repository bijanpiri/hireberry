/**
 * Created by coybit on 3/16/14.
 */

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

app.get('/api/applications/stat', function(req,res) {

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
} )