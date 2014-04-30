/**
 * Created by Bijan on 04/29/2014.
 */

// region User

app.get('/api/user/team',function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;

    getUserTeam(userID, function(err,team) {
        res.send(200,{team:team});
    })
});

app.get('/api/user/invitations', function(req,res){

    if( !checkUser(req,res) )
        return;

    var email = req.user.email;

    BInvitations.find({invitedEmail:email})
        .populate('inviterTeam')
        .exec(function(err,invitations) {
            if(!err)
                res.send(200,invitations);
        });

});

app.post('/api/user/team/join', function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;
    var oldTeamID = req.user.teamID;
    var newTeamID = req.body.teamID;
    var invitationID = req.body.invitationID;
    var answer = req.body.answer;

    BInvitations.remove( {_id:invitationID} ,function() {

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


// endregion
