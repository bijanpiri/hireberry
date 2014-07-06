/**
 * Created by Bijan on 05/10/2014.
 */
teamID = '<%=teamID%>';
userID = '<%=userID%>';
teamMembers = [];
userAdmin = null;
forms = [];
badgeNum=0;

Parse.initialize(
    "qoMkGPujIUWxjrHi28WCcOoSrl755V8CgFYrdC59",
    "xCzRaCEshLWlg6XGvnBxLdRRcv6BRGNY4MUQhgvn");
var Resume=Parse.Object.extend("Resume");
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

function initTour(){
    var tour = new Tour({
        steps: [
            {
                title: "Welcome to Hireberry",
                content: "Hireberry is an Application Tracking System(ATS). You can manage everything from here(Dashboard). Let's see how.",
                container:"body",
                orphan:true
            },
            {
                element: "#dashboardNavigator",
                title: "Dashboard Navigation Menu",
                content: "Use this buttons to navigate to different parts of dashboard",
                container:"body"
            },
            {
                element: "#switchButton ",
                title: "Switch Team",
                content: "You can change your current team with this button",
                container:"body"
            },
            {
                element: "#createFlyerButton",
                title: "New Job Position",
                content: "Create new job position with this button",
                reflex:true,
                container:"#navbar-container"
            }],
        backdrop:true,
        onEnd:function(tour){
            $.post('/api/cert',{dashLevel:3});
        }

    });

    $.get('/api/cert',function(data){
        if(data && data.dash)
            return;

// Initialize the tour
        tour.init();
        tour.start(true);
// Start the tour
        tour.goTo(0);


    });
    $(window).resize(function(){
        tour.goTo(tour.getCurrentStep())
    })
}

function initApplicationTour(app){
    var tour = new Tour({
        steps: [
            {
                title: "Application tour",
                content: "Here we are going to show you important parts of application ",
                container:"body",
                orphan:true
            },
            {
                element: app.find('.workflowGroup'),
                title: "Workflow",
                content: "Use workflow buttons to manage user application.",
                placement:'top',
                container:"#application-preview-dialog"

            },
            {
                element: ".portlet-commentsView",
                title: "Application comments",
                content: "You can leave your comment here or see teammates' comments here",
                placement:'left',
                container:".portlet-commentsView-container"
            }],
        backdrop:true,
        onEnd:function(tour){
            $.post('/api/cert',{appLevel:3});
        }

    });

    $.get('/api/cert',function(data){
        if(data && data.application)
            return;

// Initialize the tour
        tour.init();
        tour.start(true);
// Start the tour
        tour.goTo(0);


    });
    $(window).resize(function(){
        tour.goTo(tour.getCurrentStep())
    })
}

