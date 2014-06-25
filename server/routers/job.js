/**
 * Created by Bijan on 04/29/2014.
 */


// region Views
app.get('/flyer/new',function(req,res){
    res.cookie('flyerid','');
    res.redirect('/flyer/editor/0');
});

app.get('/flyer/embeded/:flyerID', function(req,res){

    console.log( "In: " + req.headers['referer'] )

    BFlyers.count({_id:req.params.flyerID,publishTime:{$ne:''}} , function(err,count) {
        if( err || count==0 )
            res.send(404);
        else
            BVisitStat({
                referer: req.headers['referer'],
                visitedUrl: req.url,
                visitTime: Date(),
                visitorIP: req.ip, //OR req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                flyerID: req.params.flyerID
            }).save( function(err) {
                    res.render('flyerEditor.ejs',{
                        title:'Job',
                        flyerid: req.params.flyerID,
                        templateID: 0,
                        editMode: false,
                        viewMode: "embeded",
                        existFlyer: true,
                        userCanLeaveComment: false
                    });
                });
    });

});

app.get('/flyer/:mode/:tid', function(req,res){

    var flyerid;
    var templateID = req.params.tid;
    var editMode = (req.params.mode || 'view').toLowerCase() !== 'view';
    var existFlyer = false;
    var flyerName = '';

    if( editMode && checkUser(req,res)==false )
        return;

    var renderNewFlyerView = function() {

        canCurrentUserLeaveComment( req.user._id, req.user.teamID, flyerid, function(err,canLeaveComment) {
            res.render('flyerEditor.ejs',{
                title:'Flyer Editor',
                boards:[],
                flyerid:flyerid,
                templateID:templateID,
                editMode: editMode,
                viewMode: "fullpage",
                existFlyer: existFlyer,
                userCanLeaveComment: canLeaveComment
            });
        });
    }

    var getLastFlyer = function() {

        flyerid = req.query.flyerid;

        if( flyerid ) { // Edit Flyer (FlyerID is passed by Query String)
            if(editMode)
                res.cookie('flyerid',flyerid);
            existFlyer = true;

            isHiringManager( req.user.teamID, req.user._id, function(err, isHM) {
                isResponderOfJob( flyerid, req.user._id, function(err,isRes){
                    if( !isHM && !isRes && editMode )
                        res.redirect('/flyer/view/0?flyerid='+flyerid);
                    else
                        renderNewFlyerView();
                });
            });
        }
        else {          // Query String is empty
            flyerid = req.cookies.flyerid;

            if( !flyerid ) {        // Cookie is empty. So make a new flyer
                BFlyers({
                    owner: req.user.teamID,
                    creator: req.user._id,
                    autoAssignedTo: req.user._id,
                    flyer: {count:0}
                }).save(function (err,newflyer) {
                        flyerid = newflyer._id;
                        res.cookie('flyerid',flyerid);

                        // Make n new ApplyByEmail router to mandrill
                        addApplyByEmailRouter(flyerid, function(err,result) {
                            renderNewFlyerView();
                        });

                    });

            } else {        // Cookie isn't empty. So laod it
                BFlyers.count({_id:flyerid}, function(err,count){
                    if(!err && count>0){
                        existFlyer = true;
                        renderNewFlyerView();
                    }
                    else {  // Flyer Draft is deleted.
                        // ToDo: Handle this situation better
                        res.clearCookie('flyerid');
                        return res.redirect('/flyer/new');
                    }
                });
            }
        }
    };

    getLastFlyer();
});
// endregion


