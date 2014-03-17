/**
 * Created by coybit on 3/16/14.
 */
module.exports.dropboxAuthentication = function (req,res){
    dbclient.authenticate(function(error, client) {
        if (error)
            return res.send(502,{error:error})
        res.send(200, { token: client._oauth._token } )
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
    linkedin_client.apiCall('GET', '/people-search',
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
    );
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

module.exports.showForm = function (req,res){
    res.render('job.ejs');
}

module.exports.uploadResume = function (req,res) {

    console.log(req.files.resume.path)

    var resumeFileName;

    if( req.files.resume.size > 0 )
        resumeFileName = req.files.resume.path.replace(/^.*[\\\/]/, '') + req.files.resume.name;
    else
        resumeFileName = '-';

    var skills = {
        html5: req.body.html5,
        css3: req.body.css3,
        js: req.body.js,
        jquery: req.body.jquery,
        less: req.body.less,
        bootstrap: req.body.bootstrap,
        git: req.body.git,
        nodejs: req.body.nodejs,
        mongodb: req.body.mongodb
    }

    var profiles = {
        github: req.body.ghprofile,
        stackoverflow: req.body.soprofile,
        dribbble: req.body.drprofile,
        behance: req.body.beprofile,
        linkedin: req.body.liprofile,
        twtitter: req.body.twprofile
    }

    // ToDo: Save Form In The Database
    MApplyForm({
        name:req.body.name,
        email:req.body.email,
        applyTime: new Date(),
        skills:JSON.stringify(skills),
        workPlace:req.body.workPlace,
        workTime:req.body.workTime,
        profiles:JSON.stringify(profiles),
        anythingelse:req.body.anythingElse,
        resumePath:resumeFileName
    }).save( function(err) {
            if(err){
                res.send(404,{});
            } else {
                uploadResume();
            }
        });

    var uploadResume = function() {
        if( req.files.resume.size > 0 ) {

            fs.readFile(req.files.resume.path, function (err, data) {

                // ToDo: Choose Unique Name
                dbclient.writeFile(resumeFileName, data, function(error, stat) {
                    if (error) {
                        return showError(error);  // Something went wrong.
                    }

                    console.log("File saved as revision " + stat.revisionTag);
                    fs.unlink( req.files.resume.path );
                    res.send(200,{});
                });
            });
        }
        else {
            res.send(200,{});
        }
    }
};
