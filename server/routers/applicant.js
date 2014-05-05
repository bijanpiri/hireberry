/**
 * Created by coybit on 5/4/14.
 */

// Show message to applicant
app.get('/applicant/message/view/:messageType/:messageID', function (req,res){
    res.render('applicant.ejs',{
        messageType: req.params.messageType,
        messageID: req.params.messageID
    });
});

// Save response of applicant
app.post('/applicant/message/:messageType/:messageID', function (req,res){

    var messageID = req.params.messageID;
    var messageType = req.params.messageType.toLowerCase();
    var response = req.body.response;

    BApplicantsResponses.update({_id:messageID},{response:response}, function(err){

        // Move application to next stage (response is received)
        BApplicantsResponses.findOne({_id:messageID}).populate('applicationID').exec( function(err,message){

            var newStage = {};

            if( messageType==='1' ) { // Interview invitation
                    newStage = ( response==="YES") ? {stage:2,subStage:3} : {stage:2,subStage:2}

                if( response==="YES" ){
                    addEvent('Interview with ' + message.applicationID.stage.invitedName,
                        message.applicationID.stage.interviewDate,
                        message.applicationID.stage.interviewer,
                        message.applicationID.stage.interviewTeam, function() {})

                    // ToDo: Notify responder & HM
                }
            }
            else if(messageType==='2' ) { // Job offer
                newStage = ( response==="YES") ? {stage:3,subStage:2} : {stage:3,subStage:3}

                if( response==="YES" ){
                    // ToDo: Notify responder & HM
                }
            }

            BApplications.findOne( {_id:message.applicationID}, function(err,application){

                newStage.interviewDate = application.stage.interviewDate;

                BApplications.update( {_id:message.applicationID}, {stage:newStage}, function(err){
                    res.send(200);
                })

            })

        })

    })

});

// Get response of applicant
app.get('/applicant/message/:messageID', function (req,res){

    var messageID = req.params.messageID;

    BApplicantsResponses.find({_id:messageID}, function(err,message){
        res.send(200,message.response);
    })
});