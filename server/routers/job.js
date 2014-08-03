/**
 * Created by Bijan on 04/29/2014.
 */

var htmlToText = require('html-to-text');

//Get price of job boards. The returned prices for Linkedin and Indeed are always $195 and $50 respectively.
//This function use to initialize of price array when promote.ejs load.
//If name==null then list of prices is returned.
var getJobBoardPrice=function(name,callback) {

    if(name)
    {
        BJobBoardPrice.findOne({name:name},function(er,rst)
        {
            var joboardlist={};
            for(var i=0;i<rst.length;i++)
                joboardlist[rst[i]._doc.name]=rst[i]._doc.price;
            callback(err,joboardlist);
        });
    }
    else
    {
        BJobBoardPrice.find({ name: { $in: [ 'behance', 'github','indeed','dribbble','linkedin' ,'stack overflow'] } })
            .exec(function(err, rst)
            {
                var joboardlist={};
                for(var i=0;i<rst.length;i++)
                    joboardlist[rst[i]._doc.name]=rst[i]._doc.price;

                callback(err,joboardlist);
            });
    }

}

var extractPromoteInfo= function (flyer,callback) {

    var PromoteInfo=new Object();
    PromoteInfo.positionTitle=flyer.description;
    PromoteInfo.logo=flyer.logo;
    PromoteInfo.address="";
    PromoteInfo.skills="";
    PromoteInfo.description="";
    PromoteInfo.workCondition="";

    if(flyer.widgets)
    {
        for(var i=0;i<flyer.widgets.length;i++)
        {
            switch(flyer.widgets[i].type) {
                case "1":  //text
                    PromoteInfo.description=flyer.widgets[i].Contents.text;
                    break;
                case "6":  //map
                    PromoteInfo.address=flyer.widgets[i].Contents.address;
                    break;
                case "8":  //text
                    PromoteInfo.workCondition=flyer.widgets[i].Contents.work;
                    break;
                case "14":  //skill
                    PromoteInfo.skills=flyer.widgets[i].Contents;
                    break;

                default:
                    break;
            }
        }
    }

    PromoteInfo.description = htmlToText.fromString(PromoteInfo.description, {
        wordwrap: 130
    }).replace(/\n/g,'<br/>');

    callback(PromoteInfo);
}

var getFlyerInfo= function(userID,flyerid,templateID,callback){
    //if(!checkUser(req,res))
    //    return;


    if( templateID==='0' ) { // Load stored flyer
        BFlyers.findOne({_id:flyerid})
            .populate('commentators','_id displayName email')
            .populate('autoAssignedTo','_id displayName email')
            .exec( function(err,flyer){
                if(err)
                    return  callback('Oh oh error',null,null);

                if(flyer){
                    flyer.flyer.flyerid = flyer._id; // For fixing a problem (when flyer is created recently and just has count:0 field)
                    callback(null,flyer.flyer,flyer.autoAssignedTo,flyer.commentators,null);
                }
                else
                    callback( null,null,undefined,[],'404, Not Found! Yah!');
            });
    }
    else { // Load a pre-built template

        var templates = require('../etc/templates.js');

        if( 0 < templateID && templateID < 10)
            callback( null, templates.FlyerTemplates[ templateID ], userID, [], null );
        else
            callback( null, null, userID, [], 200);
    }
}

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

function notifyAllForJobComment(jobID,comment){
    BFlyers.findOne({_id:jobID})
        .exec(function(err,job){
            var users={};
            job.commentators.forEach(function(c){users[c]=true;});
            users[job.autoAssignedTo]=true;
            delete users[comment.user._id];
            var now=Date.now();
            var notifs=Object.keys(users).map(
                function(userId){
                    return {
                        time:now,
                        visited:false,
                        user:userId,
                        comment:comment._id,
                        editor:comment.user,
                        job:jobID};}
            );

            notifs.forEach(function(not){BJobNotification(not).save();});
        });
}

function checkForPublish( teamID, newMode, callback ) {

    BTeams.findOne({_id:teamID}, function(err,team) {
        BFlyers.count({publishTime:{$ne:''}}, function(err,publishedCount) {

            if( (newMode==='publish' || newMode==='askedForPublish') && team.plan == 0 && publishedCount>=1)
                callback(false);
            else
                callback(true);
        });
    });

}

