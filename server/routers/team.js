/**
 * Created by Bijan on 04/29/2014.
 */


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

app.post('/api/team/form/assign', function(req,res){

    if( !checkUser(req,res) )
        return;

    //var userID = req.user._id;
    var userID = req.body.userID;
    var formID = req.body.formID;

    // Check whether current user is admin or not
    assignForm(userID, formID, function(err) {
        res.send(200)
    } );

});

app.post('/api/team/form/askForComment', function(req,res){

    if( !checkUser(req,res) )
        return;

    //var userID = req.user._id;
    var userID = req.body.userID;
    var formID = req.body.formID;

    // Check whether current user is admin or not
    askForCommentOnForm('',userID, formID, function(err) {
        res.send(200)
    } );

});

app.post('/api/team/application/askForComment', function(req,res){

    if( !checkUser(req,res) )
        return;

    //var userID = req.user._id;
    var userID = req.body.userID;
    var appID = req.body.appID;
    var note=req.body.note;
    // Check whether current user is admin or not
    askForCommentOnApplication(note,userID,req.user._id, appID, function(err) {
        res.send(200)
    } );

});

app.get('/api/user/application/askedForComment',function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;

    getAskedForCommentApplications(userID, function(err,applications) {
        res.send(200,{applications:applications});
    })
});

app.get('/api/user/form/askedForComment',function(req,res){

    if( !checkUser(req,res) )
        return;

    var userID = req.user._id;

    getAskedForCommentForms(userID, function(err,forms) {
        res.send(200,{forms:forms});
    })
});

app.get('/api/user/form/askedForPublish',function(req,res){

    if( !checkUser(req,res) )
        return;

    BTeams.count({_id:req.user.teamID,admin:req.user._id}, function(err,count){
        if( !err && count > 0 ) {
            BFlyers.find({owner:req.user.teamID, askedForPublish:true}, function(err,askedForPublishList) {
                res.send(200, askedForPublishList.map( function(item) {return item._id} ))
            })
        } else {
            res.send(200,[]);
        }
    })
});


app.get('/api/application/comments',function(req,res){
    if(!checkUser(req,res))
        return;
    var appID=req.query.appID;
    getApplicationComments(appID,function(err,comments){
        res.send(200,
            {
                comments:comments,
                user:req.user._id
            });
    });
});
app.post('/api/application/comments',function(req,res) {
    if(!checkUser(req,res))
        return;

    var commentID=req.body.commentID;
    var comment=req.body.comment;
    BComments.update(
        {_id:commentID,commenter:req.user._id},
        {comment:comment,commentTime:new Date()},
        function(err,affected){
            if(affected==0)
                res.send(401)
            else if(err)
                res.send(500);
            else
            res.send(200);
        }
    )
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

app.get('/api/form/comments',function(req,res){

    if( !checkUser(req,res) )
        return;

    // ToDo: (Security) Check wheter user can access this applicationID or no.
    var userID = req.user._id;
    var formID = req.query.formID;

    getComments(formID, 'form', function(err,comments) {
        res.send(200,{comments:comments});
    })
});

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

app.get('/team/:teamID/jobs', function(req,res) {
    res.render('hubpage.ejs',{title:'Hubpage',teamID:req.params.teamID});
})

app.get('/api/team/:teamID/positions',function(req,res){

    var teamID = req.params.teamID;
    var teamName = '';

    BFlyers.find({owner:teamID, publishTime:{$ne:''}})
        .populate('owner')
        .exec(function(err,positions){
            if(err)
                return res.send(305);

            var positionsList = positions.map( function(position) {
                return {
                    id: position._id,
                    title: position.flyer.description
                }
            })

            BTeams.findOne({_id:teamID}, function(err,team){
                res.send(200, {
                    teamName: team.name ,
                    positions: positionsList
                });
            })

        })
});


