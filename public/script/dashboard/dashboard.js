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

function getTourElement(tour){
    return tour._options.steps[tour._current].element
}

function initTour(){
    var tour = new Tour({
        onStart: function() {
            $('.menu').css('z-index',1100);
        },
        onEnd: function() {
            $('.menu').css('z-index',0);
        },
        onShown: function(tour) {
            var stepElement = getTourElement(tour);

            console.log(tour._current,stepElement)

            if( stepElement === '#createFlyerButton' )
                $('.menu').css('z-index',0);
            else
                $('.menu').css('z-index',1100);
        },
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
                container:".menu"
            },
            {
                element: "#switchButton ",
                title: "Change Team",
                content: "You can change your current team with this button",
                container:".menu-header"
            },
            {
                element: "#createFlyerButton",
                title: "New Job",
                content: "Create new job application form with this button",
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
                content: "Here we are going to show you important parts of application view.",
                container:"body",
                orphan:true
            },
            {
                element: app.find('.workflowGroup'),
                title: "Workflow",
                content: "Use workflow buttons to manage application and move it between stages.",
                placement:'top',
                container:"#application-preview-dialog"

            },
            {
                element: ".portlet-commentsView",
                title: "Comments",
                content: "You can leave your comment or see teammates' comments here about this applicant",
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

    $('.popover-btn').popover();

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

    // Change selected menu item according to Hash in Url
    $(window).on('hashchange',function(){
        console.log( location.hash.slice(1) );

        var panelName = location.hash.slice(1);
        var radioName = '#radio-item-' + panelName.substr(0, panelName.length-1);
        $(radioName).prop('checked',1)
    });

    // Change selected menu item by
    $('#dashboardNavigator input[type="radio"]').change( function(e) {
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

        GAEvent('Dashboard','ApplicationView','Edit ' + operation + ' ' + editableObjClassName );

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

            var skills = candidateObj.find('.candidate-details .candidate-skills .value').text().split(', ');

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
                    applications.fetch();
                });
        }
    });

    $('.createApplicantButton').show().click( function() {
        $('#new-applicant-dialog').modal();
        $('#new-applicant-dialog .sendButton').attr('enable','true').click( function(){

            $(this).attr('disabled','true');

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
        GAEvent('Dashboard','ApplicationView','From Applications');
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
        GAEvent('Dashboard','Billing','To Pay Page');

        var amount = $('#paymentAmount :selected').attr('name')
        document.location =  '/pay?amount=' + amount;
    })

    $('#premiumPlanButton').click( function() {
        GAEvent('Dashboard','Billing','To premium plan');

        $.get('/api/plan/change',{new_plan:1}).done(refresh);
    });

    $('#freePlanButton').click( function() {
        GAEvent('Dashboard','Billing','To free plan');

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
        GAEvent('Dashboard','Applications','Job Filter');
        applications.fetch();
    });

    $('.application-searchButton').unbind('click').click( function() {
        GAEvent('Dashboard','Applications','Search');
        applications.fetch();
    });

    // Sorting
    $('.application-sort').unbind('change').change( function() {
        var sortBy = $('.application-sort :selected').attr('name');

        GAEvent('Dashboard','Applications','Sort By ' + sortBy);
        applications.fetch();
    });
    $('.application-view').unbind('change').change( function() {
        var viewMode = $('.application-view :selected').attr('name');

        GAEvent('Dashboard','Applications','View by ' + viewMode );

        if( viewMode === "grid" ) { // grid
            $('#candidatesCollection').animate({'opacity':0},300, function() {

                $('#candidatesCollection')
                    .removeClass('list-layout')
                    .addClass('grid-layout')
                    .animate({'opacity':1},300);

            });
        }
        else {
            $('#candidatesCollection.grid-layout').animate({'opacity':0},300, function() {

                $('#candidatesCollection')
                    .removeClass('grid-layout')
                    .addClass('list-layout')
                    .animate({'opacity':1},300);

            });
        }

        //applications.fetch();
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
        modal.find('.invitationMessage').val('Dear {{applicant-name}}\r\nWe like to schedule an interview on {{interview-date}} with you for "{{job-title}}" position. The location is {{interview-location}}.\r\n\r\nSincerely,\r\n{{team-name}}');
        modal.find('#interviewDateTime input').change( function() {
            var selectedDate = modal.find('#interviewDateTime input').val();
            var d = new Date(selectedDate);

            $.get('/api/calendar').done( function(res) {
                var events = res.events;

                var sortedEvents = events.sort( function(a,b) {
                    return Math.abs(d-(new Date(a.time))) - Math.abs(d-(new Date(b.time)))
                });

                var filteredEvents = sortedEvents.filter( function(e) {
                    return (Math.abs(d-(new Date(e.time))) / (1000*60*60)) < 2; // With less that 2 hours distance
                });

                var modifiedEvents = filteredEvents.map( function(e) {
                    var dt = dateTimeToJSON(e.time);
                    return e.title + ': ' + dt.date + ' ' + dt.time + '(' + (new moment(d)).from(e.time) + ')';
                });

                //console.log( modifiedEvents.splice(0,5) );
                modal.find('.interview-conflicts ul').empty();
                modifiedEvents.forEach( function(e) {
                    modal.find('.interview-conflicts ul').append( $('<li>').text(e) );
                })
            })
        });

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
        modal.find('.offerMessage').val('Dear {{applicant-name}}\r\nWe like to offer you "{{job-title}}" position.\r\nLet we know whether you are interested or not.\r\n\r\nSincerely,\r\n{{team-name}}');
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

function changeWorkflowStage(candidateObj,candidate,stageNo,subStageNo,internalCall) {

    stageNo--; // Convert to zero-base index
    subStageNo = subStageNo || 1;

    if( !internalCall ){
        var cs = $('.candidate-workflow-stages .candidate-workflow-substage:visible').attr('sub-stage');
        var css = $('.candidate-workflow-stages .candidate-workflow-substage:visible').parent().attr('stage');
        GAEvent('ApplicationView','Workflow', '('+cs+','+css+') To (' + stageNo +','+subStageNo + ')');
    }

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
        applications.fetch();
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

    if( candidate.permission_mark_as_read==='denied') {
        candidateObj.find('.visitedState').remove();
    }

    if( candidate.permission_edit==='denied') {
        var workflow_mbox = candidateObj.find('.candidate-workflow').parent();

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

    candidate.skills = candidate.skills.toString() || '';
    candidateObj.find('.candidate-skills .value').text(candidate.skills.replace(/,/g,', '));
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
        GAEvent('Dashboard','Application','Mark As Visited');

        var el = $(this).parent().parent();
        var appID = $(this).parent().attr('appID');
        $.post('/api/application/' + appID + '/visitedState', {visited:true}).done( function() {
            el.find('.visitedState').addClass('visited').removeClass('unvisited');
        });
    });

    candidateObj.find('.markAsUnvisited').click( function() {
        GAEvent('Dashboard','Application','Mark As Unvisited');

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
    changeWorkflowStage(candidateObj, candidate, candidate.stage.stage, candidate.stage.subStage, true );

    return candidateObj;
}

function toggleSideMenu() {

    var isOpen = parseInt( $('.menu-wrap').css('left') ) != 0;
    var menuLeft = isOpen ? 0 : -250;
    var wrapLeft = isOpen ? 0 : 0;

    $('.menu-wrap').animate({left: menuLeft},500);
    $('#wrap').animate({left: wrapLeft},500);
}