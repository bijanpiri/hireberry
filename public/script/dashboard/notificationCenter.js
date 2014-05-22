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
    $.get('/api/user/application/askedForComment').done( function(resApp) {
        var apps = resApp.applications;
        if(apps) {
            showApplications(apps);
            add2NotificationBadge(apps.length);
        }

    });

    $.get('/api/user/form/askedForComment').done( function(resForm) {
        var forms = resForm.forms;
        if(forms) {
            showForms(forms);
            add2NotificationBadge(forms.length);
        }
    });

    $.get('/api/user/invitations').done( function(resInvitations) {
        if( resInvitations ){
            showInvitations(resInvitations);
            add2NotificationBadge(resInvitations.length);
        }
    });

    $.get('/api/user/form/askedForPublish').done( function(askedForPublish) {
        var forms = askedForPublish;
        if( forms ){
            showAskedForPublish(forms);
            add2NotificationBadge( forms.length);
        }
    });

    $.get('/api/comments/news').done( function(resApp) {
        var comments = resApp.comments;
        showNewComments(comments);
        add2NotificationBadge(comments.length);
    });

    $.get('/api/applicant/responds').done( function(responses) {
        showNewResponses(responses);
        add2NotificationBadge(responses.length);
    });

    $.get('/api/notifications').done( function(responses) {
        showNewMembers(responses.newMembers);
        add2NotificationBadge(responses.newMembers.length);

        showNewComments(responses.newComments);
        add2NotificationBadge(responses.newComments.length);
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

    function showNewComments(newComments) {
        newComments.forEach( function(comment) {

            var dateObj = $('<div>')
                .text( 'At ' + (new Date(comment.askingTime)).toLocaleString() )
                .addClass('comment_date');

            var linkObj = '';

            if( comment.applicationID ) {
                linkObj = $('<a>').attr('applicationID', comment.applicationID._id).text('this application')
                    .click( function() {
                        showApplicationPreview( $(this).attr('applicationID') );
                    })
            }
            else {
                linkObj = $('<a>').attr('href', '/flyer/embeded/' + comment.formID._id).text('this form');
            }

            var titleObj = $('<div>')
                .text( comment.commenter.displayName + ' is left a new comment on ')
                .append( linkObj );

            var notificationObj = $('<li>').attr('id','')
                .append(dateObj)
                .append(titleObj);

            linkObj.click( function() {
                // ToDo: Mark As Read
                $.post('/api/comments/mark-as-read',{commentID:comment._id});
                notificationObj.remove();
                decreaseBudgeNumber();
            })

            $('#askedForCommentList').append(notificationObj);
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

            var titleObj = $('<div>')
                .text('You are aksed for publish a form');
            var actionObj = $('<a>')
                .text('Revise it')
                .attr('href','/' + formID)
                .click( function() {
                    // ToDo: Remove this notification from database
                    // ToDo: Remove element from DOM
                    decreaseBudgeNumber();
                });

            $('#askedForCommentList').append( $('<li>').append(titleObj).append(actionObj) );
        }
    }

    function showNewComments(newComments) {
        newComments.forEach( function(newComment) {
            var objID = 'newMember'+newComment._id;

            var titleObj = $('<div>')
                .text(newComment.commenter.displayName + ' has left a new comment on ')
                .append( $('<a>').attr('applicationID',newComment.applicationID).text('this application')
                    .click( function() {
                        showApplicationPreview( $(this).attr('applicationID') );
                    }));

            $('#askedForCommentList').append( $('<li>').attr('id',objID)
                .append(titleObj) );
        });
    }

    function showNewMembers(newMembers) {
        newMembers.forEach( function(newMember) {
            var objID = 'newMember'+newMember._id;

            var titleObj = $('<div>')
                .text('A new member is joined to team')
                .append( $('<a>').attr('href', '#teamp').text('(View team)') );

            $('#askedForCommentList').append( $('<li>').attr('id',objID)
                .append(titleObj) );
        });
    }

    function showNewResponses(responses) {
        responses.forEach( function(response) {
            var objID = 'response'+response._id;

            var titleObj = $('<div>')
                .text(response.applicationID.name + ' responded: ' + response.response)
                .append( $('<a>').attr('applicationID',response.applicationID._id).text('(See application)')
                    .click( function() {
                        showApplicationPreview( $(this).attr('applicationID') );
                    }));

            $('#askedForCommentList').append( $('<li>').attr('id',objID)
                .append(titleObj) );
        });
    }
}
