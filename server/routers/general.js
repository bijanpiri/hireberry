/**
 * Created by Bijan on 04/29/2014.
 */

// region General
app.get('/', function(req,res) {
    if( req.user )
        res.redirect('/dashboard');
    else
        res.redirect('/login');
});
// endregion

// region Setting
app.get('/setting', function(req,res){

    if( !checkUser(req,res))
        return;

    res.render('setting.ejs',{title:'Setting'});
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

    BUsers.update( { _id: userID },
        { displayName: displayName, email: email }, function (err) {
            if (err)
                res.send(401,{});
            else
                res.send(200,{});
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
app.post('/event', function(req,res) {

    var time = new Date(req.body.time);
    var title = req.body.title;
    var teamID = req.user.teamID;
    var contributor = [req.user._id];

    addEvent( title, time, contributor,  teamID, function() {
            res.send(200);
        }
    )
});

app.get('/event', function(req,res) {

    var time = new Date(req.body.time);
    var title = req.body.title;
    var teamID = req.user.teamID;
    var userID = req.user._id;

    BTeams.count({ _id:teamID, admin:userID }, function(err,count){
        if( err || count==0)
            BEvents.find( { contributors:userID }, function(err,events) {
                res.send(200,events);
            })
        else
            BEvents.find( {team:teamID}, function(err,events) {
                res.send(200,events);
            })
    });
});
// endregion