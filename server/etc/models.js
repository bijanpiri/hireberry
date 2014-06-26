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

BPersistLogin= mongoose.model( 'persistentLogins', {
    username: String,
    expireDate:String,
    lastRequestDate:String,
    token:Buffer
});

BUsers = mongoose.model( 'users', {
    email: String,
    displayName: String,
    password: Buffer,
    salt: Buffer,
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
    dbToken:String,
    autoAssignedTo: {type : mongoose.Schema.ObjectId, ref : 'users'},
    askedForPublish: Boolean,
    mandrillRouterID: String,
    commentators: [{type : mongoose.Schema.ObjectId, ref : 'users'}]
});

BTeams = mongoose.model( 'teams', {
    name: String,
    admin: {type : mongoose.Schema.ObjectId, ref : 'users'},
    members: [{type : mongoose.Schema.ObjectId, ref : 'users'}],
    tel:String,
    address:String,
    plan: Number,
    planLastRenewDate: Date,
    HiringManagerNotified: Boolean
});

BEvents = mongoose.model( 'events', {
    title: String,
    contributors: [{type : mongoose.Schema.ObjectId, ref : 'users'}],
    team: {type : mongoose.Schema.ObjectId, ref : 'teams'},
    time: Date
});

BTeamInvitations = mongoose.model( 'invitations', {
    team: {type : mongoose.Schema.ObjectId, ref : 'teams'},
    email: String,
    time: String,
    note:String
});

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
    assignedTo: {type : mongoose.Schema.ObjectId, ref : 'users'},
    visited: Boolean,
    note:String
});

BTransactions = mongoose.model( 'transactions', {
    teamID: {type : mongoose.Schema.ObjectId, ref : 'teams'},
    paymentTime: Date,
    amount: String,
    state: String,
    PAYToken: String,
    ECToken: String,
    payer: {},
    method: String
});

BApplicantsResponses = mongoose.model( 'applicantsResponses', {
    applicationID: {type : mongoose.Schema.ObjectId, ref : 'applications'},
    text: String,
    responderNotified: Boolean,
    request: {},
    response: {}
});

BVisitStat = mongoose.model( 'visitStat', {
    flyerID: {type : mongoose.Schema.ObjectId, ref : 'flyers'},
    visitTime: Date,
    referer: String,
    visitedUrl: String,
    visitorIP: String
});

BNotifications = mongoose.model( 'notifications', {
    time: Date,
    type: String,
    notified: Boolean,
    more: {}
});

BAppliedByEmail = mongoose.model( 'appliedByEmail', {
    teamID: {type : mongoose.Schema.ObjectId, ref : 'teams'},
    name: String,
    from: String,
    subject: String,
    text: String,
    resume: String
});


function BNotificationSchema() {
    mongoose.Schema.apply(this, arguments);

    this.add({
        time: Date,
        visited: Boolean,
        comment:{type:mongoose.Schema.ObjectId,ref:'comments'},
        user:{type:mongoose.Schema.ObjectId,ref:'users'},
        editor:{type:mongoose.Schema.ObjectId,ref:'users'}
    });
}
util.inherits(BNotificationSchema, mongoose.Schema);

var BJobNotificationSchema =
    new BNotificationSchema(
    {job:{type:mongoose.Schema.ObjectId,ref:'flyers'}});

var BAppNotificationSchema =
    new BNotificationSchema(
    {app:{type:mongoose.Schema.ObjectId,ref:'applications'}});

BNotification=mongoose.model('notifs',new BNotificationSchema());

BJobNotification=BNotification.discriminator('job',BJobNotificationSchema);
BAppNotification=BNotification.discriminator('app',BAppNotificationSchema);


BPromoCode = mongoose.model( 'promoCodes', {
    code: String,
    credit: Number,
    amount: Number,
    permissionForRegister: Boolean
});

function BCommentSchema(){
    mongoose.Schema.apply(this,arguments);
    this.add({
        user: {type : mongoose.Schema.ObjectId, ref : 'users'},
        text: String,
        date: Date,
        team: {type : mongoose.Schema.ObjectId, ref : 'teams'}
    });
}
util.inherits(BCommentSchema, mongoose.Schema);
var BJobCommentsSchema=new BCommentSchema({job: {type : mongoose.Schema.ObjectId, ref : 'flyers'}})
var BAppCommentsSchema=new BCommentSchema({app: {type : mongoose.Schema.ObjectId, ref : 'applications'}});

BComments=mongoose.model('comments',new BCommentSchema());

BJobComments=BComments.discriminator('job',BJobCommentsSchema);
BAppComments=BComments.discriminator('app',BAppCommentsSchema);