// region Views
app.get('/flyer/new',function(req,res){
    res.cookie('flyerid','');
    res.redirect('/flyer/editor/0');
});

app.get('/dashboard/promotepanel',function(req,res){

        res.render("promotePanel.ejs",{
            title:"Promote Panel"
        });
});

app.get('/paypromote',function(req,res){

    var message="";
    if(req.query.result=="1")
        message="Payment process successfully done. Your advertisement will be promoted within the next 48 hours.";
    else
        message="Payment process failed.";

    res.render("paypromote.ejs",
        {
            title:"Payment report",
            PositionTitle:"---",
            PayInfo:message
        });

});

app.get('/flyer/promote/:templateID/:flyerID',function(req,res){

    var flyerid = req.params.flyerID;
    var templateID = req.params.templateID;
    var userID = req.user._id;

    getFlyerInfo(userID,flyerid,templateID,function(err,flyer,autoAssignedTo,commentators,data){

        if(err)
            res.send(err);
        else if(flyer)
        {
            extractPromoteInfo(flyer, function(PromoteInfo)
            {
                res.render('promote.ejs',
                    {title:'Promote',
                        FlyerID:flyerid,
                        PositionTitle:PromoteInfo.positionTitle,
                        Logo:PromoteInfo.logo,
                        Address:PromoteInfo.address,
                        Skills:PromoteInfo.skills,
                        Description:PromoteInfo.description,
                        WorkCondition :PromoteInfo.workCondition,
                        JobLink: "/flyer/embeded/"+flyerid
                    });
            });
        }
        else
            res.send(data);
    });
});

