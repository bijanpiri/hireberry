/**
 * Created by Bijan on 04/29/2014.
 */
//mod=require('./models');
login=function(res,email,password){
    BUsers.findOne({email:email,password:password}, function(err,user){
        if(err) res.send('Faild');
        else if(!user) res.send('Wrong');
        else {
            crypto.randomBytes(48, function(ex, buf) {
                var token = buf.toString('hex');
                user.tempToken = token;
                BUsers.update(
                    {email:email,password:password},
                    {$set:{tempToken:token}},
                    function (err, numberAffected, raw) {
                        if (err)    return handleError(err);
                        else{
                            console.log('>>>>>>>>>>Login Request for '+email+' is accepeted.');
                            res.send(200,user);
                        }
                    });
            });
        }
    });
}

logout=function(res,tempToken) {
    BUsers.update(
        {tempToken:tempToken},
        {$set:{tempToken:''}},
        function (err, numberAffected, raw) {
            if (err)    return handleError(err);
            else {
                console.log('>>>>>>>>>>Logout Request for tempToken: '+tempToken+' is accepeted.');
                res.send(200,{});
            }
        });
}

findTempTokenOwner=function(res,temptoken){
    BUsers.findOne({tempToken:temptoken}, function(err,user){
        if(err) res.send(200,'{}');
        else if(!user) res.send(200,'{}');
        else res.send(200,user);
    });
}

changePassword=function(res,tempToken,oldpassword,newpassword) {
    BUsers.update( { tempToken: tempToken, password: oldpassword },
        { $set: { password: newpassword }},
        function (err, numberAffected, raw) {
            if (err) return handleError(err);
            else res.send(200,{});
        });
}

createFlyer=function(res,userid,flyerText) {
    var newflyer = BFlyers({text:flyerText, owner:userid});
    newflyer.save(function (err) {
        if(err)  handleError(err);
        else res.send(200,{});
    });
}

getFlyers=function(res,userid) {
    BFlyers.find({owner:userid}, function(err,flyers){
        if(err)  handleError(err);
        else { console.log(flyers); res.send(200,flyers); }
    });
}

checkUser=function(req,res){
    //if(!req.user)
    if((req.session && req.session.auth && req.session.auth.loggedIn)==undefined){
        // Set last page url for redirecting after login
        req.session.lastPage = req.originalUrl;
        res.redirect('/login');
    }
    return req.user!=null;
}

gettingReady=function(userID,callback) {

    getUserTeam( userID, function(err,team) {

        if( !team ) {
            createTeam('MyTeam', function(err,team){

                joinToTeam(userID,team._id, function() {

                    changeRoleInTeam(userID,team._id,'admin', function(){
                        callback();
                    });

                });
            });
        }
    })
}

getUserTeam=function(userID,callback) {

    BUsers.findOne({_id:userID}, function(err,user){

        if( err || !user || !user.teamID )
            callback( err, null );
        else
            BTeams.findOne({_id:user.teamID})
                .populate('admin members')
                .exec(function(err,team){
                    callback( null, team );
                });
    })
}

createTeam=function(teamName,callback) {

    BTeams({name:teamName}).save( function(err,team){
        if(err)
            callback(err,null);
        else
            callback(null,team);
    })

}

joinToTeam=function(userID,teamID,callback) {
    BUsers.update({_id:userID},{teamID:teamID}, function(err) {
        if(err)
            callback(err,null);
        else
            BTeams.update({_id:teamID},{$push:{members:userID}}, function(err) {
                callback(err);
            });
    })
}

leaveTeam=function(userID,oldTeamID, callback) {
    BUsers.update({_id:userID},{teamID:''}, function(err) {
        if(err)
            callback(err,null);
        else
            BTeams.update({_id:oldTeamID},{$pull:{members:userID}}, function(err) {
                callback(err);
            });
    });
}

changeRoleInTeam=function(userID,teamID,newRole,callback) {
    if( newRole=='admin' ) {
        // Set him as admin
        BTeams.update({_id:teamID},{admin:userID}, function(err) {
            if(err)
                callback(err);
            else
                callback(null);
        })
    }
    else {
        // Clear admin field
        BTeams.update({_id:teamID,admin:userID},{$unset:{admin:true}}, function(err) {
            if(err)
                callback(err);
            else
                callback(null);
        })
    }
}

inviteToTeam=function( invitedEmail, teamID, note, callback ) {
    BTeamInvitations({
        email: invitedEmail,
        team: teamID,
        note: note,
        time: new Date()})
        .save( function(err) {
            callback(err);
        })
}

assignForm=function(assigneeUserID,assignedFormID,callback) {
    BFlyers.update( {_id:assignedFormID}, {autoAssignedTo:assigneeUserID}, function(err){
        if(err)
            callback(err)
        else
            callback(null)
    })
}

askForCommentOnForm=function(note,userID,formID,callback) {
    BComments({
        note: note,
        comment: null,
        askingTime: new Date(),
        commentTime:null,
        commenter:userID,
        subjectType:'form',
        formID:formID
    }).save(function(err){
        callback(err)
    });
}

askForCommentOnApplication=function(note,userID,reqUserID,applicationID,callback) {
    BComments({
        note: note,
        comment: '',
        askingTime: new Date(),
        commentTime:'',
        commenter:userID,
        user:reqUserID,
        subjectType:'application',
        applicationID:applicationID
    }).save(function(err){
        callback(err)
    });
}

getAskedForCommentApplications=function(userID,callback) {
    BComments.find({commenter:userID,subjectType:'application',commentTime:''})
        .populate('applicationID')
        .populate('user','_id displayName email')
        .exec( function(err,applications) {
            callback( err, applications )
        });
}
getApplicationComments=function(appID,callback){
    BComments.find({applicationID:appID},function(err,comments){
        if(!err)
        callback(err,comments);
    })
}
getAskedForCommentForms=function(userID,callback) {
    BComments.find({commenter:userID,subjectType:'form',commentTime:''})
        .populate('formID')
        .exec( function(err,forms) {
            callback( err, forms )
        });
}

setComment=function(userID,askedForCommentID,comment,callback) {
    BComments.update({_id:askedForCommentID,commenter:userID},{
        comment: comment,
        commentTime: new Date()
    }, function(err) {
        callback(err);
    })
}

getComments=function(entityID ,entityType, callback) {
    var q = (entityType==='form') ? {formID:entityID} : {applicationID:entityID};

    BComments.find(q)
        .populate('commenter')
        .exec(function(err,comments) {
            callback(err,comments);
        })
}

addEvent=function(what,when,who,by,callback) {
    BEvents({
        time: when,
        title: what,
        team: by,
        contributors: who}).save( function(err) {
        callback();
    });
}
