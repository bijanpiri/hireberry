/**
 * Created by Bijan on 04/29/2014.
 */

var NA = require("nodealytics");
NA.initialize('UA-52471230-1', 'hireberry.com', function () {
    //MORE GOOGLE ANALYTICS CODE HERE
});

InitJobBoardPriceCollection();

// region General
app.get('/', function(req,res) {

    var errorCode = req.query.error;
    var errorMsg = '';

    //addPromoCode('Quartzy90USD',90,1,true,function(){});
    //addPromoCode('Inkitt90USD',90,1,true,function(){});
    //addPromoCode('Seene90USD',90,1,true,function(){});
    //addPromoCode('Loadimpact90USD',90,1,true,function(){});
    //addPromoCode('FameBit90USD',90,1,true,function(){});
    //addPromoCode('DaPulse90USD',90,1,true,function(){});
    //addPromoCode('Zesty90USD',90,1,true,function(){});
    //addPromoCode('colson@HB',0,1,true,function(){});
    //addPromoCode('nazariha@HB',0,1,true,function(){});
    //addPromoCode('maggie@HB',0,1,true,function(){});

    if(errorCode==='regCode') {
        errorMsg = 'You need a valid promo code to register. Request an invitation on this page.\\n' +
            'Contact us if you have any question: contact@hireberry.com.';
    }

    res.cookie('promocode', '' );

    everyauth.user

    if( req.user )
        res.redirect('/dashboard#overviewp');
    /*else if(req.cookies['bltn.session.login'])
        res.redirect('/login');
    else if(req.cookies['bltn.persistent.login'])
        res.redirect('/login');*/
    else
       res.render('LandingPage.ejs',{
           errorMessage: errorMsg,
           code:req.query.code||''
       });
});

var husern=new Buffer([134,180,36,176,208,69,196,234,248,80,17,85,172,245,79,15,201,179,110,200,158,225,129,106,139,63,65,209,109,157,68,94,240,119,100,109,141,68,94,21,122,28,156,230,73,181,34,54,66,101,166,72,226,206,39,134,5,217,136,225,223,241,218,174,86,154,26,208,231,192,116,216,4,56,249,132,106,76,106,63,215,36,100,60,68,80,135,84,48,57,100,251,81,230,109,201,17,71,61,17,103,55,58,127,152,158,230,152,176,55,22,18,236,126,101,168,174,128,134,50,205,207,86,159,76,4,33,36,46,2,216,198,116,236,5,25,189,160,79,208,8,166,225,17,236,53,186,104,30,41,232,246,187,250,194,134,109,1,113,151,55,199,146,51,229,179,95,243,55,113,113,15,193,53,155,54,89,84,201,60,0,11,194,39,37,26,14,213,37,25,87,110,53,150,130,186,181,241,19,8,223,190,136,184,56,125,93,71,197,146,49,86,214,244,81,158,214,35,229,235,143,167,159,160,252,171,236,58,71,63,141,219,206,133,134,184,244,192,80,80,154,253,172,4,34,235,143,35,23,178,128,253,80,174,189,37,104,146,87,162,233,124,48,118,35,73,26,201,104,238,117,154,195,179,58,55,161,231,170,101,65,50,58,30,149,19,194,118,34,179,89,227,154,112,178,153,27,197,151,51,209,72,22,208,122,69,125,54,128,20,28,189,154,72,178,42,44,64,87,164,29,244,166,73,60,253,198,29,2,197,218,216,196,86,221,201,255,215,232,8,67,156,217,147,169,47,198,219,141,57,142,13,8,20,155,200,120,131,24,226,41,190,128,43,23,114,228,144,192,129,179,168,207,255,12,130,218,114,95,229,253,217,74,93,93,43,111,81,13,23,64,39,59,88,148,24,253,74,33,132,186,13,156,81,137,240,199,164,72,184,242,103,105,230,60,221,147,113,224,92,164,79,45,91,182,100,98,111,43,142,44,226,201,162,111,192,129,41,18,143,170,4,119,191,225,173,0,30,38,44,79,162,219,35,40,106,13,101,207,149,9,57,7,104,193,107,247,146,112,238,229,134,77,106,67,174,132,165,58,219,148,134,221,43,97,39,80,167,252,197,240,46,40,170,167,117,64,67,214,43,186,52,236,188,156,83,161,250,110,209,54,222]);
var hpwd=new Buffer([92,70,208,9,91,217,135,69,222,157,159,62,194,225,228,165,228,107,14,143,88,140,179,211,172,174,221,216,167,70,173,26,53,242,186,226,192,17,26,145,70,205,40,235,224,95,209,188,230,188,181,199,248,253,229,103,14,119,160,171,209,125,98,59,129,98,91,201,46,177,51,137,76,242,130,68,11,255,10,67,106,154,93,224,90,20,214,116,110,229,95,104,68,124,26,189,249,35,35,18,208,169,112,114,110,133,151,135,97,49,165,23,76,64,251,163,84,167,95,189,77,155,199,246,55,169,59,72,189,185,254,73,179,87,77,81,70,83,219,209,209,193,101,156,106,18,123,36,9,136,170,57,199,74,145,53,114,228,170,161,16,71,122,234,140,144,94,234,109,118,92,79,61,205,57,47,36,89,189,139,41,171,210,6,105,211,102,244,12,25,233,206,161,255,64,228,18,64,204,159,12,131,22,104,109,168,117,98,79,228,75,139,186,44,23,3,175,145,209,203,12,173,204,146,229,65,6,247,124,175,94,44,186,70,195,240,145,26,174,121,170,86,174,129,34,15,215,137,129,27,254,32,37,147,81,5,97,77,9,159,67,147,81,242,181,150,1,201,197,53,133,211,174,0,220,147,174,75,24,196,158,132,96,255,160,34,211,50,158,173,235,40,175,213,98,210,192,191,58,187,117,245,145,213,140,85,219,201,74,255,93,45,236,68,208,191,208,207,69,126,248,139,146,252,56,181,56,84,137,5,230,156,21,230,40,64,190,207,57,62,124,177,169,159,190,137,136,166,207,185,139,187,95,81,20,26,108,160,41,136,235,127,167,140,231,231,212,175,219,252,188,193,107,76,132,2,48,1,66,169,127,165,110,159,26,86,29,150,43,69,116,164,169,81,160,22,153,57,98,189,217,142,227,242,64,124,158,68,139,35,47,104,12,163,193,192,193,217,193,24,190,188,28,59,160,247,62,139,112,234,45,30,52,146,126,60,31,249,234,152,251,178,207,39,210,59,227,29,54,236,52,234,174,198,252,6,169,63,60,90,187,26,74,82,46,137,91,254,202,12,18,132,141,231,33,82,228,87,157,172,169,79,84,38,23,0,14,173,106,94,55,1,97,72,2,171,47,69,219,129,93,214,240,225,123,89,27,24,76,122,156,192]);
var usern_salt="Viu4mJ4gMl5E+N8W/803k8KITln1ALLQQBqCZ8zshol8E5MEOJkxMYGqA5LxkBRo6hIWGG1xliZ1xwQYzhiaM79FdZN4/zqm8xrG05wNppaOVs0zZjLBoeOsA2CrBZOs4CHsg7e5JYZxTf8F01Md5H7gw7s+cGPej2k1HvMkWMc=";
var pwd_salt="IppwKD0G+SMaF44S/3Zz2+Ts8J9LzYfA3edjgdQM5b5rci6AwvdsX/bgyTvCvAc1karTqgubsivJKZHT0NQ6pXmc9Bh9LXmquHU3pKb/ZMOsoS+B3JbccyxOwzkFjgi8Z3XExXlex4B6CPWRyFeamWeSCXkOjqaLj+1faAetFOg=";
var keySize=512;
var hashIteration=1;

