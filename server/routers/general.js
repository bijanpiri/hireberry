/**
 * Created by Bijan on 04/29/2014.
 */

// region General
app.get('/', function(req,res) {

    res.cookie('promocode','');

    if( req.user )
        res.redirect('/dashboard#overviewp');
    else
        res.redirect('/login');
});
// endregion

// region Setting
app.get('/setting', function(req,res){

    if( !checkUser(req,res))
        return;

    res.render('setting.ejs',{title:'Setting'});
});

app.post('/api/setting/password', function(req,res) {
    var userID = req.user._id;
    var oldpassword = req.body.oldpassword;
    var newpassword = req.body.newpassword;

//    ToDo: Adding Hash+Salt algorithm here too
//    var promise = this.Promise();
    BUsers.findOne({ email: req.user.email}, function (err, user) {
        if (err)
            return promise.fulfill([err]);

        console.log(user);

        if (!user)
            return promise.fulfill(['invalid user']);
        if(!user.password || !user.salt)
            return promise.fulfill(['Server authentication error.']);

        crypto.pbkdf2( oldpassword, user.salt, hashIteration, keySize,
            function(err, dk) {
                var eq=true;
                var key=user.password;
                for(var i=0;i<keySize;i++) eq &= key[i] == dk[i];
                if(!eq)
                    res.send(403,'Invalid password.');
                else{
                    var salt = crypto.randomBytes(128).toString('base64');
                    crypto.pbkdf2( newpassword, salt, hashIteration, keySize,
                        function(err, dk) {
                            BUsers.update(
                                {email:user.email},
                                {$set:{salt:salt,password: dk}},
                                function (err, numberAffected, raw) {
                                    if (err)    return handleError(err);
                                    else{
                                        console.log('>>>>>>>>>>Password changed successfully for '+user.email);
                                        res.send(200,user);
                                    }
                                });
                        }
                    );
                }
            }
        );

    });
});

app.post('/api/setting/basicinfo', function(req,res) {
    var userID = req.user._id;
    var displayName = req.body.displayName;
    var email = req.body.email;

    BUsers.update( { _id: userID },
        { displayName: displayName, email: email }, function (err) {
            if (err)
                res.send(401,{});
            else
                res.send(200,{});
        });
});
// endregion

// region Search
app.get('/api/search/users', function(req,res){
    var query = req.query.q;

    // ToDo: Protect against SQLInjection Attack
    // ToDo: Complete Search Mechanics

    // Search in Users
    BUsers.find({email:{$regex : '.*'+ query +'.*'}}, function(err,users){
        if(err) return res.send('Error');
        if(!users) return req.send('Not Found');

        var results = [];
        for(var i=0; i<users.length; i++){
            results.push({
                rtype:'user',
                display:users[i].email,
                link:'/user/' + users[i]._id
            });
        }

        res.send(results);
    });
});

// endregion

// region Event
app.post('/api/calendar/event', function(req,res) {

    var time = new Date(req.body.time);
    var title = req.body.title;
    var teamID = req.user.teamID;
    var contributor = [req.user._id];

    addEvent( title, time, contributor,  teamID, function() {
            res.send(200);
        }
    )
});

app.get('/api/calendar', function(req,res) {

    var time = new Date(req.body.time);
    var title = req.body.title;
    var teamID = req.user.teamID;
    var userID = req.user._id;

    BTeams.count({ _id:teamID, admin:userID }, function(err,count){
        if( err || count==0)
            BEvents.find( { contributors:userID }, function(err,events) {
                res.send(200,{events:events});
            })
        else
            BEvents.find( {team:teamID}, function(err,events) {
                res.send(200,{events:events});
            })
    });
});
// endregion

app.delete('/api/notifications/:notificationID', function(req,res) {
    var notificationID = req.params.notificationID;

    // ToDo: Check whether current user can remove this notification or not.

    BNotifications.remove( {_id: notificationID}, function(err) {
        res.send(200);
    });
});

app.get('/api/notifications', function(req,res) {

    /* ToDo: Add all kind of notifications here
     Invitations
     Responses [OK]
     Ask for comment
     Ask for publish [OK]
     New comment [OK]
     Job state changing [OK]
     */

    if( !checkUser(req,res) )
        return;

    var notifications = {};
    var teamID = req.user.teamID;
    var userID = req.user._id;

    function getNewFormCommentsNotifications(callback) {
        getNewComments(userID, teamID, function(err,comments){
            callback(comments);
        });
    }

    function getTeamInvitations(callback) {
        var email = req.user.email;

        BTeamInvitations.find({email:email})
            .populate('team')
            .exec(function(err,invitations) {
                if(!err)
                    callback(invitations);
                else
                    callback([]);
            });
    }
    function getNewMemberNotifications(callback) {

        // Are you hiring manager?
        BTeams.count({_id:teamID,admin:userID}, function(err,count){
            if( err || count == 0 )
                callback([]);
            else
                BNotifications.find({type:'1','more.teamID':teamID}, function(err,notifications){
                    callback(notifications)
                });
        })
    }

    function getJobStateChangingNotfications(callback) {
        BFlyers.find({autoAssignedTo:userID}, function(err,jobs) {

            var jobsID = jobs.map( function(job){ return job._id.toString() });

            BNotifications.find({type:'4','more.flyerID':{$in:jobsID}}, function(err,notifications){
                callback(notifications)
            })
        });

    }

    function getCommentNotifications(callback){
        BNotification
            .find({visited:false,user:userID})
            .sort('-time')
            .populate('comment','text')
            .populate('user','displayName email')
            .populate('editor','displayName email')
            .exec(function(err,nots){
                callback(nots);
            })

    }

    function getAskedForPublishNotificatinos(callback) {
        BTeams.count({_id:req.user.teamID,admin:req.user._id}, function(err,count){
            if( !err && count > 0 ) {
                BFlyers.find({owner:req.user.teamID, askedForPublish:true}, function(err,askedForPublishList) {
                    callback( askedForPublishList.map( function(item) {return item._id} ))
                })
            } else {
                callback([]);
            }
        })
    }

    function getNewApplicantResponses(callback) {

        BFlyers.find({autoAssignedTo:userID}, function(err,jobs) {

            var jobsID = jobs.map( function(job){ return job._id });

            BApplications.find({flyerID:{$in:jobsID}}, function(err, applications) {

                var applicationsID = applications.map( function(application){ return application._id });

                BApplicantsResponses.find({
                    applicationID:{$in:applicationsID},
                    response:{$exists:true},
                    responderNotified:{$ne:true}
                }).populate('applicationID','name').exec( function(err,responds){
                        if( err )
                            callback([]);
                        else
                            callback(responds);
                    });
            });


        })
    }

    getNewMemberNotifications( function(notif) {
        notifications.newMembers = notif;

        getJobStateChangingNotfications( function(notif) {
            notifications.jobStateChanging = notif;

            getAskedForPublishNotificatinos( function(notif) {
                notifications.askedForPublish = notif;

                getNewApplicantResponses( function(notif) {
                    notifications.newResponses = notif;

                    getCommentNotifications(function(notif){

                        notifications.newComments=notif;

                        getTeamInvitations( function(notif) {
                            notifications.teamInvitations = notif;
                            res.send(200,notifications);
                        })

                    })

                })
            })
        })
    })
});