// Return all the created forms (template)
app.get('/api/forms',  function(req,res){

    if( !checkUser(req,res) )
        return res.send(301);

    var teamID = req.user.teamID;
    var userID = req.user._id;

    BTeams.count({_id:teamID,admin:userID}, function(err,count) {
        if( err )
            return res.send(204);

        var isHM = ( count > 0 );

        findFlyers({owner: teamID},isHM);
        /*
         if( count > 0 ) // Admin
         // About Query: All his-owned flyers + other's published flyers + other's Asked-For-Publish flyers
         findFlyers({
         owner: teamID,
         $or:[
         {publishTime:{$ne:''}}, // Published
         {creator: userID},  // His-owned job
         {askedForPublish:true} // Asked-for-Publish
         ]
         });
         else    // Team member
         findFlyers({owner: teamID, autoAssignedTo:userID});
         */
    });

    /*
     About Permission

     */

    function findFlyers(query,isHiringManager) {

        BFlyers.find(query).populate('creator owner autoAssignedTo').exec( function(err,flyers) {
            if( err )
                return res.send(502,{error:err});

            // Reduce
            // ToDo: Make reducing async
            var forms = flyers.map( function(flyer) {
                var description = (flyer.flyer && flyer.flyer.description && flyer.flyer.description.length > 0)  ? flyer.flyer.description : 'Untitlted';
                var currentMode;

                if( flyer.askedForPublish == true )
                    currentMode = 'Asked For Publish';
                else
                    currentMode = flyer.publishTime ? "published" : "drafted";

                // Can current user leave a comment
                var commentPermission = false;
                var editPermission = false;
                if(isHiringManager) {
                    commentPermission = true;
                    editPermission = true;
                }
                else if(flyer.autoAssignedTo && req.user._id.toString()===flyer.autoAssignedTo.toString() ) {
                    commentPermission = true;
                    editPermission = true;
                }
                else {
                    var commentatorCount = flyer.commentators ? flyer.commentators.length : 0 ;
                    for( var i=0; i<commentatorCount; i++ ) {
                        if( flyer.commentators[i].toString() === req.user._id.toString() )
                            commentPermission = true;
                    }
                }

                return {
                    formName: description,
                    formID: flyer._id,
                    autoAssignedTo: flyer.autoAssignedTo,
                    creator: flyer.creator,
                    mode: currentMode,
                    comment: commentPermission,
                    edit: editPermission
                }
            } );

            res.send( {forms: forms} );
        });

    }

});

// region Flyers

app.delete('/api/job/:flyerID', function(req,res){

    if( !req.user )
        res.send(304);

    BFlyers.findOne({_id:req.params.flyerID}).populate('owner').exec( function(err,flyer){

        if( err || !flyer )
            return res.send(504);

        // Delete ApplyByEmail router from mandrill
        deleteApplyByEmailRouter(req.params.flyerID, function(err,result) {

            // Delete comments related to form which is deleting
            BComments.remove({formID:req.params.flyerID}, function(err){

                // ToDo: Delete comments related to form which is deleting

                if( flyer.owner.admin.toString() === req.user._id.toString() ) // Hiring Manager
                    BFlyers.remove({_id:req.params.flyerID}, function(err) {
                        res.send(200);
                    });
                else    // Responder
                    BFlyers.remove({_id:req.params.flyerID, autoAssignedTo:req.user._id}, function(err) {
                        res.send(200);
                    });

            });
        });

    });

});

app.get('/flyer/:templateID/json/:id', function(req,res){

    //if(!checkUser(req,res))
    //    return;

    var flyerid = req.params.id;
    var templateID = req.params.templateID;

    if( templateID==0 ) { // Load stored flyer
        BFlyers.findOne({_id:flyerid,publishTime:{$ne:''}})
            .populate('commentators','_id displayName email')
            .populate('autoAssignedTo','_id displayName email')
            .exec( function(err,flyer){
                if(err)
                    res.send('Oh oh error');

                if(flyer)
                    res.send(
                        {
                            flyer: flyer.flyer,
                            responder: flyer.autoAssignedTo,
                            commentators: flyer.commentators
                        });
                else
                    res.send('404, Not Found! Yah!');
            });
    }
    else { // Load a pre-built template

        var templates = require('../etc/templates.js');

        if( 0 < templateID && templateID < 10)
            res.send({
                flyer: templates.FlyerTemplates[ templateID ],
                responder: undefined,
                commentators: []
            });
        else
            res.send(200)
    }
});

app.post('/flyer/publish', function(req,res){

    if( !checkUser(req,res) )
        return;

    var flyer = req.body.flyer;
    var flyerID = flyer.flyerID;
    var userID = req.user._id;
    var teamID = req.user.teamID;
    var saveAsDraft = Boolean( req.body.saveAsDraft );

    if(saveAsDraft==='true') {
        notifyResponder('drafted', flyerID, userID, function() {
            saveInDatabase({flyer:flyer, askedForPublish:false, publishTime:''}, 'Position is saved as draft.')
        })
    }
    else {
        res.cookie('flyerid','');

        BTeams.count({_id:teamID,admin:userID}, function(err,count) {
            if(count>0) { // User is admin
                notifyResponder('published', flyerID, userID, function() {
                    saveInDatabase({flyer:flyer, askedForPublish:false, publishTime:new Date()}, 'Position is published.')
                })
            }
            else {
                addNotification( 'askForPublish', {flyerID: flyerID}, function() {
                    saveInDatabase({flyer:flyer, askedForPublish:true, publishTime:''}, 'Ask For Publish request is sent.');
                });
            }
        });
    }

    function saveInDatabase(param,successMessage) {
        BFlyers.update({_id:flyer.flyerid}, param,{upsert:true}, function(err){
            if(!err)
                res.send(200,{message:successMessage});
            else
                res.send(500,{result:'DB Error'});
        });
    }
});

