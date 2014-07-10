/**
 * Created by Bijan on 04/29/2014.
 */

// region Views
app.get('/team/:teamID/jobs', function(req,res) {
    res.render('hubpage.ejs',{title:'Hubpage',teamID:req.params.teamID});
})
// endregion


app.post('/api/team/settings',function(req,res){
    if(!checkUser(req,res))
        return;
    var userID = req.user._id;
    var teamID = req.user.teamID;
    var newName = req.body.teamName;
    var newAddress=req.body.teamAddress;
    var newTel=req.body.teamTel;
    var newAdmin=req.body.teamAdmin;

    BTeams.update(
        {admin:userID,_id:teamID},
        {name:newName,address:newAddress,tel:newTel,admin:newAdmin},
        function(err,affected) {
            if( err || affected==0 )
                return res.send(401);
            res.send(200);
        })
});

app.get('/api/team/settings',function(req,res){

    if(!checkUser(req,res))
        return;
    var teamID=req.user.teamID;
    BTeams.findOne({_id:teamID})
        .populate('members','_id displayName email')
        .populate('admin','_id displayName email')
        .exec(function(err,team){
            res.send(200,team);
        });

})

app.post('/api/team/name',function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;
    var teamID = req.user.teamID;
    var newName = req.body.newName;

    BTeams.update({admin:userID,_id:teamID},{name:newName}, function(err,affected) {
        if( err || affected==0 )
            return res.send(401);
        res.send(200);
    })
});

app.post('/api/team/admin',function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;
    var teamID = req.user.teamID;
    var newAdmin = req.body.newAdmin;

    BTeams.update({admin:userID,_id:teamID},{admin:newAdmin}, function(err,affected) {
        if( err || affected==0 )
            return res.send(401)
        res.send(200);
    })
});

app.post('/api/team/invite', function(req,res){

    if( !checkUser(req,res) )
        return;

    var teamID = req.user.teamID;
    var invitedEmail = req.body.email;
    var note = req.body.note;
    inviteToTeam( invitedEmail, teamID, note, function(err,invitation) {

        BTeams.findOne({_id:teamID}, function(err,team){

            var emailBody = 'You are invited to join to ' + team.name + '<br/>' +
                'Hiring manager of ' + team.name + ' has written this note for you:<br/>' +
                '<br><div style="font-weight:700; border-left: 3px solid rgb(80, 162, 65);padding: 10px;margin: 10px; ">' + note.replace('\n','<br/>') + '</div>' +
                '<br/>Your promo code is: <a href="' + req.headers.origin + '/register?code=' + invitation._id + '">' + invitation._id + '</a>' +
                '<br/><a href="' + req.headers.origin + '">Go to Hireberry</a>';

            var message = {
                "html": emailBody,
                "text": emailBody ,
                "subject": "Team Invitation",
                "from_email": emailConfig.fromAddress,
                "from_name": team.name,
                "to": [{
                    "email": invitedEmail,
                    "name": '',
                    "type": "to"
                }],
                "headers": {
                    "Reply-To": emailConfig.replyAddress
                }
            };

            mandrill_client.messages.send({"message": message, "async": false}, function(result) {/*Succeed*/ }, function(e) {/*Error*/});

            res.send(200);
        });
    });

});

// Get current team information
app.get('/api/user/team',function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;

    getUserTeam(userID, function(err,team) {
        res.send(200,{team:team});
    })
});

// Accept an invitation
app.post('/api/user/team/join', function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;
    var oldTeamID = req.user.teamID;
    var newTeamID = req.body.teamID;
    var invitationID = req.body.invitationID;
    var answer = req.body.answer;

    BTeamInvitations.remove( {_id:invitationID} ,function() {

        if( answer === 'accept' ) {
            joinToTeam( userID, newTeamID, function(err) {
                addNotification('join',{teamID:newTeamID,userID:userID}, function() {
                    res.send(200);
                })
            });
        }
        else {
            res.send(200);
        }

    })


});

