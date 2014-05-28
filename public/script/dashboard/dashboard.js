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

    $('#notificationCenter .tongue').click( function() {
        var isOpen = ($(this).attr('isOpen') == 'true');
        var ncObj = $('#notificationCenter');

        if(isOpen){
            ncObj.animate({'width': 40},300);
        }
        else {
            ncObj.animate({'width': 300},300);
        }

        $(this).attr('isOpen', !isOpen);
    }).click();

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
        var candidateSection=$(this).closest('.candidate');
        var candidate=candidateSection.data('candidate')
        var isExpanded = candidateSection.hasClass('candidate-expanded');


        if(!isExpanded ){

            // Get Comments
            $.get('/api/application/comments',{appID:candidate._id},function(data){
                var comments=data.comments;

                candidateSection.find('.candidate-comments').empty();

                comments.forEach(function(comment){
                    var form=$('.reply-for-comment-form:first').clone().show();

                    candidateSection.find('.candidate-comments').append(form);
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

            // Deselect Current Selection
            $('#candidatesCollection .candidate-expanded')
                .css('clear','none')
                .removeClass('candidate-expanded')
                .next()
                .css('clear','none');

            candidateSection.css('clear','both')
                .addClass('candidate-expanded')
                .next()
                .css('clear','both');

            $('#candidatesCollection .candidate')
                .filter( function(i,obj) { return !$(obj).hasClass('candidate-expanded') })
                .css('opacity',0.3);
            $('#candidatesCollection .candidate-expanded').css('opacity',1);


        }
        else {
            candidateSection.css('clear','none')
                .removeClass('candidate-expanded')
                .next()
                .css('clear','none');

            $('#candidatesCollection .candidate').css('opacity',1);

        }

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

