/**
 * Created by Bijan on 04/29/2014.
 */
crypto = require('crypto');
everyauth = require('everyauth');
twitterAPI = require('node-twitter-api');
linkedin_client = require('linkedin-js')('75ybminxyl9mnq', 'KsgqEUNsLSXMAKg6', 'callbackURL')

everyauth.debug = true;

//region Initialization
var LINKEDIN_CONSUMER_KEY = "77pqtwladavveq";
var LINKEDIN_CONSUMER_SECRET = "OtnTkyKjGB6gY2J5";
var TWITTER_CONSUMER_KEY = "IrzgMx7fEYybvrN25eiv1w";
var TWITTER_CONSUMER_SECRET = "gE9FopMHdlSnTunNlAqvKv6ZwQ8QkEo3gsrjGyenr0";
var GOOGLE_CLIENT_ID = '892388590141-l0qsh6reni9i0k3007dl7q4340l7nkos.apps.googleusercontent.com';
var GOOGLE_CLIENT_SECRET = 'YzysmahL5LX4GLIydqBXN1zz';
var Facebook_AppID='241341676042668';
var Facebook_AppSecret='2e748d80c87a8594e792eeb482f7c87d';


var keySize=512;
var hashIteration=1;


TwitterAccessToken = '267915249-EKZZ2KneSOf06oIOMXFKWoSEsXQTg3EwjH4Z4dU1';
TwitterAccessTokenSecret = 'ReF8CIy5IdFCmasTlKaayYAoSEIzYL4b4VLcp8IwBLVMD';
twitter = new twitterAPI({
    consumerKey: 'Lw7YsCYUV2Dv9yYViTvPQ',
    consumerSecret: '1MUO7r44h230yRcASFNzSVlBlssvSSEqnarWpztbfw',
    callback: 'http://localhost:5000/'
});


//region Configure every modules in everyauth
everyauth.everymodule
    .findUserById( function (id, callback) {
        BUsers.findOne({_id:id}, function(err,user) {
            callback(null, user);
        });
    });
//endregion

//region LinkedIn Authentication Configuration
everyauth.linkedin
    .consumerKey(LINKEDIN_CONSUMER_KEY)
    .consumerSecret(LINKEDIN_CONSUMER_SECRET)
    .moduleTimeout(60000)
    .fetchOAuthUser(function (accessToken, accessTokenSecret, params) { // This method is override because we need to get extra info from user profile
        var promise = this.Promise();
        this.oauth.get(this.apiHost() + '/people/~:(id,first-name,last-name,emailAddress,headline,location:(name,country:(code)),industry,num-connections,num-connections-capped,summary,specialties,proposal-comments,associations,honors,interests,positions,publications,patents,languages,skills,certifications,educations,three-current-positions,three-past-positions,num-recommenders,recommendations-received,phone-numbers,im-accounts,twitter-accounts,date-of-birth,main-address,member-url-resources,picture-url,site-standard-profile-request:(url),api-standard-profile-request:(url,headers),public-profile-url)', accessToken, accessTokenSecret, function (err, data, res) {
            if (err) {
                err.extra = {data: data, res: res}
                return promise.fail(err);
            }
            var oauthUser = JSON.parse(data);
            promise.fulfill(oauthUser);
        });
        return promise;
    })
    .findOrCreateUser( function (session, accessToken, accessTokenSecret, linkedinUserMetadata) {
        // find or create user logic goes here
        var promise = this.Promise();

        BUsers.findOne({linkedinid:linkedinUserMetadata.id}, function(err,user){

            if(err)
                return promise.fail([err]);

            if(!user){
                console.log("User Not Exist ... Creating ");
                var newUser = BUsers({
                    email: linkedinUserMetadata.emailAddress,
                    displayName: linkedinUserMetadata.firstName + ' ' + linkedinUserMetadata.lastName,
                    linkedinname:linkedinUserMetadata.lastName,
                    linkedinid:linkedinUserMetadata.id,
                    linkedinAccessToken:accessToken,
                    linkedinAccessSecretToken:accessTokenSecret
                });
                newUser.save(function(err){
                    if(err)
                        promise.fail([err]);
                    else
                        gettingReady( newUser._id, function() {
                            promise.fulfill(newUser);
                        });

                });
            } else {
                promise.fulfill(user);
            }
        });

        return promise;
    })
    .redirectPath('/');
//endregion

//region Local Username/Password Registration and Authentication Configuration
everyauth.password
    .loginWith('email')
    .getLoginPath('/login')
    .postLoginPath('/login')
    .loginView('login.ejs')
    .loginLocals( function (req, res, done) {
        setTimeout( function () {
            done(null, {
                title: 'Login'
            });
        }, 200);
    })
    .respondToLoginSucceed( function (res, user) {
        if (user)
            res.json({
                success: true,
                lastPage: '/profile.ejs'//(req.session.lastPage || '/profile.ejs')
            }, 200);
        else
            res.json({ success: false }, 501);
    })
    .respondToLoginFail( function (req, res, errors, login) {
        if (errors && errors.length)
            res.json({ success: false, errors: errors });
    })
    .authenticate( function (login, password) {
        var errors = [];
        if (!login)
            errors.push('Missing login');
        if (!password)
            errors.push('Missing password');
        if (errors.length)
            return errors;

        var promise = this.Promise();
        BUsers.findOne({ email: login}, function (err, user) {
            if (err)
                return promise.fulfill([err]);

            console.log(user);

            if (!user)
                return promise.fulfill(['invalid user']);
            if(!user.password || !user.salt)
                return promise.fulfill(['Server authentication error.']);

            crypto.pbkdf2( password, user.salt, hashIteration, keySize,
                function(err, dk) {
                    var eq=true;
                    var key=user.password;
                    for(var i=0;i<keySize;i++) eq &= key[i] == dk[i];
                    if(!eq)
                        promise.fulfill(['Invalid password']);
                    else
                        promise.fulfill(user);

                }
            );

//            if (user.password !== password)
//                return promise.fulfill(['Login failed']);
        });
        return promise;
    })
    .loginSuccessRedirect('/')
    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('register.ejs')
    .registerLocals( function (req, res, done) {
        setTimeout( function () {
            done(null, {
                title: 'Register'
            });
        }, 200);
    })
    .validateRegistration( function (newUserAttributes) {
        return null;
    })
    .registerUser( function (newUserAttributes) {
        var promise = this.Promise(),
            password=newUserAttributes.password;

        delete newUserAttributes[password]; // Don't store password
//        newUserAttributes.salt = bcrypt.genSaltSync(10);
//        newUserAttributes.hash = bcrypt.hashSync(password, newUserAttributes.salt);
//

        BUsers.count({email:newUserAttributes.email}, function(err,count){
            if(count>0)
                return promise.fail(['This email address has already registered']);
            else{
                var salt = crypto.randomBytes(128).toString('base64');

                crypto.pbkdf2( password, salt, hashIteration, keySize,
                    function(err, dk) {
                        BUsers(
                            {
                                email: newUserAttributes.email,
                                displayName: newUserAttributes.email.split('@')[0],
                                password: dk,
                                salt:salt
                            }).save(function(err,user){
                                gettingReady( user._id, function() {
                                    promise.fulfill(user);
                                });
                            });
                    }
                );


            }
        });

        return promise;
    })
    .registerSuccessRedirect('/');
//endregion

