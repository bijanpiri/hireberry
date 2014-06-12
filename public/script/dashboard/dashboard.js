/**
 * Created by Bijan on 05/10/2014.
 */
teamID = '<%=teamID%>';
userID = '<%=userID%>';
teamMembers = [];
userAdmin = null;
forms = [];
badgeNum=0;
var stagesName = ['pending', 'interviewing', 'offering', 'archived'];
var subStagesName =[
    [''],
    ['wait for response', 'declined', 'accepted', 'interviewed'],
    ['wait for response', 'accepted', 'declined'],
    ['']
]
_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g,
    escape: /\{\{\-(.+?)\}\}/g,
    evaluate: /\{\%(.+?)\%\}/g
};

$(function(){

    initOverviewPage();
    initTeamPage();
    initApplicationPage();
    initBillingPage();

    $('button[data-loading-text]').click(function(){
        var btn=$(this);
        btn.button('loading');
        setTimeout(function(){
            btn.button('reset');
        },3000);
    });

    // Initializing modals
    $('#applicationPreview').dialog({
        resizable: false,
        autoOpen: false,
        modal: true,
        title: "Application Preview",
        width: 400,
        height: 400
    });

    $('.menu .item').click( function(e) {
        return;

        var sectionContainerClass = '.' + $(e.target).attr('forContainer');
        $('.sectionContainer').hide();
        $(sectionContainerClass).show();
        $('.menu .item').removeClass('item-selected');
        $(e.target).addClass('item-selected');
    })


    $(document).delegate('.bool-edit-switch a','click', function() {

        var operation = $(this).attr('op');
        var editableObjClassName = $(this).parent().attr('edit-switch-of');
        var editableObj = $(this).closest( '.' + editableObjClassName ).find('.value');

        switch (operation) {
            case 'edit':
                editableObj.attr('last-value',editableObj.text());
                editableObj.attr('contenteditable','true');
                editableObj.focus();
                break;
            case 'yes':
                editableObj.attr('contenteditable','false');
                saveModifiedApplication( editableObj.closest('.candidate') );
                break;
            case 'no':
                editableObj.text(editableObj.attr('last-value'));
                editableObj.attr('contenteditable','false');
                break;
        }


        function saveModifiedApplication(candidateObj) {
            $.post('/api/applications/' + candidateObj.data('candidate')._id , {
                name: candidateObj.find('.candidate-name .value').text(),
                email: candidateObj.find('.candidate-email .value').text(),
                tel: candidateObj.find('.candidate-tel .value').text(),
                website: candidateObj.find('.candidate-website .value').text(),
                note: candidateObj.find('.candidate-note .value').html()
            }).done( function() {
                    refresh();
                });
        }
    });


    refresh();
});

function refresh() {
    badgeNum = 0;

    initNotificationCenter();

    stat.fetch();
    calendar.fetch();
    teams.fetch();
    team.fetch();
    applications.fetch()
    jobs.fetch();
    billing.fetch()
}

function initOverviewPage() {
    //$('#full-clndr').clndr({template: $('#full-clndr-template').html()});

    $('#applications-filters [name=application-filter]').on('change', function(e,i) {
        var filterClass =  $(e.target).attr('filter-class');

        if( filterClass ) {
            $('#candidatesCollection .candidate').hide();
            $('#candidatesCollection .' + filterClass ).show();
        } else {
            $('#candidatesCollection .candidate').show();
        }
    });

    $(document).delegate('.bool-toggle-application','click',function() {
        var candidateSection = $(this).closest('.candidate');
        var candidate = candidateSection.data('candidate')

        var candidateID = $(this).closest('.candidate').data('candidate')._id;
        showApplicationPreview( candidateID );
    });
}

function mouseEnterEvent(date) {
    $('.calendar-day-' + date).addClass('active-event');
}

function mouseLeaveEvent(date) {
    $('.calendar-day-' + date).removeClass('active-event');
}

function initTeamPage() {
    teamSettings();
    teamInvitation();

    // Switch Button
    $('#switchButton').unbind('click').click( function() {
        $('#switchTeamEdit').show();
        $('#switchTeamView').hide();
    });

    // Cancel Button
    $('#cancelChangeUserTeam').unbind('click').click( function() {
        $('#switchTeamView').show();
        $('#switchTeamEdit').hide();
    });

    // OK Button
    $('#changeUserTeam').unbind('click').click( function() {
        var teamID = $('#userTeams :selected').attr('name');

        $.post('/api/user/changeTeam', {teamID:teamID}).done( function() {

            refresh();

            $('#switchTeamView').show();
            $('#switchTeamEdit').hide();
        })
    })

    function teamInvitation(){
        $('#teamInvitationForm').submit(function(){
            var form=$(this);
            form.find('.alert-info').show();
            $.post('/api/team/invite',form.serialize())
                .always(function(){
                    $('.alert').hide();
                    $('#team-invitation-dialog').modal('hide');
                    refresh(true);
                })
                .done( function() {
                    form.find('.alert-success').show().delay(2000).fadeOut();
                    $('#invitationEmail').val('');
                    $('#invitationNote').val('');
                    getTeamInfo();
                })
                .fail(function(){
                    form.find('.alert-danger').show();
                });
            return false;

        })
    }

    function teamSettings(){
        $('#teamSettingForm').submit(function(event){
            var form=$(this);
            form.find('.alert-info').show();
            $.post('/api/team/settings',
                    form.serialize())
                .always(function(data){
                    $('.alert').hide();
                    $('#team-settings-dialog').modal('hide');
                    refresh(true);
                })
                .fail(function(data){
                    form.find('.alert-danger').show();
                })
                .done(function(data){
                    form.find('.alert-success').show().delay(2000).fadeOut();
                });
            event.preventDefault();
            return false;
        });
    }
}

