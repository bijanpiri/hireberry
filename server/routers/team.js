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
    var note=req.body.note;
    inviteToTeam( invitedEmail, teamID, note, function() {
        res.send(200);
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

// Get invitations of user
app.get('/api/user/invitations', function(req,res){

    if( !checkUser(req,res) )
        return;

    var email = req.user.email;

    BTeamInvitations.find({email:email})
        .populate('team')
        .exec(function(err,invitations) {
            if(!err)
                res.send(200,invitations);
        });

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
            //changeRoleInTeam( userID, oldTeamID, 'user', function(err) {
            //leaveTeam( userID, oldTeamID, function(err) {
            joinToTeam( userID, newTeamID, function(err) {
                res.send(200);
            });
            //})
            //})
        }
        else {
            res.send(200);
        }

    })


});

app.get('/api/user/teams', function(req,res) {
    BTeams.find({members:req.user._id}, function(err,teams){
        res.send(200,teams);
    })
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

app.get('/api/team/members',function(req,res){
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
                team:team,
                user :req.user._id,
                invited:invitedPersons
            });
        });

    })
});