app.get('/adminlogin', function(req,res) {
        res.redirect('/AdminLoginPage.html');
});

app.post('/admin', function(req,res) {

    //========================= for test ===================================
       /*usern_salt = crypto.randomBytes(128).toString('base64');
         var keySize=512;
         var hashIteration=1;
         var usern="hibe_adminp"
         crypto.pbkdf2( usern, usern_salt, hashIteration, keySize,
         function(err, dk) {
            // husern=dk;
             for(var i=0;i<512;i++)
                 husern+=dk[i].toString()+',';
         });

         pwd_salt = crypto.randomBytes(128).toString('base64');
         var keySize=512;
         var hashIteration=1;
         var pwd="ey071614hb"
         crypto.pbkdf2( pwd, pwd_salt, hashIteration, keySize,
             function(err, dk) {
                 //hpwd=dk;
                 for(var i=0;i<512;i++)
                     hpwd+=dk[i].toString()+',';
         });*/
    //===================================================================

    crypto.pbkdf2(  req.body.username, usern_salt, hashIteration, keySize,
        function(err, dk) {
                if(dk.toString()==husern.toString())
                {
                    crypto.pbkdf2(  req.body.password, pwd_salt, hashIteration, keySize,
                        function(err, dk) {
                            if(dk.toString()==hpwd.toString())
                            {
                                res.render("promotePanel.ejs",{
                                    title:"Promote Panel"
                                });
                            }
                            else
                            {
                                res.send(400,"Login faild.");
                            }
                        });
                }
                else
                {
                    res.send(400,"Login faild");
                }
        });
});


app.get('/privacy-policy', function(req,res){
    res.render('privacy.ejs');
})