function initBillingPage() {
    $('#payButton').click( function() {
        var amount = $('#paymentAmount :selected').attr('name')
        document.location =  '/pay?amount=' + amount;
    })

    $('#premiumPlanButton').click( function() {
        $.get('/api/plan/change',{new_plan:1}).done(refresh);
    });

    $('#freePlanButton').click( function() {
        $.get('/api/plan/change',{new_plan:0}).done(refresh);
    });
}

function initApplicationPage() {

    // Search Box
    $('.application-searchBox').unbind('keydown').keydown( function(e) {
        if(e.keyCode==13)
            $('.application-searchButton').click()
    });


    $('.applications-filter-job').unbind('change').change( function() {
        applications.fetch();
    });

    $('.application-searchButton').unbind('click').click( function() {
        applications.fetch();
    });

    // Sorting
    $('.application-sort .sortByDate').unbind('click').click( function() {
        $('.application-sort').attr('sortBy','date');
        $('.application-sortType').text('Date');
        applications.fetch();
    });
    $('.application-sort .sortByName').unbind('click').click( function() {
        $('.application-sort').attr('sortBy','name');
        $('.application-sortType').text('Name');
        applications.fetch();
    });


    // Go to Grid-mode layout
    $('#candidatesGridButton').unbind('click').click( function() {

        $('#candidatesCollection').animate({'opacity':0},300, function() {

            $('#candidatesCollection')
                .removeClass('list-layout')
                .addClass('grid-layout')
                .animate({'opacity':1},300);

        });
    });

    // Go to List-mode layout
    $('#candidatesListButton').unbind('click').click( function() {

        $('#candidatesCollection.grid-layout').animate({'opacity':0},300, function() {

            $('#candidatesCollection')
                .removeClass('grid-layout')
                .addClass('list-layout')
                .animate({'opacity':1},300);

        });
    });

    $('.ask-for-comment-form')
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
}

function initWorkflow(candidateObj,candidate) {

    candidateObj.find('.archiveButton').click( function(e) {
        e.stopPropagation();
        gotoNewStage(4,1);
    });

    candidateObj.find('.interviewButton').click( function(e) {
        e.stopPropagation();

        // Prepare interview invitation modal and show it
        var modal = $('#interview-invitation-dialog');
        modal.find('.emailAddress').val( candidate.email || '' );
        modal.find('.sendButton').unbind('click').click( function() {
            gotoNewStage(2,1,{
                invitedName: candidate.name,
                invitedEmail: modal.find('.emailAddress').val(),
                invitationMessage: modal.find('.invitationMessage').val(),
                interviewDate: modal.find('.interviewDate').val() + ' ' + modal.find('.interviewTime').val()
            });
            modal.modal('hide')
        });
        modal.modal();
    });

    candidateObj.find('.offerButton').click( function(e) {
        e.stopPropagation();

        // Prepare job offer modal and show it
        var modal = $('#job-offer-dialog');
        modal.find('.emailAddress').val( candidate.email || '' );
        modal.find('.sendButton').unbind('click').click( function() {
            gotoNewStage(3,1,{
                offeredEmail: modal.find('.emailAddress').val(),
                offerMessage:  modal.find('.offerMessage').val(),
                offeredName: candidate.name
            });
            modal.modal('hide')
        });
        modal.modal();
    });

    candidateObj.find('.askForCommentButton').click( function(e) {
        e.stopPropagation();

        // ToDo: Connect to real ask for comment function
        alert('A4C');
    });


    function gotoNewStage(newStage,newSubStage,moreData) {
        var data = { stage:newStage ,subStage:newSubStage };

        for( var key in moreData )
            data[key] = moreData[key];

        $.post( '/api/applications/' + candidate._id, {
            activity:0,
            data:data
        }).done( function(res) {
                changeWorkflowStage(candidateObj,candidate,newStage,newSubStage);
            });
    }
}

function changeWorkflowStage(candidateObj,candidate,stageNo,subStageNo) {

    stageNo--; // Convert to zero-base index
    subStageNo = subStageNo || 1;

    // Hide all
    candidateObj.find('.candidate-workflow-substage').hide();

    // Show selected stage
    var cssSelector = '.candidate-workflow-stage.' + stagesName[stageNo] + ' .candidate-workflow-substage[sub-stage=' + subStageNo + ']';
    candidateObj.find(cssSelector).show();

    if( stageNo==1 )
        candidateObj.find('.candidate-workflow-stage.' + stagesName[1] +' .interviewDate').text( candidate.stage.interviewDate );
}

