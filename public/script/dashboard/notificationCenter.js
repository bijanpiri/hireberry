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

        showNewResponses(responses.newResponses);
        add2NotificationBadge(responses.newResponses.length);

        showInvitations(responses.teamInvitations);
        add2NotificationBadge(responses.teamInvitations.length);

        if(badgeNum==0)
            $('#askedForCommentList').append('<li><div>There is no notification.</div></li>');
    });

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
                    $(this).parent().remove();
                });

            var notifObj = $('<div>').attr('id','#'+objID)
                .append(dateObj)
                .append(titleObj)
                .append(acceptBtnObj)
                .append(declineBtnObj);

            $('#askedForCommentList').append( $('<li>').append(notifObj) );
        }
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

            var notifObj = $('<div>').attr('formID',formID)
                .append(titleObj)
                .append(linkObj)
                .append('<br/>')
                .append(draftButtonObj)
                .append(publishButtonObj);

            $('#askedForCommentList').append( $('<li>').append(notifObj) );
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

            var notifObj = $('<div>').attr('commentID',objID)
                .append(closeButtonObj)
                .append(titleObj);
            $('#askedForCommentList').append( $('<li>').append(notifObj) );
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

            var notifObj = $('<div>').attr('notificationID',objID)
                .append(closeButtonObj)
                .append(titleObj);
            $('#askedForCommentList').append( $('<li>').append(notifObj) );
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

            var notifObj = $('<div>').attr('notificationID',objID)
                .append(closeButtonObj)
                .append(titleObj);
            $('#askedForCommentList').append( $('<li>').append(notifObj) );
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

            var notifObj = $('<div>').attr('applicantResponseID',objID)
                .append(closeButtonObj)
                .append(titleObj);
            $('#askedForCommentList').append( $('<li>').append(notifObj) );
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