app.post('/api/team/member/remove', function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;
    var teamID = req.user.teamID;
    var disjoinedUserID = req.body.userID;

    // Check whether current user is hiring manager or not
    BTeams.count({_id:teamID,admin:userID}, function(err,count){
        if( err || count==0 )
            return res.send(304);

        // Find user's other teams
        BTeams.find({members:disjoinedUserID,_id:{$ne:teamID}}, function(err,teams){
            if( err || !teams || teams.length===0)
                return res.send(504);

            // Disjoin user from team and join to another one
            leaveTeam( disjoinedUserID, teamID, function() {
                BUsers.update({_id:disjoinedUserID},{teamID:teams[0]._id}, function(err) {

                    // Assign the flyers which this user is their responder to hiring manager
                    BFlyers.update({owner:teamID,autoAssignedTo:disjoinedUserID},{autoAssignedTo:userID}, function(err){
                        res.send(200);
                    })

                });
            })
        })
    })

});

app.get('/api/teams', function(req,res) {
    BTeams.find({members:req.user._id}, function(err,teams){
        res.send(200,{teams:teams});
    })
});

app.get('/api/teams/newMembers', function(req,res) {
    BTeams.find({HiringManagerNotified:{$ne:true}}, function(err,members){
        res.send(200,{teams:teams});
    });
});

app.post('/api/user/changeTeam', function(req,res) {
    var userID = req.user._id;
    var teamID = req.body.teamID;

    BUsers.update({_id:userID},{teamID:teamID}, function(err) {
        if(err)
            res.send(307);
        else
            res.send(200);
    });
})

app.post('/api/user/comment',function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;
    var askForCommentID = req.body.askForCommentID;
    var comment = req.body.comment;

    setComment(userID, askForCommentID, comment, function(err) {
        res.send(200);
    })
});

app.get('/api/team',function(req,res){

    if( !checkUser(req,res) )
        return;

    var teamID = req.user.teamID;
    var members = [];

    BTeams.findOne({_id:teamID})
        .populate('members','_id displayName email')
        .populate('admin','_id displayName email')
        .exec( function(err,team){
            if(err || !team)
                return res.send(305);

            BTeamInvitations.find({team:teamID},{email:1}, function(err,invitedPersons) {

                res.send(200,{
                    admin: team.admin,
                    user :req.user._id,
                    info: {
                        id: team._id,
                        name: team.name,
                        tel: team.tel,
                        address: team.address
                    },
                    members: team.members,
                    invited: invitedPersons
                });

            });

        })
});

app.get('/api/careerpage/:teamID', function(req,res){
    BTeams.findOne({_id:req.params.teamID}, function(err,team){
        if( err || !team )
            return res.send(404);
       return res.send(200,{flyer:team.careerPage || {}});
    });
});

app.post('/api/careerpage/:teamID', function(req,res){
    BTeams.update({_id:req.params.teamID}, {careerPage: req.body.careerPage}, function(err){
        if( err )
            return res.send(404);
        return res.send(200);
    });
});

app.get('/:mode/careerpage/:teamID', function(req,res){

    if(req.params.mode==='editor' && req.user && req.user.teamID.toString() === req.params.teamID ){
        res.render('careerEditor.ejs',{
            title: 'Career Page Editor',
            editMode: true,
            teamID: req.params.teamID
        });
    }
    else if(req.params.mode==='view' ){

        BTeams.findOne({_id:req.params.teamID}, function(err,team) {
            if( err || !team )
                return res.send(404);

            res.render('careerEditor.ejs',{
                title: team.name + ' | Career Page',
                editMode: false,
                teamID: req.params.teamID
            });
        })

    }
    else
        res.redirect('/view/careerpage/' + req.params.teamID);


});

app.get('/api/team/:teamID/positions',function(req,res){

    var teamID = req.params.teamID;
    var teamName = '';

    BFlyers.find({owner:teamID, publishTime:{$ne:''}, askedForPublish:{$ne:true}})
        .populate('owner')
        .exec(function(err,positions){
            if(err)
                return res.send(305);

            var positionsList = positions.map( function(position) {
                return {
                    id: position._id,
                    title: position.flyer ?
                        position.flyer.description:'No Description',
                    flyer: position.flyer
                }
            })

            BTeams.findOne({_id:teamID}, function(err,team){
                res.send(200, {
                    teamName: team.name,
                    teamTel: team.tel,
                    teamAddress: team.address,
                    positions: positionsList
                });
            })

        })
});