var addLinkedInPrice=function() {

    require('fs').readFile('public/linkedin.json', 'utf8', function (err,data) {
        if (err)
            return console.log(err);
        var linkedinPrice=JSON.parse(data);
        var cn=Object.keys(linkedinPrice);
        for(var i=0;i< cn.length;i++)
        {
            BJobBoardPrice(
                {
                    name: 'linkedin-'+cn[i],
                    price:0,
                    postalCodePrice:linkedinPrice[cn[i]]
                }).save(function(err,data){
                    if(err)
                        console.log(err);
                    else
                        console.log("Price of "+data._doc.name+" linkedin added to database");
                });
        }
    });

}

var addJobBoardPrice=function() {

    var JobBoardPrice ={ "github":450,"stack overflow":350,"dribbble":325,"behance":199,"indeed":50,"linkedin":195};
    var keys=Object.keys(JobBoardPrice);
    for (var k=0;k<keys.length;k++)
    {
        BJobBoardPrice(
            {
                name: keys[k],
                price:JobBoardPrice[keys[k]]
            }).save(function(err,data){
                if(err)
                    console.log(err);
                else
                    console.log(data._doc.name+" price added to database.");
            });
    }
    addLinkedInPrice();
}

function InitJobBoardPriceCollection()
{
    BJobBoardPrice.find().exec(function(err, rst)
    {
        if(rst && rst.length!=0)
        {
            if(rst.length!=251)
            {
                BJobBoardPrice.remove({}, function(err) {
                    console.log('collection removed')
                    addJobBoardPrice();
                });

                /* mongoose.connection.collections['jobBoardPrices'].drop( function(err) {
                 console.log('collection dropped');
                 });*/
            }
        }
        else
        {
            addJobBoardPrice();
        }
    });
};


// endregion

// region Setting
app.get('/setting', function(req,res){

    if( !checkUser(req,res))
        return;

    res.render('setting.ejs',{title:'Setting'});
});
app.post('/api/cert',function(req,res){
    var cert=req.body.cert;

    var levels={};
    if(req.body.dashLevel) levels.dash=parseInt(req.body.dashLevel);
    if(req.body.appLevel) levels.application=parseInt(req.body.appLevel);
    if(req.body.editorLevel) levels.editor=parseInt(req.body.editorLevel);
    var userID=req.user._id;

    BCertificates.update({user:userID},
        {$set:levels},
        { upsert: true },
        function(err,rowAffected,raw){
            res.send(200,rowAffected);
    });
});
app.get('/api/cert',function(req,res){
    var userId=req.user._id;
    BCertificates
        .findOne({user:userId}).lean()
        .exec(function(err,cert){
            if(err)
                res.send(401,'Error fetching data');
            else
                res.send(200,cert);
    });
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

    BUsers.findOne({email:email}, function(err,user){
        if( err )
            return res.send(503);
        else if( user && user._id.toString()!==userID.toString() ) { // Duplication
            return res.send(503,{error:'Select another display name and email.'});
        }
        else {
            BUsers.update( { _id: userID },
                { displayName: displayName, email: email }, function (err) {
                    if (err)
                        res.send(401,{});
                    else
                        res.send(200,{});
                });
        }
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
    throw "What the HELL";
});

app.get('/api/calendar', function(req,res) {

    var time = new Date(req.body.time);
    var title = req.body.title;
    var teamID = req.user.teamID;
    var userID = req.user._id;

    BTeams.count({ _id:teamID, admin:userID }, function(err,count){
        //if( err || count==0)
           // BEvents.find( { contributors:userID }, function(err,events) {
           //     res.send(200,{events:events});
           // })
        if( err )
            res.send(503);
        else
            BEvents.find({team:teamID}).populate('application').exec(function(err,events) {

                var filteredEvents = [];
                var callbackCount = 0;

                // Who can leave a comment on application can leave interview appointments (HM,Responder,Commentators)

                for( var i=0; i<events.length; i++ ) {

                    canCurrentUserLeaveComment(req.user._id, teamID, events[i].job, (function(event,eventsCount){
                        return function(err, can) {
                            if( can )
                                filteredEvents.push( event );

                            if( ++callbackCount >= eventsCount )
                                res.send(200,{events:filteredEvents});
                        };
                    })(events[i],events.length));
                }

            })
    });
});
// endregion

app.post('/requestInvitation', function(req,res) {

    var email = req.body.email;

    if( email ) {
        BInvitationRequest({
            requestDate: new Date(),
            requestEmail: email
        }).save( function() {
               res.send(200);
            });
    }
    else {
        res.send(200);
    }

});

// Save request for accessing to a file on server (For email opening detection)
app.get('/email/:fileName', function(req,res) {
    NA.trackEvent('Email', 'Image Request', req.query.q + '-' + (new Date()), function (err, resp) {
        if (!err && resp.statusCode === 200) {
            res.redirect( '/images/' + req.params.fileName );
            console.log('Event has been tracked with Google Analytics');
        }
    });
});

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