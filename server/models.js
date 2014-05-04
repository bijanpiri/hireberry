/**
 * Created by Bijan on 04/29/2014.
 */
mongoose =  require('mongoose');
var mongoHQConenctionString = 'mongodb://admin:admin124578@widmore.mongohq.com:10000/booltindb';
if(process.argv.indexOf('--client')>=0)
    mongoHQConenctionString = 'mongodb://127.0.0.1:27017/booltindb';

var options = {
    server: {
        socketOptions: {
            connectTimeoutMS: 1000000000 ,
            keepAlive: 1 }},
    replset:{
        socketOptions : {
            keepAlive: 1 }}
};

mongoose.connect(mongoHQConenctionString,options);

BUsers = mongoose.model( 'users', {
    email: String,
    displayName: String,
    password: Buffer,    salt: Buffer,
    twittername:String,
    twitterid:String,
    twitterAccessToken:String,
    twitterAccessSecretToken:String,
    facebookName:String,
    facebookid:String,
    facebookAccessToken:String,
    facebookAccessTokenExtra:String,
    googlename:String,
    googleid:String,
    googleAccessToken:String,
    googleAccessSecretToken:String,
    linkedinname:String,
    linkedinid:String,
    linkedinAccessToken:String,
    linkedinAccessSecretToken:String,
    tempToken:String,
    teamID: String
});

BFlyers = mongoose.model( 'flyers', {
    flyer: Object,
    owner: {type : mongoose.Schema.ObjectId, ref : 'teams'},
    creator: {type : mongoose.Schema.ObjectId, ref : 'users'},
    publishTime: String,
    disqusShortname: String,
    dbToken:String,
    autoAssignedTo: {type : mongoose.Schema.ObjectId, ref : 'users'},
    askedForPublish: Boolean
});

BComments = mongoose.model( 'comments', {
    note: String,
    comment: String,
    subjectType: String,
    formID: {type : mongoose.Schema.ObjectId, ref : 'flyers'},
    applicationID: {type : mongoose.Schema.ObjectId, ref : 'applications'},
    commenter: {type : mongoose.Schema.ObjectId, ref : 'users'},
    commentTime: String,
    askingTime: String
})

BTeams = mongoose.model( 'teams', {
    name: String,
    admin: {type : mongoose.Schema.ObjectId, ref : 'users'},
    members: [{type : mongoose.Schema.ObjectId, ref : 'users'}],
    tel:String,
    address:String
})

BEvents = mongoose.model( 'events', {
    title: String,
    contributors: [{type : mongoose.Schema.ObjectId, ref : 'users'}],
    team: {type : mongoose.Schema.ObjectId, ref : 'teams'},
    time: Date
})

BTeamInvitations = mongoose.model( 'invitations', {
    team: {type : mongoose.Schema.ObjectId, ref : 'teams'},
    email: String,
    time: String,
    note:String
})

BApplications = mongoose.model( 'applications', {
    flyerID: {type : mongoose.Schema.ObjectId, ref : 'flyers'},
    name:String,
    email:String,
    tel:String,
    website:String,
    avatarURL: String,
    skills:[],
    applyTime:String,
    workPlace:String,
    workTime:String,
    profiles:String,
    anythingelse:String,
    resumePath:String,
    dbToken:String,
    stage:{},
    activities:[],
    assignedTo: {type : mongoose.Schema.ObjectId, ref : 'users'}
});

BApplicantsResponses = mongoose.model( 'applicantsResponses', {
    applicationID: {type : mongoose.Schema.ObjectId, ref : 'applications'},
    request: {},
    response: {}
});
