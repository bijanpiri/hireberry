/**
 * Created by Bijan on 05/10/2014.
 */


function add2NotificationBadge(x){
    badgeNum += x;
    $('#comments_badge').text(badgeNum);
}

function decreaseBudgeNumber() {
    var num = parseInt( $('#comments_badge').text() );
    $('#comments_badge').text(--num);
}

function initNotificationCenter() {

    $('#askedForCommentList').empty();

    $.get('/api/notifications').done( function(responses) {
        showNewMembers(responses.newMembers);
        add2NotificationBadge(responses.newMembers.length);

        showNewComments(responses.newComments);
        add2NotificationBadge(responses.newComments.length);

        showJobStateChanging(responses.jobStateChanging);
        add2NotificationBadge(responses.jobStateChanging.length);

        showAskedForPublish(responses.askedForPublish);
        add2NotificationBadge( responses.askedForPublish.length);

        showForms(responses.askedForCommentOnForms.forms);
        add2NotificationBadge(responses.askedForCommentOnForms.forms.length);

        showApplications(responses.askedForCommentOnApplication.applications);
        add2NotificationBadge(responses.askedForCommentOnApplication.applications.length);

        showNewResponses(responses.newResponses);
        add2NotificationBadge(responses.newResponses.length);

        showInvitations(responses.teamInvitations);
        add2NotificationBadge(responses.teamInvitations.length);
    });


    function showApplications(A4C_applicatinos) {
        A4C_applicatinos.forEach( function(a4c) {
            var objID = 'askedForComment_'+a4c._id;

            var dateObj = $('<div>')
                .text( 'At ' + (new Date(a4c.askingTime)).toLocaleString() )
                .addClass('comment_date');

            var titleObj = $('<div>')
                .text('You are asked to put your comment about ')
                .append( $('<a>').attr('applicationID',a4c.applicationID._id).text('this application')
                    .click( function() {
                        showApplicationPreview( $(this).attr('applicationID') );
                    }));

            $('#askedForCommentList').append( $('<li>').attr('id',objID)
                .append(dateObj)
                .append(titleObj) );
        });
    }

    function showForms(A4C_forms) {
        A4C_forms.forEach( function(a4c) {
            var objID = 'askedForComment_'+a4c._id;

            var dateObj = $('<div>')
                .text( 'At ' + (new Date(a4c.askingTime)).toLocaleString() )
                .addClass('comment_date');

            var titleObj = $('<div>')
                .text('You are asked to put your comment about ')
                .append( $('<a>').attr('href', '/flyer/embeded/' + a4c.formID._id).text('this form') );


            $('#askedForCommentList').append( $('<li>').attr('id',objID)
                .append(dateObj)
                .append(titleObj));
        });
    }

    function showInvitations(resInvitations) {
        for( var i=0; i<resInvitations.length; i++ ) {

            var teamID = resInvitations[i].team._id;
            var invitationID = resInvitations[i]._id;
            var objID = 'invitation_' + invitationID;

            var dateObj = $('<div>')
                .text( 'At ' + (new Date(resInvitations[i].time)).toLocaleString() )
                .addClass('comment_date');

            var titleObj = $('<div>')
                .text('Invited to ' +  resInvitations[i].team.name);

            var acceptBtnObj = $('<a>').addClass('btn btn-success btn-mini')
                .attr('invitationID',invitationID)
                .text('Accept')
                .click( function() {
                    $.post('/api/user/team/join',{
                        answer:'accept',
                        teamID:teamID,
                        invitationID: $(this).attr('invitationID')
                    }).done( function(res) {
                            alert('You\'ve joint.');
                            decreaseBudgeNumber();
                            $('#'+objID).remove();
                        })
                    decreaseBudgeNumber();
                    $(this).parent().remove();
                });

            var declineBtnObj = $('<a>').addClass('btn btn-danger btn-mini')
                .attr('invitationID',invitationID)
                .text('Decline')
                .click( function() {
                    $.post('/api/user/team/join',{
                        answer:'decline',
                        teamID:teamID,
                        invitationID: $(this).attr('invitationID')
                    }).done( function(res) {
                            $('#'+objID).remove();
                            decreaseBudgeNumber();
                        })
                    decreaseBudgeNumber();
                    $(this).parent().remove();
                });

            $('#askedForCommentList').append( $('<li>').attr('id','#'+objID)
                .append(dateObj)
                .append(titleObj)
                .append(acceptBtnObj)
                .append(declineBtnObj) );
        }
    }

    function showApplicationPreview(applicationID) {
        var prevContainer=
            $('#application-preview-dialog')
                .find('.grid-layout').empty();

        $.get('/api/application/json/' + applicationID).done( function(app) {

            var candidate = app;

            var candidateObj =
                $('#candidateInstance')
                    .clone().show().addClass('candidate')
                    .data('candidate',candidate);

            //if( candidate.currentUser==='denied') {
            candidateObj.find('.candidate-workflow').parent().remove();
            candidateObj.find('.applicationAskForCommentButton').remove();
            candidateObj.find('.bool-application-comments').css('height','auto');
            candidateObj.find('.bool-application-activities').css('height','auto');
            //}

            candidateObj.find('.candidate-avatar').css('background-image','url("'+candidate.avatarURL+'")');
            candidateObj.find('.candidate-name').text(candidate.name);
            candidateObj.find('.candidate-job .value').text(candidate.position);
            candidateObj.find('.candidate-time .value').text(candidate.applyTime);
            candidateObj.find('.candidate-stage .value').text(candidate.stage.stage);
            candidateObj.find('.candidate-skills .value').text(candidate.skills);
            candidateObj.find('.candidate-conditions .value').text(candidate.workTime + ' @' + candidate.workPlace);
            candidateObj.find('.candidate-coverLetter').text(candidate.anythingelse);
            candidateObj.find('.candidate-email .value').text(candidate.email);
            candidateObj.find('.candidate-tel .value').text(candidate.tel);
            candidateObj.find('.candidate-website .value').text(candidate.website);
            candidateObj.find('.candidate-resume').attr('href','/api/resume?f=' + decodeURI(candidate.resumePath) );
            candidateObj.find('[name="appID"]').val(candidate._id);

            candidateObj.find('.candidate-workflow').parent().hide();
            candidateObj.find('.ask-for-comment-form')
                .submit( function() {
                    var form=$(this);
                    $.post('/api/team/application/askForComment',
                            form.serialize())
                        .always(function(){
                            $('.alert').hide();
//                                refresh(true);
                        })
                        .done( function() {
                            form.find('.alert-success').show().delay(2000).fadeOut();
                        })
                        .fail(function(){
                            form.find('.alert-danger').show();
                        });
                    return false;
                });

            for( var j=0; j<candidate.activities.length; j++ ) {
                var activity = candidate.activities[j];
                var mTimestamp = new moment(activity.timestamp);
                var timeObj = $('<div>').addClass('activity-time')
                    .text( mTimestamp.format('YYYY MMM DD') + '-'+ mTimestamp.fromNow() );
                var typeObj = $('<div>').addClass('activity-type').text( activity.type );
                var activityObj = $('<div>').addClass('activity').append(timeObj).append(typeObj);

                candidateObj.find('.candidate-activities').append( activityObj );
            }

            for( var profile in candidate.profiles )
                candidate.profiles[ profile ];

            prevContainer.append( candidateObj )
            candidateObj.find('.bool-toggle-application').click();

        });


        prevContainer.closest('.modal').modal('show');
    }

    function showAskedForPublish(akedForPublishList) {

        for( var i=0; i<akedForPublishList.length; i++ ) {

            var formID = akedForPublishList[i];

            var titleObj = $('<span>')
                .text('You are asked for publish ');

            var linkObj = $('<a>')
                .text('this job')
                .attr('href','/flyer/edit/0?flyerid=' + formID)
                .click( function() {
                    // ToDo: Remove this notification from database
                    // ToDo: Remove element from DOM
                    decreaseBudgeNumber();
                });

            var draftButtonObj = $('<a>')
                .addClass('btn btn-mini btn-warning')
                .text('Draft it')
                .click( function() {
                    $.post('/flyer/changeMode',{
                        mode:'draft',
                        flyerID: $(this).parent().attr('formID')
                    });
                    decreaseBudgeNumber();
                    $(this).parent().remove();
                });

            var publishButtonObj = $('<a>')
                .addClass('btn btn-mini btn-success')
                .text('Publish it')
                .click( function() {
                    $.post('/flyer/changeMode',{
                        mode:'publish',
                        flyerID: $(this).parent().attr('formID')
                    });
                    decreaseBudgeNumber();
                    $(this).parent().remove();
                });

            $('#askedForCommentList').append( $('<li>').attr('formID',formID)
                .append(titleObj)
                .append(linkObj)
                .append('<hr>')
                .append(draftButtonObj)
                .append(publishButtonObj));
        }
    }

    function showNewComments(newComments) {
        newComments.forEach( function(newComment) {
            var objID = newComment._id;

            var titleObj;

            var closeButtonObj = $('<button>')
                .addClass('close')
                .text('×')
                .click(markAsReadCommentHandler);

            if( newComment.applicationID ) {
                titleObj = $('<div>')
                    .text(newComment.commenter.displayName + ' has left a new comment on ')
                    .append( $('<a>').attr('applicationID',newComment.applicationID._id).text('this application')
                        .click( function() {
                            showApplicationPreview( $(this).attr('applicationID') );
                        }));
            }
            else {
                titleObj = $('<div>')
                    .text(newComment.commenter.displayName + ' has left a new comment on ')
                    .append( $('<a>').attr('href','/flyer/embeded/' + newComment.formID._id).text('this form') );
            }

            $('#askedForCommentList').append( $('<li>').attr('commentID',objID)
                .append(closeButtonObj).append(titleObj) );
        });
    }

    function showNewMembers(newMembers) {
        newMembers.forEach( function(newMember) {
            var objID = newMember._id;

            var closeButtonObj = $('<button>')
                .addClass('close')
                .text('×')
                .click(deleteNotificationHandler);

            var titleObj = $('<div>')
                .text('A new member is joined to team')
                .append( $('<a>').attr('href', '#teamp').text('(View team)') );


            $('#askedForCommentList').append( $('<li>').attr('notificationID',objID)
                .append(closeButtonObj).append(titleObj) );
        });
    }

    function showJobStateChanging(jobsChanging) {
        jobsChanging.forEach( function(jobChanging) {
            var objID = jobChanging._id;

            var closeButtonObj = $('<button>')
                .addClass('close')
                .text('×')
                .click(deleteNotificationHandler);

            var titleObj = $('<div>')
                .text('Hiring manager has changed state of a job to ' + jobChanging.more.newState)
                .append( $('<a>').attr('href', '/flyer/embeded/' + jobChanging.more.flyerID).text('(View job)') );

            $('#askedForCommentList').append( $('<li>').attr('notificationID',objID)
                .append(closeButtonObj).append(titleObj) );
        });
    }

    function showNewResponses(responses) {
        responses.forEach( function(response) {
            var objID = response._id;

            var titleObj = $('<div>')
                .text(response.applicationID.name + ' responded: ' + response.response)
                .append( $('<a>').attr('applicationID',response.applicationID._id).text('(See application)')
                    .click( function() {
                        showApplicationPreview( $(this).attr('applicationID') );
                    }));

            var closeButtonObj = $('<button>')
                .addClass('close')
                .text('×')
                .click(markAsReadApplicantResponseHandler);

            $('#askedForCommentList').append( $('<li>').attr('applicantResponseID',objID)
                .append(closeButtonObj).append(titleObj) );
        });
    }
}

function markAsReadApplicantResponseHandler() {
    var notificationID = $(this).parent().attr('applicantResponseID');
    $(this).parent().remove();
    decreaseBudgeNumber();

    $.ajax({
        url: '/applicant/message/notified/' + notificationID,
        type: 'POST',
        success: function(result) {
        }
    });
}

function markAsReadCommentHandler() {
    var comemntID = $(this).parent().attr('commentID');
    $(this).parent().remove();
    decreaseBudgeNumber();

    $.post('/api/comments/mark-as-read',{commentID:comemntID});
}

function deleteNotificationHandler() {
    var notificationID = $(this).parent().attr('notificationID');
    $(this).parent().remove();
    decreaseBudgeNumber();

    $.ajax({
        url: '/api/notifications/' + notificationID,
        type: 'DELETE',
        success: function(result) {
        }
    });
}