app.get('/flyer/embeded/:flyerID', function(req,res){

    var userID = req.user ? req.user._id.toString() : undefined;

    BFlyers.findOne({_id:req.params.flyerID} , function(err,flyer) {
        if( err || !flyer  )
            res.send(404);
        else if( flyer.publishTime!=='' || (flyer.autoAssignedTo && userID===flyer.autoAssignedTo.toString()) ){ // Published or is owner

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
        }
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
                title:'Editor',
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
                    flyer: {
                        count:0,
                        thanksMessage:'<div id="ThanksMessageEditor" class="text-widget" contenteditable="true"><div style="text-align: center;"><b><font size="6">{ Thanks }</font></b></div><div style="text-align: center;"><br></div><div style="text-align: center;">We\'ve received your application request and will notify you ASAP.</div></div>'
                    }
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

// region API

//Call when loading promotePanel.ejs
app.get('/api/dashboard/getinfo',function(req,res){
    BPromoteInfo.find()
        .populate('flyerID')
        .exec( function(err, dataPromote) {
            //data.flyerID.populate('owner');
            if(err)
            {
                return res.send(502,{error:err});
            }
            else
            {
                BTeams.find()
                    .exec( function(err, dataTeam) {

                        var result=new Array();

                        for(var i=0;i<dataPromote.length;i++)
                        {
                            var item=new Object();
                            item.Date=dataPromote[i].time;
                            item.JobBoards=dataPromote[i].jobBoards;
                            item.TotalPrice=dataPromote[i].totalPrice;
                            item.FlyerId=dataPromote[i].flyerID._id.toString();
                            item.JobTitle=dataPromote[i].flyerID.flyer.description;
                            item.Preview=dataPromote[i].jobBoardsPreview;
                            var TeamID=dataPromote[i].flyerID.owner.toString();

                            item.TeamID="";
                            item.TeamName="";
                            for(var j=0;j<dataTeam.length;j++)
                            {
                                if(TeamID==dataTeam[j]._id.toString())
                                {
                                    item.TeamID=TeamID;
                                    item.TeamName=dataTeam[j].name;
                                    break;
                                }
                            }
                            result.push(item);
                        };
                        res.send(200,result);
                    });
            }
        });
});


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

        //findFlyers({owner: teamID},isHM);

        if( count > 0 ) // Admin
        // About Query: All his-owned flyers + other's published flyers + other's Asked-For-Publish flyers
            findFlyers({
                owner: teamID,
                $or:[
                    {publishTime:{$ne:''}}, // Published
                    {creator: userID},  // His-owned job (event not published ones)
                    {askedForPublish:true} // Asked-for-Publish
                ]
            },isHM);
        else    // Team member
            findFlyers({owner: teamID, $or:[{autoAssignedTo:userID},{commentators:userID}] },isHM);

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
                else if(flyer.autoAssignedTo && req.user._id.toString()===flyer.autoAssignedTo._id.toString() ) {
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

app.post('/api/flyer/confirmpromote',function(req,res){

    var SelectedJobBoards=req.body.jobBoardInfo.PaymentInfo.SelectedJobBoards;

    var TotalPayment=0.0;
    getJobBoardPrice(null,function(err,jblist)
    {

        if(err)
            res.send(400,{data:"Job board price list can not load."});
        else
        {
            var LinkedindIdx=-1;
            for(var i=0;i<SelectedJobBoards.length;i++)
            {
                if( SelectedJobBoards[i].Name.toLowerCase()=="linkedin")
                {
                    LinkedindIdx=i;
                    continue;
                }
                else if(SelectedJobBoards[i].Name.toLowerCase()=="indeed")
                {
                    var Price=SelectedJobBoards[i].Price;
                    TotalPayment+=parseFloat(Price);
                }
                else
                {
                    var Price=jblist[SelectedJobBoards[i].Name.toLowerCase()];
                    TotalPayment+=  parseFloat (Price);
                }
            }
            if(LinkedindIdx>=0)
            {
                var name ='linkedin-'+SelectedJobBoards[LinkedindIdx].Country;
                BJobBoardPrice.findOne({name:name},function(err,rst)
                {
                    var result=rst._doc.postalCodePrice;
                    if(rst==null || err!=null)
                        res.send(400,"Country or postal code not found");
                    else
                    {
                        if(result['-1'])
                        {
                            TotalPayment+=parseFloat(result['-1'].slice(3));
                        }
                        else
                        {
                            TotalPayment+=parseFloat(result[SelectedJobBoards[LinkedindIdx].PostalCode].Price.slice(3));
                        }

                        BPromoteInfo(
                            {
                                totalPrice: TotalPayment,
                                jobBoards:SelectedJobBoards,
                                flyerID:req.body.flyerID,
                                jobBoardsPreview:req.body.jobBoardInfo.JobBoardListPreiview,
                                time:new Date()
                            }).save(function(err,data){
                                if(err)
                                    res.send(502,{error:err});
                                else
                                {
                                    //res.redirect('/pay?amount='+TotalPayment+"&jbp=1");
                                    res.send(200,{PromoteId:data._doc._id.toString()});
                                }
                            });
                    }
                });

            }
            else
            {
                BPromoteInfo(
                    {
                        totalPrice: TotalPayment,
                        jobBoards:SelectedJobBoards,
                        flyerID:req.body.flyerID,
                        jobBoardsPreview:req.body.jobBoardInfo.JobBoardListPreiview,
                        time:new Date()
                    }).save(function(err,data){
                        if(err)
                            res.send(502,{error:err});
                        else
                        {
                            //res.redirect('/pay?amount='+TotalPayment+"&jbp=1");
                            res.send(200,{PromoteId:data._doc._id.toString()});
                        }
                    });
            }
        }
    });

});

app.post('/api/flyer/submitpromote',function(req,res){

    if(req.body.jobBoardInfo)
    {
        var SelectedJobBoards=req.body.jobBoardInfo.SelectedJobBoards;


        var TotalPayment=0.0;
        getJobBoardPrice(null,function(err,jblist)
        {

            if(err)
                res.send(400,{data:"Job board price list can not load."});

            var joboardlist=new Array();;
            var LinkedindIdx=-1;
            for(var i=0;i<SelectedJobBoards.length;i++)
            {
                var item=new Object();
                item.Name=SelectedJobBoards[i].Name;
                item.Price=jblist[SelectedJobBoards[i].Name.toLowerCase()];

                if( SelectedJobBoards[i].Name.toLowerCase()=="linkedin")
                {
                    LinkedindIdx=i;
                    continue;
                }
                else if(SelectedJobBoards[i].Name.toLowerCase()=="indeed")
                {
                    item.Price=SelectedJobBoards[i].Price;
                    TotalPayment+=parseFloat(SelectedJobBoards[i].Price);
                }
                else
                {
                    item.Price=jblist[SelectedJobBoards[i].Name.toLowerCase()];
                    TotalPayment+=  parseFloat (jblist[SelectedJobBoards[i].Name.toLowerCase()]);
                }
                joboardlist.push(item);
            }
            if(LinkedindIdx>=0)
            {
                var item=new Object();
                item.Name=SelectedJobBoards[LinkedindIdx].Name;
                var name ='linkedin-'+SelectedJobBoards[LinkedindIdx].Country;
                item.Price=jblist[SelectedJobBoards[LinkedindIdx].Name.toLowerCase()]
                BJobBoardPrice.findOne({name:name},function(err,rst)
                {
                    var result=rst._doc.postalCodePrice;
                    if(rst==null || err!=null)
                        res.send(400,"Country or postal code not found");
                    else
                    {
                        if(result['-1'])
                        {
                            item.Price=result['-1'].slice(3);
                            TotalPayment+=parseFloat(item.Price);
                        }
                        else
                        {
                            item.Price=result[SelectedJobBoards[LinkedindIdx].PostalCode].Price.slice(3);
                            TotalPayment+=parseFloat(item.Price);
                        }
                    }
                    joboardlist.push(item);
                    res.send(200,{TotalPayment:TotalPayment,SelectedJobBoards:joboardlist});

                });
            }
            else
                res.send(200,{TotalPayment:TotalPayment,SelectedJobBoards:joboardlist});

        });
    }
    else
        res.send(200,{TotalPayment:0.0,SelectedJobBoards:new Array()});
});

//Get price of job boards. (see getJobBoardPrice function description)
app.get('/api/jbprice',function(req, res) {
    getJobBoardPrice(null,function(err,rst)
    {
        if(err)
            res.send(400,{data:"Job board price list can not load."});

        res.send(200,rst);
    });
});

//Return list of price of selected country for linkedin
app.get('/api/flyer/promote/ldprice/:country' ,function(req,res)
{
    var country = req.params.country;
    var name ='linkedin-'+country;
    BJobBoardPrice.findOne({name:name},function(err,rst)
    {
        if(rst==null || err!=null)
            res.send(400,"Country or postal code not found");
        else
            res.send(200,rst.postalCodePrice);
    });
});

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

app.get('/flyer/:templateID/json/:flyerID', function(req,res) {
    var userID = req.user._id;
    var flyerid = req.params.flyerID;
    var templateID = req.params.templateID;

    getFlyerInfo(userID,flyerid,templateID,function(err,flyer,autoAssignedTo,commentators,data){

        if(err)
            res.send(err);
        else if(data)
            res.send(data);
        else
        {
            res.send(
                {
                    flyer: flyer,
                    responder: autoAssignedTo,
                    commentators:commentators
                });
        }

    });
});

app.post('/flyer/publish', function(req,res){

    if( !checkUser(req,res) )
        return;

    var flyer = req.body.flyer;
    var flyerID = flyer.flyerID;
    var userID = req.user._id;
    var teamID = req.user.teamID;
    var saveAsDraft = Boolean( req.body.saveAsDraft );

    checkForPublish( teamID, 'publish', function(allowed) {
        if(allowed==false)
            return res.send(503,'Free plan limitation');

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
});

app.post('/flyer/changeMode', function(req,res){

    if( !checkUser(req,res) )
        return;

    var flyerID = req.body.flyerID;
    var userID = req.user._id;
    var teamID = req.user.teamID;
    var newMode = req.body.mode.toLowerCase();


    // Check for current plan active job limitation
    checkForPublish( teamID, newMode, function(allowed) {
        if(allowed==false)
            return res.send(503,'On Free plan you can have just one active (published) job. ' +
                'Upgrade to Goldberry for having more active job page.');

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

});

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
    canCurrentUserLeaveComment(req.user._id,req.user.teamID,req.params.jobID,
        function(err,can){
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

                                notifyAllForJobComment(req.params.jobID,newComment);
                            });
                    });
            }
        });
});

app.get('/api/job/:jobID/comments', function(req,res) {
    // Get all comments on this job
    canCurrentUserLeaveComment(req.user._id,req.user.teamID,req.params.jobID,function(err,can){
        if(!err && can) {
            BJobComments.find({job: req.params.jobID})
                .populate('user','displayName email')
                .populate('comment','user text')
                .populate('comment.user','displayName email')
                .exec(function(err,comments) {
                    res.send(200,{comments:comments});
                });
        }
    });
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

// endregion