app.post('/flyer/changeMode', function(req,res){

    if( !checkUser(req,res) )
        return;

    var flyerID = req.body.flyerID;
    var userID = req.user._id;
    var teamID = req.user.teamID;
    var newMode = req.body.mode.toLowerCase();

    if(newMode==='draft') {

        notifyResponder('drafted', flyerID, userID, function() {
            saveInDatabase({askedForPublish:false, publishTime:''})
        })
    }
    else {
        BTeams.count({_id:teamID,admin:userID}, function(err,count) {
            if(count>0 && newMode==='publish') { // User is admin

                notifyResponder('published', flyerID, userID, function() {
                    saveInDatabase({askedForPublish:false, publishTime:new Date()})
                })
            }
            else if(newMode==='ask for publish') {
                saveInDatabase({askedForPublish:true, publishTime:''});
            }
        });
    }

    function saveInDatabase(param,successMessage) {
        BFlyers.update({_id:flyerID}, param, function(err){
            if(!err){
                res.send(200,{message:'Changed'});
            }else
                res.send(500,{result:'DB Error'});
        });
    }
});

function notifyResponder(newState, flyerID, userID, callback) {
    BFlyers.count({_id:flyerID,autoAssignedTo:userID}, function(err,count) {

        if( !err && count==0 ) {// Current user isn't job responder, so notify its responder about publishing job

            addNotification('jobStateChanging',{flyerID:flyerID,newState:newState}, function() {
                callback()
            })
        } else {
            callback();
        }

    })
}

app.post('/flyer/inactive', function(req,res){

    var flyerID = req.body.flyerID;

    BFlyers.update( {_id:flyerID}, {$set:{publishTime:''}}, function(err){
        if(!err)
            res.send(200);
    });
});

app.post('/flyer/save', function(req,res){

    if( !req.user ) {
        res.send(304);
        return;
    }
    var flyer = req.body.flyer;
    var responder=req.body.responder||null;
    var commentators=req.body.commentators||[];

    if( !flyer.description || flyer.description.length == 0 )
        flyer.description = "Untitled" + (new Date()).toDateString();

    BFlyers.update({_id:flyer.flyerid},
        {flyer:flyer,autoAssignedTo:responder,commentators:commentators}, function(err){
            if(err) return res.send(401,{});

            res.send(200,{});
        });
});

app.get('/flyer/remove/:id', function(req,res){
    if(checkUser(req,res)){
        var flyerid = req.params.id;
        BFlyers.findOne({_id:flyerid},function(err,flyer){
            if(flyer.owner==req.user._id){

                BFlyers.remove({_id:flyerid},function(err){
                    if(!err)
                        res.redirect('/profile');
                    else
                        res.send('error deleting flyer:'+err);
                });

            }else
            {
                res.send(403, "You don't have permisson to remove this flyer");
            }
        });
    }
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


app.post('/api/job/:jobID/comment', function(req,res) {
    // Add a new comment on this job
    canCurrentUserLeaveComment(req.user._id,req.user.teamID,req.params.jobID,function(err,can){
        if(!err && can) {
            BJobComments({
                team: req.user.teamID,
                user: req.user._id,
                job: req.params.jobID,
                text: req.body.text,
                date: new Date()
            }).save( function(err,newComment) {
                // ToDo: Implement Notification Strategy Here
                BJobComments.findOne({_id:newComment._id})
                    .populate('user','displayName email')
                    .exec(function(err,newComment) {
                        res.send(200, newComment);
                    });
                notifyAllForJobComment(req.params.jobID,req.user._id);
            });
        }
    });
});
function notifyAllForJobComment(jobID,commentator){
    BFlyers.findOne({_id:jobID})
        .exec(function(err,job){
            var users={};
            job.commentators.forEach(function(c){users[c]=true;});
            users[job.autoAssignedTo]=true;
            delete users[commentator];

            var now=Date.now();
            var notifs=Object.keys(users).map(
                function(userId){
                    return{time:now,visited:false,user:userId,job:jobID};});

            notifs.forEach(function(not){BJobNotification(not).save();});
        });
}

app.get('/api/job/:jobID/comments', function(req,res) {
    // Get all comments on this job
    canCurrentUserLeaveComment(req.user._id,req.user.teamID,req.params.jobID,function(err,can){
        if(!err && can) {
            BJobComments.find({job: req.params.jobID})
                .populate('user','displayName email')
                .exec(function(err,comments) {
                    res.send(200,{comments:comments});
                });
        }
    });
});

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

app.get('/api/job/applyByEmail/state', function(req,res) {

    var flyerID = req.query.flyerID;

    BFlyers.findOne({_id: flyerID}, function(err,job) {
        if( job.mandrillRouterID )
            res.send({state:'on'});
        else
            res.send({state:'off'});
    });
});
