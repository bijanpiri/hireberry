/**
 * Created by Bijan on 04/29/2014.
 */

// region Flyers
app.get('/flyer/new',function(req,res){
    res.redirect('/flyer/editor/0');
});

app.get('/flyer/:templateID/json/:id', function(req,res){

    //if(!checkUser(req,res))
    //    return;

    var flyerid = req.params.id;
    var templateID = req.params.templateID;

    if( templateID==0 ) { // Load stored flyer
        BFlyers.findOne({_id:flyerid}, function(err,flyer){
            if(err)
                res.send('Oh oh error');

            if(flyer)
                res.send(flyer.flyer);
            else
                res.send('404, Not Found! Yah!');
        });
    }
    else { // Load a pre-built template

        var templates = require('./../templates.js');

        if( 0 < templateID && templateID < 10)
            res.send( templates.FlyerTemplates[ templateID ] );
        else
            res.send(200)
    }
});

app.get('/flyer/publish/:flyerid', function(req,res){
    var flyerid = req.params.flyerid;

    res.render('flyerPublish.ejs', {
        title:'Publish Flyer',
        flyerid:flyerid
    });
});

app.post('/flyer/publish', function(req,res){

    if( !checkUser(req,res) )
        return;

    var flyer = req.body.flyer;
    var userID = req.user._id;
    var teamID = req.user.teamID;
    var saveAsDraft = Boolean( req.body.saveAsDraft );

    if(saveAsDraft==='true') {
        saveInDatabase({flyer:flyer, askedForPublish:false, publishTime:''}, 'Position is saved as draft.')
    }
    else {
        res.cookie('flyerid','');

        BTeams.count({_id:teamID,admin:userID}, function(err,count) {
            if(count>0) { // User is admin
                saveInDatabase({flyer:flyer, askedForPublish:false, publishTime:new Date()}, 'Position is published.')
            }
            else {
                saveInDatabase({flyer:flyer, askedForPublish:true, publishTime:''}, 'Ask For Pusblish request is sent.');
            }
        });
    }

    function saveInDatabase(param,successMessage) {
        BFlyers.update({_id:flyer.flyerid}, param,{upsert:true}, function(err){
            if(!err){
                res.send(200,{message:successMessage});
            }else
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
        saveInDatabase({askedForPublish:false, publishTime:''})
    }
    else {
        BTeams.count({_id:teamID,admin:userID}, function(err,count) {
            if(count>0 && newMode==='publish') { // User is admin
                saveInDatabase({askedForPublish:false, publishTime:new Date()})
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

app.post('/flyer/inactive', function(req,res){

    var flyerID = req.body.flyerID;

    BFlyers.update( {_id:flyerID}, {$set:{publishTime:''}}, function(err){
        if(!err)
            res.send(200);
    });
});

app.post('/flyer/save', function(req,res){
    var flyer = req.body.flyer;

    BFlyers.update({_id:flyer.flyerid}, {$set:{flyer:flyer}}, function(err){
        if(err) return res.send(401,{});

        res.send(200,{});
    });
});

app.get('/flyer/embeded/:flyerID', function(req,res){

    res.render('flyerEditor.ejs',{
        title:'-',
        flyerid: req.params.flyerID,
        templateID: 0,
        editMode: false,
        viewMode: "embeded",
        existFlyer: true
    });

})

app.get('/flyer/:mode/:tid', function(req,res){

    var flyerid;
    var templateID = req.params.tid;
    var editMode = (req.params.mode || 'view').toLowerCase() !== 'view';
    var existFlyer = false;
    var flyerName = '';

    if( editMode && checkUser(req,res)==false )
        return;

    var renderNewFlyerView = function() {
        res.render('flyerEditor.ejs',{
            title:'Flyer Editor',
            boards:[],
            flyerid:flyerid,
            templateID:templateID,
            editMode: editMode,
            viewMode: "fullpage",
            existFlyer: existFlyer
        });
    }

    var getLastFlyer = function() {

        flyerid = req.query.flyerid;

        if( flyerid ) { // Edit Flyer (FlyerID is passed by Query String)
            if(editMode)
                res.cookie('flyerid',flyerid);
            existFlyer = true;
            renderNewFlyerView();
        }
        else {          // Query String is empty
            flyerid = req.cookies.flyerid;

            if( !flyerid ) {        // Cookie is empty. So make a new flyer

                BFlyers({
                    owner: req.user.teamID,
                    creator: req.user._id
                }).save(function (err,newflyer) {
                    flyerid = newflyer._id;
                    res.cookie('flyerid',flyerid);
                    renderNewFlyerView();
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

// endregion