function showApplicationPreview(applicationID) {
    var prevContainer = $('#application-preview-dialog')
        .find('.application-preview-container')
        .empty();

    $.get('/api/application/json/' + applicationID).done( function(app) {

        var candidate = app;

        var candidateObj =
            $('#candidateInstance')
                .clone().show().addClass('candidate candidate-expanded')
                .data('candidate',candidate);

        if( candidate.currentUser==='denied') {
            candidateObj.find('.candidate-workflow').parent().remove();
            candidateObj.find('.applicationAskForCommentButton').remove();
            candidateObj.find('.bool-application-comments').css('height','auto');
            candidateObj.find('.bool-application-activities').css('height','auto');
        }

        candidateObj.find('.candidate-avatar').css('background-image','url("'+candidate.avatarURL+'")');
        candidateObj.find('.candidate-name .value').text(candidate.name);
        candidateObj.find('.candidate-job .value').text(candidate.position);
        candidateObj.find('.candidate-time .value').text( new Date(candidate.applyTime).toLocaleString() );
        candidateObj.find('.candidate-stage .value').text(candidate.stage.stage);
        candidateObj.find('.candidate-skills .value').text(candidate.skills);
        candidateObj.find('.candidate-conditions .value').text( (candidate.workTime||'') + (candidate.workPlace?' @' + candidate.workPlace:'') );
        candidateObj.find('.candidate-coverLetter').text(candidate.anythingelse);
        candidateObj.find('.candidate-email .value').text(candidate.email);
        candidateObj.find('.candidate-tel .value').text(candidate.tel);
        candidateObj.find('.candidate-website .value').text(candidate.website);
        candidateObj.find('.candidate-note .value').html(candidate.note);
        candidateObj.find('[name="appID"]').val(candidate._id);

        if( candidate.resumePath!=='-' )
            candidateObj.find('.candidate-resume').attr('href', '/api/resume?f=' + decodeURI(candidate.resumePath) );
        else
            candidateObj.find('.candidate-resume a').hide();

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

        $.get('/api/application/comments',{appID:candidate._id},function(data){
            var comments=data.comments;

            candidateObj.find('.candidate-comments').empty();

            comments.forEach(function(comment){
                var form=$('.reply-for-comment-form:first').clone().show();

                candidateObj.find('.candidate-comments').append(form);
                form.find('[name=commentID]').val(comment._id);
                form.find('.user-note-avatar')
                    .replaceWith(generateMemberElement(comment.user,true,false));
                form.find('.commenter-note-avatar')
                    .replaceWith(generateMemberElement(comment.commenter,true,false,true))
                form.find('.bool-application-comments-note').html(comment.note);
                var commentBox = form.find('.bool-application-comments-comment');
                var replyBtn=form.find('[type=submit]');
                commentBox.html(comment.comment);
                var editBtn = form.find('.bool-edit-comment-btn').hide();
                var cancleBtn = form.find('.bool-cancel-comment-btn').hide();
                if(comment.comment || data.user!==comment.commenter._id) {
                    commentBox
                        .attr('readonly', 'readonly')
                        .attr('placeholder', 'No comment left');
                    replyBtn.hide();
                    if(data.user===comment.commenter._id)
                        editBtn.show();

                }

                editBtn.click(function(){
                    replyBtn.show();
                    cancleBtn.show();
                    commentBox.removeAttr('readonly')
                    editBtn.hide();
                });
                cancleBtn.click(function(){
                    replyBtn.hide();
                    cancleBtn.hide();
                    editBtn.show();
                    commentBox.attr('readonly','readonly');
                    commentBox.val(comment.comment);
                });

                form.submit(function(){
                    form.find('.alert-info').show();
                    $.post('/api/application/comments',
                            form.serialize())
                        .always(function(data){
                            $('.alert').hide();
                        })
                        .fail(function(data){
                            form.find('.alert-danger').show();
                        })
                        .done(function(data){
                            form.find('.alert-success').show().delay(3000).fadeOut();
                            replyBtn.hide();
                            cancleBtn.hide();
                            editBtn.show();
                            commentBox.attr('readonly','readonly');
                        });
                    return false;
                })

            })
        });

        // minimize-maximize boxes
        candidateObj.find('.mbox-title').dblclick( function() {
            $(this).next().toggle();
        });

        initWorkflow(candidateObj,candidate);
        changeWorkflowStage(candidateObj,candidate, candidate.stage.stage, candidate.stage.subStage );

        prevContainer.append( candidateObj )
    });


    $('#application-preview-dialog .bool-close-btn').unbind('click').click(function(){
        $('#application-preview-dialog').removeClass('open');
        $('body').css('overflow','scroll'); // Retrieval main scroll bar
    });

    $('#application-preview-dialog').addClass('open');
    $('body').css('overflow','hidden'); // hide main scroll bar
}