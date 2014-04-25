/**
 * Created by coybit on 3/16/14.
 */

var request=require('request');

module.exports.dropboxAuthentication = function (req,res){

    var flyerID = req.query.flyerid;

    dbclient.authenticate(function(error, client) {
        if (error)
            return res.send(502,{error:error})

        BFlyers.update( {_id:flyerID}, {dbToken:client._oauth._token}, function(err){

            if(!err)
                res.send(200, { token: client._oauth._token } )
        });

    });

    /*
     // Once-Time Authentication. See This: http://stackoverflow.com/a/16336113/946835
     dbclient.authDriver(new Dropbox.AuthDriver.NodeServer(8191));

     dbclient.authenticate(function(error, client) {
     if (error) {
     console.log("Some shit happened trying to authenticate with dropbox");
     console.log(error);
     return;
     }


     client.writeFile("test.txt", "sometext", function (error, stat) {
     if (error) {
     console.log(error);
     return;
     }

     console.log("file saved!");
     console.log(stat);
     });
     });
     */
}

module.exports.findLinkedInProfile = function (req,res) {

    //***************************************************************************************
    //Reference code  :  https://github.com/tgig/Node.js-for-Bing-API/blob/master/web.js
    //***************************************************************************************
    var searchTerm = req.params.q.trim().replace(" ","%20")+"%20linkedin";
    var apiKey = 'Vxa0lRW5bpcIJx2yqL5QXC2u+g9wrsBf7kAXc+qIYRY';
    var callURI ='https://api.datamarket.azure.com/Bing/Search/v1/Web?$format=json&Query=%27'+searchTerm+'%27';

    var options = {
        method: 'GET',
        uri: callURI,
        headers: {
            'Authorization': 'Basic ' + new Buffer(apiKey + ':' + apiKey).toString('base64')
        }
    };

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            //return body;
            res.send(200,body);
        }
        else if (error) {
            console.log("error: " + error);
            //return 'error, check console log';
            res.send(500,'error, check console log');
        }
        else {
            console.log("Response code: " + response.statusCode + "\nContent: " + body);
            //return 'error, check console log';
            res.send(500,'error, check console log');
        }
    });

    //CoyBit code
   /*linkedin_client.apiCall('GET', '/people-search',
        {
            token: {
                oauth_token: '3eb3752a-f1c9-4221-9ea3-c555000bf673',
                oauth_token_secret: 'befb401a-4cc7-4b12-ae20-967a4246454f'
            },
            keyword: 'Mohsen%20Alijanpour'
        }
        , function (error, result) {
            res.send(200, {error:error,result:result} );
        }
    );*/
}

module.exports.findGravatarProfile = function (req,res){
    var crypto = require('crypto');
    var email = req.params.email.trim().toLowerCase();
    var md5 = require('crypto').createHash('md5').update(email).digest('hex');
    var path = 'public/gravatar/' + md5;

    var options = {
        host: 'www.gravatar.com',
        port: 80,
        path: '/avatar/' + md5
    }

    var request = http.get(options, function(response){
        var imagedata = ''
        response.setEncoding('binary')

        response.on('data', function(chunk){
            imagedata += chunk
        })

        response.on('end', function(){
            fs.writeFile(path, imagedata, 'binary', function(err){
                if (err)
                    throw err

                res.send(200, { url : '/gravatar/' + md5 } );
            })
        })

    })
}

module.exports.findTwitterProfile = function (req,res){

    try {
        twitter.search({ q : req.params.q },TwitterAccessToken,TwitterAccessTokenSecret, function(err, data, response){
            if(!err)
                res.send(data);
            else
                res.send({});
        });
    }
    catch(e) {
        res.send({})
    }
}

module.exports.apply = function (req,res) {

    var resumeFileName;

    if(  req.files.resume && req.files.resume.size > 0 )
        resumeFileName = req.files.resume.path.replace(/^.*[\\\/]/, '') + req.files.resume.name;
    else
        resumeFileName = '-';

    var skills = req.body.skill;

    var profiles = {
        github: req.body.ghprofile,
        stackoverflow: req.body.soprofile,
        dribbble: req.body.drprofile,
        behance: req.body.beprofile,
        linkedin: req.body.liprofile,
        twtitter: req.body.twprofile
    }

    // ToDo: Save Form In The Database
    BApplications({
        flyerID: req.body.flyerid,
        name:req.body.name,
        email:req.body.email,
        tel:req.body.tel,
        website:req.body.website,
        applyTime: new Date(),
        skills:JSON.stringify(skills),
        workPlace:req.body.workPlace,
        workTime:req.body.workTime,
        profiles:JSON.stringify(profiles),
        anythingelse:req.body.anythingElse,
        resumePath:resumeFileName,
        activities:[{type:'NEW',timestamp:new Date()}]
    }).save( function(err, application) {
            if(err){
                res.send(404,{});
            } else {
                uploadResume( application._id );
            }
        });

    var uploadResume = function( applicationID ) {
        if( req.files.resume && req.files.resume.size > 0 ) {

            // Read from temp file
            fs.readFile(req.files.resume.path, function (err, data) {

                // Find dropbox token
                BFlyers.findOne( {_id:req.body.flyerid}, function(err,flyer) {
                    saveOnDropbox( flyer.dbToken, data, resumeFileName, applicationID );
                })
            });
        }
        else {
            res.send(200,{});
        }
    }

    var saveOnDropbox = function( dbToken, data, resumeFileName, applicationID ) {

        var dbclient = new Dropbox.Client({
            key: "7bdvs2t8zrdqdw8",
            secret: "5y37uqs64t0f3gc",
            sandbox     : false,
            token       : dbToken,
            tokenSecret : '5y37uqs64t0f3gc'
        });

        // ToDo: Choose Unique Name
        dbclient.writeFile(resumeFileName, data, function(error, stat) {
            if (error) {
                return showError(error);  // Something went wrong.
            }

            fs.unlink( req.files.resume.path );

            // Create Share Link
            dbclient.makeUrl(resumeFileName,{}, function(err,data) {

                if( !err )
                    MApplyForm.update({_id:applicationID},{resumePath:data.url}, function() {
                        res.send(200,{});
                    });
                else
                    res.send(200,{});

            })

        });

    }
};
