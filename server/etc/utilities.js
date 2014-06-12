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

notificationsType = {
    'join' : 1,
    'commentOnApplication': 2,
    'commentOnJob': 3,
    'jobStateChanging': 4
};

addNotification = function( notifType, notifMoreInfo, callback ) {

    BNotifications({
        type: notificationsType[notifType],
        time: new Date(),
        more: notifMoreInfo
    }).save( function(err){
            callback(err)
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

    BTeams({name:teamName,plan:0,planLastRenewDate:new Date()}).save( function(err,team){
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

addApplyByEmailRouter=function(flyerID,callback){
    var domain = "ats.booltin.com";
    var pattern = flyerID;
    var url = "http://booltin.herokuapp.com/api/applications/applyByEmail/" + flyerID;

    mandrill_client.inbound.addRoute({"domain": domain, "pattern": pattern, "url": url}, function(result) {
        BFlyers.update({_id:flyerID}, {mandrillRouterID:result.id}, function() {
            callback(null,result);
        });
    }, function(e) {
        callback(e,{});
    });
}

deleteApplyByEmailRouter=function(flyerID,callback){

    BFlyers.findOne({_id:flyerID}, function(err,flyer) {
        if( err || !team )
            callback(err,{});
        else {
            mandrill_client.inbound.deleteRoute({"id": flyer.mandrillRouterID}, function(result) {
                BFlyers.update({_id:flyerID}, {mandrillRouterID:undefined}, function() {
                    callback(null,result);
                });
            }, function(e) {
                callback(e,{});
            });
        }
    });
}

assignForm=function(assigneeUserID,assignedFormID,callback) {
    BFlyers.update( {_id:assignedFormID}, {autoAssignedTo:assigneeUserID}, function(err){
        if(err)
            callback(err)
        else
            callback(null)
    })
}

askForCommentOnForm=function(note,userID,reqUserID,formID,teamID,callback) {
    BComments({
        note: note,
        comment: null,
        askingTime: new Date(),
        commentTime:null,
        commenter:userID,
        user:reqUserID,
        subjectType:'form',
        formID:formID,
        team: teamID
    }).save(function(err){
            callback(err)
        });
}

askForCommentOnApplication=function(note,userID,reqUserID,applicationID,teamID,callback) {
    BComments({
        note: note,
        askingTime: new Date(),
        commenter:userID,
        user:reqUserID,
        subjectType:'application',
        applicationID:applicationID,
        team: teamID
    }).save(function(err){
            callback(err)
        });
}

getNewComments=function(userID, teamID, callback) {

    // Forms
    function newCommentsOnForms(callback) {

        BFlyers.find({autoAssignedTo:userID,owner:teamID}, function(err,jobs) {
            var jobsID = jobs.map(function(job){return job._id});

            BComments.find({formID:{$in:jobsID}, commentTime:{$ne:null}, askerNotified:{$exists:false}})
                .populate('formID')
                .populate('commenter','_id displayName email')
                .exec( function(err, fcomments) {
                    callback( err, fcomments, jobsID )
                });
        });
    }

    // Application
    function newCommentsOnApplications(jobsID, callback) {

        BApplications.find({flyerID:{$in:jobsID}}, function(err,applications) {
            var applicationsID = applications.map(function(application){return application._id});

            BComments.find({applicationID:{$in:applicationsID}, commentTime:{$ne:null}, askerNotified:{$exists:false}})
                .populate('applicationID')
                .populate('commenter','_id displayName email')
                .exec( function(err, acomments) {
                    callback( err, acomments )
                });
        });
    }

    newCommentsOnForms( function(err, fcomments, jobsID) {
        newCommentsOnApplications( jobsID, function(err,acomments) {
            callback(err,fcomments.concat( acomments ));
        })
    })
}

isResponderOfApplication = function(appID,userID,callback) {
    BApplications.findOne({_id:appID}, function(err,application) {
        if( err || !application)
            callback(false);
        else
            isResponderOfJob(application.flyerID,userID,callback);
    });
}

isResponderOfJob = function(jobID,userID,callback) {
    BFlyers.count({_id:jobID,autoAssignedTo:userID}, function(err,count){
        if( err || count==0 )
            callback(false);
        else
            callback(true);
    })
}

markCommentAsRead=function(userID, teamID, commentID, callback) {

    BComments.findOne({_id:commentID}, function(err,comment) {
        if( err )
            return callback(err);
        else if( comment.applicationID )
            isResponderOfApplication(comment.applicationID, userID, function(allowed) {
                if( allowed )
                    markAsRead(commentID,teamID,callback);
                else
                    callback({error:'Not allowed'});
            });
        else if( comment.formID )
            isResponderOfJob( comment.formID, userID, function(allowed) {
                if(allowed)
                    markAsRead(commentID,teamID,callback);
                else
                    callback({error:'Not allowed'});
            })
        else
            callback({error:'Unknown error'});
    });

    function markAsRead(commentID, teamID, callback) {
        BComments.update({_id:commentID, team:teamID},{askerNotified:true}, function(err) {
            callback( err )
        });
    }
}

getAskedForCommentApplications=function(userID, teamID, callback) {
    BComments.find({commenter:userID, team: teamID, subjectType:'application', commentTime:null})
        .populate('applicationID')
        .populate('user','_id displayName email')
        .exec( function(err,applications) {
            callback( err, applications )
        });
}

getApplicationComments=function(appID,callback){
    BComments.find({applicationID:appID})
        .populate('user commenter','_id displayName email')
        .sort({commentTime:+1})
        .exec(function(err,comments){
            if(!err)
                callback(err,comments);
        })
}

getAskedForCommentForms=function(userID, teamID, callback) {
    BComments.find({commenter:userID, team: teamID, subjectType:'form', commentTime:null})
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