$(function(){
    $('[data-toggle="tooltip"]').tooltip();
    $('[data-toggle="popover"]').popover();

    initOverviewPage();
    initTeamPage();
    initApplicationPage();
    initBillingPage();
    initTour();

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
        var fixValues = $(this).parent().attr('fixValues')==="true";

        if( fixValues ){
            var editableObj = $(this).closest( '.' + editableObjClassName ).find('select');
            var viewableObj =  $(this).closest( '.' + editableObjClassName ).find('.value');;

            switch (operation) {
                case 'edit':
                    viewableObj.hide().attr('contenteditable','true');
                    editableObj.show();
                    editableObj.find('[val="' + viewableObj.text() + '"]').attr('selected','true')
                    break;
                case 'yes':
                    viewableObj.show().attr('contenteditable','false');
                    editableObj.hide();
                    viewableObj.text( editableObj.val() );
                    saveModifiedApplication( editableObj.closest('.candidate') );
                    break;
                case 'no':
                    viewableObj.show().attr('contenteditable','false');
                    editableObj.hide();
                    break;
            }


        }
        else {
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
        }


        function saveModifiedApplication(candidateObj) {

            var skills = candidateObj.find('.candidate-details .candidate-skills .value').text().split(',');

            $.post('/api/applications/' + candidateObj.data('candidate')._id , {
                name: candidateObj.find('.candidate-name .value').text(),
                email: candidateObj.find('.candidate-email .value').text(),
                tel: candidateObj.find('.candidate-tel .value').text(),
                website: candidateObj.find('.candidate-website .value').text(),
                note: candidateObj.find('.candidate-note .value').html(),
                skills: JSON.stringify(skills),
                workplace: candidateObj.find('.candidate-details .candidate-conditions-place .value').text(),
                worktime: candidateObj.find('.candidate-details .candidate-conditions-time .value').text()
            }).done( function() {
                    refresh();
                });
        }
    });


    $('#createApplicantButton').click( function() {
        $('#new-applicant-dialog').modal();
        $('#new-applicant-dialog .sendButton').click( function(){
            $.post('/apply',{
                flyerid: $('#new-applicant-dialog .jobsList :selected').attr('formid'),
                name: $('#new-applicant-dialog .applicant-name').val(),
                isInternalApply: true
            }).done( function(data) {
                    $('#new-applicant-dialog').modal('hide');
                    showApplicationPreview(data.applicationID);
                });
        });
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
            $('#switchTeamView').show();
            $('#switchTeamEdit').hide();

            window.location = '/#overviewp';
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
        modal.find('.interviewLocation').val( $('.teamAddress').text() );

        modal.find('.sendButton').unbind('click').click( function() {
            var selectedDate = modal.find('#interviewDateTime input').val();
            var interviewDateTime = new Date(selectedDate);

            gotoNewStage(2,1,{
                invitedName: candidate.name,
                invitedEmail: modal.find('.emailAddress').val(),
                invitationMessage: modal.find('.invitationMessage').val(),
                interviewDate: interviewDateTime,
                interviewLocation:  modal.find('.interviewLocation').val()
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
                applications.fetch();
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

    if( stageNo==1 ){
        var dt = dateTimeToJSON( candidate.stage.interviewDate );
        candidateObj.find('.candidate-workflow-stage.' + stagesName[1] +' .interviewDate').text( dt.fullStyle );
    }
}

function showApplicationPreview(applicationID) {
    var prevContainer = $('#application-preview-dialog')
        .find('.application-preview-container')
        .empty();

    $.get('/api/application/json/' + applicationID).done( function(app) {
        var candidateInstance = initCandidateInstance(app,true);
        prevContainer.append( candidateInstance );
        initApplicationTour(prevContainer);

    });

    $('#application-preview-dialog .bool-close-btn').unbind('click').click(function(){
        $('#application-preview-dialog').removeClass('open');
        $('body').css('overflow','auto'); // hide main scroll bar
    });

    $('#application-preview-dialog').addClass('open');
    $('body').css('overflow','hidden'); // hide main scroll bar

}

function initCandidateInstance(candidate,expanded) {

    var candidateObj =
        $('#candidateInstance')
            .clone().show().addClass('candidate')
            .data('candidate',candidate);

    if(expanded)
        candidateObj.addClass('candidate-expanded');

    if( candidate.currentUser==='denied') {
        var workflow_mbox = candidateObj.find('.candidate-workflow').parent();

        candidateObj.find('.visitedState').remove();

        workflow_mbox.empty().append('You do not have enough permission.');
        workflow_mbox.css('text-align','center')
            .css('font-size','1.8em')
            .css('padding','1em 0')
            .css('height','auto');

        candidateObj.find('[op="edit"]').remove();
        candidateObj.find('.applicationAskForCommentButton').remove();
        candidateObj.find('.bool-application-comments').css('height','auto');
        candidateObj.find('.bool-application-activities').css('height','auto');
    }

    if( candidate.website && candidate.website.length>0 && candidate.website.indexOf('://') == -1 )
        candidate.website = 'http://' + candidate.website;

    if(candidate.avatarURL)
        candidateObj.find('.candidate-avatar').css('background-image','url("'+candidate.avatarURL+'")')
            .find('.candidate-avatar-empty').hide();
    else
        candidateObj.find('.candidate-avatar .candidate-avatar-empty').addClass('bool-image bool-avatar-no');

    candidateObj.find('.candidate-name .value').text(candidate.name);
    candidateObj.find('.candidate-job .value').text(candidate.position);

    var dt = dateTimeToJSON(candidate.applyTime);
    candidateObj.find('.candidate-time .value').text( dt.fullStyle );

    candidateObj.find('.candidate-stage .stage.value').text( stagesName[candidate.stage.stage-1]);
    candidateObj.find('.candidate-stage .substage.value').text( subStagesName[candidate.stage.stage-1][candidate.stage.subStage-1] );
    candidateObj.find('.candidate-skills .value').text(candidate.skills);
    candidateObj.find('.candidate-conditions-time .value').text( candidate.workTime || 'Not specified' );
    candidateObj.find('.candidate-conditions-place .value').text( candidate.workPlace || 'Not specified' );


    candidateObj.find('.candidate-coverLetter').text(candidate.anythingelse);
    candidateObj.find('.candidate-email .value').attr('href','mailto:'+candidate.email).text(candidate.email);
    candidateObj.find('.candidate-tel .value').text(candidate.tel);
    candidateObj.find('.candidate-website .value').attr('href',candidate.website).text(candidate.website);
    candidateObj.find('.candidate-note .value').html(candidate.note);
    candidateObj.find('[name="appID"]').val(candidate._id);
    candidateObj.find('.applicationAskForCommentButton').click( function() {
        $('#a4c-dialog').find('[name=appID]').val(candidate._id);
        $('#a4c-dialog').modal('show');
    })

    var viewer = 'https://docs.google.com/viewer?embedded=true&url=';
    var viewResume = candidateObj.find('.candidate-resume-view-button');
    var downloadResume = candidateObj.find('.candidate-resume-download-button');
    var uploadResume = candidateObj.find('.candidate-resume-upload-button');

    if( candidate.resumePath ) {
        viewResume.attr('href', viewer + candidate.resumePath );
        downloadResume.attr('href', candidate.resumePath );
    }
    else {
        viewResume.hide();
        downloadResume.hide();
        uploadResume
            .unbind('click')
            .click(function () {
                candidateObj.find('input.candidate-file')
                    .click()
                    .change(function () {

                        var resume = new Resume();
                        var file = new Parse.File('user-resume', this.files[0]);

                        resume.set('file', file);

                        resume.save(null, {
                            success: function (resume) {
                                viewResume.show().attr('href',viewer+file.url());
                                downloadResume.show().attr('href', file.url());
                                uploadResume.html('Change');

                                // Save resume URL in database
                                $.post('/api/resume',{
                                    applicationID:candidate._id,
                                    resume:file.url()
                                });
                            }
                        });
                    });

            });
    }
    // Activities
    for( var j=0; j<candidate.activities.length; j++ ) {
        var activity = candidate.activities[j];

        var stageChangingDetails = null;
        if(activity.data){
            var stage = activity.data.stage;
            var subStage = activity.data.subStage;

            if( stage && subStage )
                stageChangingDetails = stagesName[stage-1] + '-' + subStagesName[stage-1][subStage-1];
        }

        var activityDT = dateTimeToJSON(activity.timestamp);
        var timeObj = $('<div>').addClass('activity-time').text( activityDT.fullStyle );
        var typeObj = $('<div>').addClass('activity-type').text( stageChangingDetails || activity.type );
        var stoneObj = $('<div>').addClass('activity-stone');
        var activityObj = $('<div>').addClass('activity').append(stoneObj).append(timeObj).append(typeObj);

        candidateObj.find('.candidate-activities').append( activityObj );
    }

    // Profiles
    //candidate.profile = JSON.parse(candidate.profiles);
    var profilesObj = {
        twitter: '.twitter-profile',
        behance: '.behance-profile',
        dribbble: '.dribbble-profile',
        stackoverflow: '.stackoverflow-profile',
        github: '.github-profile',
        linkedin: '.linkedin-profile'
    };
    for( var profile in candidate.profiles ){
        var profileObj = candidateObj.find(profilesObj[profile]);
        profileObj.show().attr('href', profileObj.attr('href') + '/' + candidate.profiles[ profile ] );
    }

    candidateObj.addClass('candidate-filter-' + stagesName[candidate.stage.stage-1]);

    candidateObj.find('.candidate-note-save-button').attr('appID',candidate._id).click( function() {
        var appID = $(this).attr('appID');
        var note = $(this).parent().parent().find('.candidate-note').val();

        $.post('/api/application/' + appID + '/note', {note: note}).done( function() {});
    });

    candidateObj.find('.markAsVisited').click( function() {
        var el = $(this).parent().parent();
        var appID = $(this).parent().attr('appID');
        $.post('/api/application/' + appID + '/visitedState', {visited:true}).done( function() {
            el.find('.visitedState').addClass('visited').removeClass('unvisited');
        });
    });

    candidateObj.find('.markAsUnvisited').click( function() {
        var el = $(this).parent().parent();
        var appID = $(this).parent().attr('appID');
        $.post('/api/application/' + appID + '/visitedState', {visited:false}).done( function() {
            el.find('.visitedState').removeClass('visited').addClass('unvisited');
        });
    });

    candidateObj.find('.visitedState').attr('appID',candidate._id);
    if( candidate.visited === true )
        candidateObj.find('.visitedState').addClass('visited');
    else
        candidateObj.find('.visitedState').addClass('unvisited');

    // minimize-maximize boxes
    candidateObj.find('.mbox-title').dblclick( function() {
        $(this).next().toggle();
    });

    if( expanded )
        $('.bool-application-comments').commentBox({
        postURL: '/api/application/' + candidate._id + '/comment',
        getURL: '/api/application/' + candidate._id + '/comments',
        togglable: false
    });

    initWorkflow(candidateObj,candidate);
    changeWorkflowStage(candidateObj,candidate, candidate.stage.stage, candidate.stage.subStage );

    return candidateObj;
}