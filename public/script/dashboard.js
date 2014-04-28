/**
 * Created by coybit on 4/28/14.
 */
var teamID = '<%=teamID%>';
var userID = '<%=userID%>';
var teamMembers = [];
var forms = [];

google.load("visualization", "1");

$(function(){

    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g,
        escape: /\{\{\-(.+?)\}\}/g,
        evaluate: /\{\%(.+?)\%\}/g
    };

    refresh(false);

    // Initializing modals
    $('#applicationPreview').dialog({
        resizable: false,
        autoOpen: false,
        modal: true,
        title: "Application Preview",
        width: 400,
        height: 400
    });

    $('#activitiesModal').dialog({
        resizable: false,
        autoOpen: false,
        modal: true,
        title: "Activities",
        width: 800,
        height: 450
    });

    $('#positionComments').dialog({
        resizable: false,
        autoOpen: false,
        modal: true,
        title: "Activities",
        width: 400,
        height: 400
    });

    $('#teamInvitationModal').dialog({
        resizable: false,
        autoOpen: false,
        modal: true,
        title: "Invite",
        width: 400,
        height: 300
    });

    $('#teamSettingModal').dialog({
        resizable: false,
        autoOpen: false,
        modal: true,
        title: "Invite",
        width: 400,
        height: 300
    });


    $('#teamNameChange').click( function() {
        var newName = prompt('Enter new name:');
        $.post('/api/team/name',{newName:newName}).done( function() {
            $('#teamName').text(newName);
        });
    });

    $('#teamAdminChange').click( function() {
        $('.teamMemberMakeAdmin').show();
    });

    $('.menu .item').click( function(e) {
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
    });
});

function refresh(once) {
    // First fill Forms list, then fill table according to current selected form
    fillPositionsList( function() {
        getTeamInfo( function() {
            $('.colAssignedTo select option').remove();

            for( var i=0; i<teamMembers.length; i++ ){
                if( teamMembers[i].status === 'joint') {
                    var option = $('<option>')
                        .attr('userID',teamMembers[i]._id)
                        .text(teamMembers[i].displayName);
                    $('.colAssignedTo select').append( option.clone() );
                }
            }

        });
    });
    fillTable()
    getStat();
    fillAskedForComments();
    fillCalendar();
    fillUserTeams();

    if(once==false)
        setTimeout( refresh, 30000 );
}

function fillAskedForComments() {

    $('#askedForCommentList').html('');

    $.get('/api/user/application/askedForComment').done( function(resApp){

        $.get('/api/user/form/askedForComment').done( function(resForm){

            $.get('/api/user/invitations').done( function(resInvitations){

                var A4C_applicatinos = resApp.applications;
                var A4C_forms = resForm.forms;

                var badgeNum = resApp.applications.length + resForm.forms.length + resInvitations.length;
                $('#comments_badge').text(badgeNum);

                showApplications(A4C_applicatinos);
                showForms(A4C_forms);
                showInvitations(resInvitations);
            });
        });
    })

    function decreaseBudgeNumber() {
        var num = parseInt( $('#comments_badge').text() );
        $('#comments_badge').text(--num);
    }

    function showApplications(A4C_applicatinos) {
        A4C_applicatinos.forEach( function(a4c) {
            var objID = 'askedForComment_'+a4c._id;

            var dateObj = $('<div>')
                .text( 'At ' + (new Date(a4c.askingTime)).toLocaleString() )
                .addClass('comment_date');

            var titleObj = $('<div>')
                .text('You are asked to put your comment about ')
                .append( $('<a>').attr('applicationID',a4c.applicationID._id).text('this application').click( function() {
                    showApplicationPreview( $(this).attr('applicationID') );
                }))

            var textAreaObj = $('<textarea>')
                .attr('id','comment_app_' + a4c.applicationID._id)
                .css('display','block')
                .attr('placeholder','Your comment ...');

            var sendBtnObj = $('<button>')
                .text('Send')
                .click( function() {
                    $.post('/api/user/comment', {
                        askForCommentID:a4c._id,
                        comment:$('#comment_app_' + a4c.applicationID._id).val()
                    }).done( function() {
                            $('#' + objID).remove();
                            decreaseBudgeNumber();
                        });
                });

            $('#askedForCommentList').append( $('<li>').attr('id',objID)
                .append(dateObj)
                .append(titleObj)
                .append(textAreaObj)
                .append(sendBtnObj) );
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

            var textAreaObj = $('<textarea>')
                .attr('id','comment_form_' + a4c.formID._id)
                .css('display','block')
                .attr('placeholder','Your comment ...');

            var sendBtnObj = $('<button>')
                .text('Send')
                .click( function() {
                    $.post('/api/user/comment', {
                        askForCommentID:a4c._id,
                        comment:$('#comment_form_' + a4c.formID._id).val()
                    }).done( function() {
                            $('#' + objID).remove();
                            decreaseBudgeNumber();
                        });
                });

            $('#askedForCommentList').append( $('<li>').attr('id',objID)
                .append(dateObj)
                .append(titleObj)
                .append(textAreaObj)
                .append(sendBtnObj) );
        });
    }

    function showInvitations(resInvitations) {
        for( var i=0; i<resInvitations.length; i++ ) {

            var teamID = resInvitations[i].inviterTeam._id;
            var invitationID = resInvitations[i]._id;
            var objID = 'invitation_' + invitationID;

            var dateObj = $('<div>')
                .text( 'At ' + (new Date(resInvitations[i].inviteTime)).toLocaleString() )
                .addClass('comment_date');

            var titleObj = $('<div>')
                .text('Invited to ' +  resInvitations[i].inviterTeam.name);

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

        $('#applicationPreview').html('');

        $.get('/api/application/json/' + applicationID).done( function(app) {
            app = app[0];

            var workTime = app.workTime;
            var workPlace = app.workPlace;
            var profiles = app.profiles.length ? JSON.parse(app.profiles) : '';
            var coverLetter = app.anythingelse;
            var resumePath = app.resumePath;
            var name = app.name;
            var email = app.email;
            var skills = app.skills.length ? JSON.parse(app.skills) : '';

            var profielsArray = [];
            for( var profile in profiles )
                profielsArray += '<br>' + profile + ':' + profiles[profile];
            profiles = profielsArray;

            var workTimeObj = $('<div>').text('Work Time: ' + workTime);
            var workPlaceObj = $('<div>').text('Work Place: ' + workPlace);
            var profilesObj = $('<div>').html('Profiles: ' + profiles);
            var coverLetterObj = $('<div>').text('Cover Letter: ' + coverLetter);
            var resumePathObj = $('<div>').text('Resume Path: ' + resumePath);
            var nameObj = $('<div>').text('Name: ' + name);
            var emailObj = $('<div>').text('Email: ' + email);
            var skillsObj = $('<div>').text('Skills: ' + skills);


            var previewObj = $('<div>').addClass('applicationsPreview')
                .append(nameObj)
                .append(emailObj)
                .append(workTimeObj)
                .append(workPlaceObj)
                .append(profilesObj)
                .append(coverLetterObj)
                .append(resumePathObj)
                .append(skillsObj)


            $('#applicationPreview').append( previewObj )
        });


        $('#applicationPreview').dialog('open');
    }
}

function fillPositionsList( callback ) {

    $.get('/api/forms?teamID=' + teamID).done( function(res) {

        forms = res.forms;

        $('.positionsContainer .position').remove();

        res.forms.forEach( function(form) {
            var row = $('.positionsContainer .positionsHeaderRow')
                .clone()
                .removeClass('positionsHeaderRow');

            var titleObj = $('<span>')
                .addClass('positionTitle')
                .text(form.formName);

            var stateObj = $('<span>')
                .addClass('positionMode')
                .text(form.mode);

            var creatorObj = $('<span>')
                .addClass('positionCreator')
                .text( form.creator.displayName);

            var assigneeObj = $('<select>')
                .attr('formID', form.formID)
                .addClass('positionAssignee')
                .text((form.autoAssignedTo ? form.autoAssignedTo.displayName : 'No One') )
                .change( function(){
                    var userID = $(this).find(':selected').attr('userID');
                    var formID = $(this).attr('formID');

                    $.post('/api/team/form/assign',{formID:formID,userID:userID})
                        .done( function() {
                            alert('Position assignment done.')
                        });
                })

            var editBtnObj = $('<a>')
                .addClass('btn btn-mini btn-primary')
                .attr('href','')
                .text('edit')
                .click( function() {
                    window.open('/flyer/edit/0?flyerid=' + form.formID);
                });

            var viewBtnObj = $('<a>')
                .addClass('btn btn-mini btn-warning')
                .attr('href','')
                .text('view')
                .click( function() {
                    window.open('/flyer/view/0?flyerid=' + form.formID);
                });

            var deleteBtnObj = $('<a>')
                .addClass('btn btn-mini btn-danger')
                .attr('formID',form.formID)
                .text('comments')
                .click( function() {
                    //window.open('/flyer/remove?flyerid=' + form.formID);
                    $('#positionComments').dialog('open')
                    var formID = $(this).attr('formID')
                    getPositionComments( formID );
                });

            row.find('.colTitle').html('').append(titleObj);
            row.find('.colStatus').html('').append(stateObj);
            row.find('.colCreator').html('').append(creatorObj);
            row.find('.colAssignedTo').html('').append(assigneeObj);
            row.find('.colOperations').html('').append(editBtnObj).append(viewBtnObj).append(deleteBtnObj);

            row.addClass('position').attr('id',form.formID);
            $('.positionsContainer').append( row );
        });

        callback();
    })
}

function fillTable() {

    $('#applicationsTable').html('');
    $('#candidatesCollection .candidate').remove();

    $.get('/api/applications').done( function(res) {

        for( var i=0; i<res.rows.length; i++ ) {
            var candidateObj = $('#candidateInstance').clone().show().addClass('candidate grid-candidate');
            var candidate = res.rows[i];

            candidateObj.find('.candidate-name').text(candidate.name);
            candidateObj.find('.candidate-job').text(candidate.position);
            candidateObj.find('.candidate-stage').text(candidate.lastActivity);
            candidateObj.find('.candidate-skills').text(candidate.skills);
            candidateObj.find('.candidate-conditions').text(candidate.workTime + ' @' + candidate.workPlace);
            $('#candidatesCollection').append( candidateObj );
        }

        $('.candidate').unbind('click').click( function() {
        if( $(this).hasClass('grid-candidate') == false )
            return;

        var isExpanded = ($(this).attr('isExpanded') === 'true');

        if( isExpanded==false ){
            $(this).css('clear','both').addClass('grid-candidate-expanded');
            $(this).next().css('clear','both');
        }
        else {
            $(this).css('clear','none').removeClass('grid-candidate-expanded');
            $(this).next().css('clear','none');
        }

        $(this).attr('isExpanded', !isExpanded );
    });

    $('#candidatesGridButton').unbind('click').click( function() {
        $('#candidatesCollection .list-candidate').animate({'opacity':0},300, function() {
            $('#candidatesCollection .list-candidate')
                .removeClass('list-candidate')
                .addClass('grid-candidate');

            $('#candidatesCollection .grid-candidate').animate({'opacity':1},300);
        });
    });

    $('#candidatesListButton').unbind('click').click( function() {
        $('#candidatesCollection .grid-candidate').animate({'opacity':0},300, function() {
            $('#candidatesCollection .grid-candidate')
                .removeClass('grid-candidate')
                .addClass('list-candidate');

            $('#candidatesCollection .list-candidate').animate({'opacity':1},300);
        });
    });

    });

    $('#applicationsTable').WATable({
        url: '/api/applications',
        preFill: true,
        pageSize: 10,
        sorting: true,
        filter: true,
        sortEmptyLast: true,
        hidePagerOnEmpty: true,
        checkboxes: true,
        actions: {
            filter: true, //Toggle visibility
            columnPicker: true, //Toggle visibility
            custom: [
                $('<a href="#">someLink</a>'),
                $('<a href="#">anotherLink</a>')
            ]
        },
        rowClicked: function(data) {
            rowClicked(data);
        }
    });
}

function fillCalendar() {
    $.get('/event').done( function(events) {

        var eventsList = events.map( function(event) {
            var m = new moment(event.time);

            return {
                date: m.format('YYYY-MM-DD'),
                title: (event.title || 'Event'),
                location:  m.format('DD MMM[,] ddd')  + ' ( ' + m.fromNow() + ' ) '
            };
        });

        /*
         [{ date: '2014-04-01', title: 'Persian Kitten Auction', location: 'Center for Beautiful Cats' } ]
         */

        $('#full-clndr').clndr({
            template: $('#full-clndr-template').html(),
            events:  eventsList,
            clickEvents: {
                click: function(target) {
                    console.log(target);
                },
                onMonthChange: function(month) {
                    console.log('you just went to ' + month.format('MMMM, YYYY'));
                }
            },
            doneRendering: function() {
                console.log('this would be a fine place to attach custom event handlers.');
            }
        });

    });
}

function fillUserTeams() {

    $('#userTeams').html('');

    $.get('/api/user/teams').done( function(teams) {
        teams.forEach( function(team) {
            $('#userTeams').append( $('<option>').text(team.name).attr('name',team._id) );
        });

        $('#switchButton').unbind('click').click( function() {
            $('#switchTeamEdit').show();
            $('#switchTeamView').hide();
        });

        $('#cancelChangeUserTeam').unbind('click').click( function() {
            $('#switchTeamView').show();
            $('#switchTeamEdit').hide();
        });

        $('#changeUserTeam').unbind('click').click( function() {
            var teamID = $('#userTeams :selected').attr('name');

            $.post('/api/user/changeTeam', {teamID:teamID}).done( function() {
                refresh(true);

                $('#switchTeamView').show();
                $('#switchTeamEdit').hide();
            })
        })
    })
}

// Make a triple parameters function
function handlerMaker(a,b,c) {
    return (function(p1,p2,p3){
        return function(){changeApplicationState(p1,p2,p3)}
    })(a,b,c);
}

function changeApplicationState(appID,newState,inputElements) {

    var data = {};

    for(var i=0; i<inputElements.length; i++)
        data[ inputElements[i].attr('name') ] = inputElements[i].val();

    $.post( '/api/applications/' + appID, { activity:newState, data:data }).done( function(res) {
        fillTable();
    })
}

function Application(appID) {
    $.post( '/api/applications/' + appID, {
        activity:'INVITED'
    }).done( function(res) {
            fillTable();
        })
}

function getStat() {
    $.get('/api/applications/stat').done( function(res){
        $('#numForms').text( res.numForms )
        $('#numApplications').text( res.numApplications )
        $('#numNewApplications').text( res.numNewApplications )
        $('#numTodayApplications').text( res.numTodayApplications )
    });
}

function rowClicked(data) {

    var activitiesObj = $('<div>').addClass('activities');
    var appID = data.row._id;
    var activities = data.row.activities;
    var timelineRows = [];

    for( var i=0; i<activities.length; i++ ) {

        var activity = activities[i];
        var dateTime = new Date(activity['timestamp']);
        var activityItem = $('<div>').addClass('activity');
        var timeStamp = $('<div>').addClass('activity-timestamp').text( dateTime.toLocaleString() );
        var activityType = $('<div>').addClass('activity-type').text( activity['type'] );
        var separator = $('<hr>').addClass('activity-separator');
        var aboutDecision ='';

        if( i > 0 ) {
            var decisionTitle = $('<div>').append('Decision: ' +  activities[i-1]['type'] + ' &#10140; ' + activities[i]['type']);
            var decisionBody = $('<div>');

            var moreData = activities[i].data;
            for( var key in moreData)
                decisionBody.append('<b>' + key + '</b>' + ': ' + moreData[key] + '<br/>');

            aboutDecision = $('<div>')
                .addClass('activity-decision')
                .append(decisionTitle)
                .append(decisionBody);
        }

        activityItem.append(timeStamp).append(activityType).append(aboutDecision)
        activitiesObj.prepend( activityItem );
        timelineRows.push([dateTime,, activity['type']]);
    }

    $('#activitiesModal').find('.contain').html( activitiesObj );
    $('#activitiesModal').dialog('open');

    // Showing timeline must be called just after removing hidden property
    loadTimeline(timelineRows);

    var lastActivity = data.row.activities[ data.row.activities.length-1 ];
    loadDecisionBox( lastActivity, appID );
    getApplicationComments( appID );

    // AskForComment section
    $('#askForCommentOnApplication').unbind('click');
    $('#askForCommentOnApplication').click( function() {
        $.post('/api/team/application/askForComment', {
            applicationID: appID,
            userID: $('#teamMembersForComment :selected').attr('id')
        }).done( function() {
                $('#askForCommentMessage').text('Request is sent to ' + $('#teamMembersForComment :selected').text() );
            });
    });

    $('#teamMembersForAssign option').remove();
    $('#teamMembersForComment option').remove();

    for( var i=0; i<teamMembers.length; i++ ){
        if( teamMembers[i].status === 'joint' ) {
            var option = $('<option>')
                .attr('name',teamMembers[i]._id)
                .attr('id',teamMembers[i]._id)
                .text(teamMembers[i].displayName);
            $('#teamMembersForAssign').append( option.clone() );
            $('#teamMembersForComment').append( option.clone() );
        }
    }
}

function loadDecisionBox(activity,applicationID) {

    $('#decisionBox').html('');

    var actionPanel = $('<div>').addClass('activity-actionPanel');
    var currentState = $('<p>').html('This application is in <b>' + activity['type'] + '</b> state.').addClass('activity-title');
    var title = $('<p>').text('Make a decision').addClass('activity-title');
    var note = $('<textarea>').attr('placeholder','Enter a note about your decision causes')
        .addClass('activity-note')
        .attr('name','note') ;
    actionPanel.append(currentState).append(title).append(note).append('<br>');

    switch( activity['type'] ) {
        case 'NEW':
            var ignoreBtn = $('<button>')
                .text('Ignore')
                .addClass('btn btn-danger')
                .click( handlerMaker(applicationID,'IGNORED',[note]) );

            var planBtn = $('<button>')
                .text('Plan an interview')
                .addClass('btn btn-primary')
                .click( handlerMaker(applicationID,'PLANNING',[note]) );

            actionPanel.append(ignoreBtn).append(planBtn);
            break;
        case 'PLANNING':
            var interviewDate = $('<input type=date>')
                .attr('name','interviewDate');
            var interviewTime = $('<input type=time>')
                .attr('name','interviewTime')

            var ignoreBtn = $('<button>')
                .text('Ignore')
                .addClass('btn btn-danger')
                .click( handlerMaker(applicationID,'IGNORED',[note]) );

            var inviteBtn = $('<button>')
                .text('Send an invitation')
                .addClass('btn btn-primary')
                .click( handlerMaker(applicationID,'INVITED',[note,interviewDate,interviewTime]) )
                .click( function() {
                    var addToEvents = confirm('Add this event to calendar?');
                    if( addToEvents )
                        $.post( '/event', {
                            time: new Date(interviewDate.val() + ' ' +interviewTime.val()),
                            contributors: [],
                            title: note.val()
                        }).done( function() {
                                alert('This event is added to calendar.');
                            });
                });

            actionPanel.append(interviewDate)
                .append(interviewTime)
                .append('<br>')
                .append(ignoreBtn)
                .append(inviteBtn);
            break;
        case 'INVITED':
            var ignoreBtn = $('<button>')
                .text('Approved')
                .addClass('btn btn-success')
                .click( handlerMaker(applicationID,'APPROVED',[note]) );

            var inviteBtn = $('<button>')
                .text('Decline')
                .addClass('btn btn-danger')
                .click( handlerMaker(applicationID,'DECLINED',[note]) );

            actionPanel.append(ignoreBtn).append(inviteBtn);
            break;
        case 'APPROVED':
        case 'DECLINED':
        case 'IGNORED':
            var BackToListBtn = $('<button>')
                .text('Back to list')
                .addClass('btn btn-primary')
                .click( handlerMaker(applicationID,'NEW',[note]) );
            actionPanel.append(BackToListBtn);
            break
    }

    $('#decisionBox').append(actionPanel)
}

function loadTimeline(rows) {

    // Create and populate a data table.
    var data = new google.visualization.DataTable();
    data.addColumn('datetime', 'start');
    data.addColumn('datetime', 'end');
    data.addColumn('string', 'content');

    data.addRows(rows);

    // specify options
    var options = {
        "width":  "450px",
        "height": "200px",
        "style": "box",
        "showCurrentTime": true
    };

    // Instantiate our timeline object.
    var timeline = new links.Timeline(document.getElementById('timeline'));

    // Draw our timeline with the created data and options
    timeline.draw(data, options);
}

function getAvatar(email) {
    var hash = CryptoJS.MD5( email.trim().toLowerCase() );
    return 'http://www.gravatar.com/avatar/' + hash;
}

function getTeamInfo(callback) {
    $.get('/api/team/members').done( function(res){
        $('#teamJobsPage').attr('href','/team/' +  res.teamID + '/jobs')
        $('#teamName').text( res.teamName );
        $('#teamAdmin').text( res.teamAdminEmail );

        $('#currentTeamName').text( res.teamName );

        $('#teamSettingButton').unbind('click').click( function() {
            $('#teamSettingModal').dialog("open");
        });

        $('#teamInviteButton').unbind('click').click( function() {
            $('#teamInvitationModal').dialog("open");
        });

        if( res.isAdmin===true ) {
            $('#teamNameChange').show();
            $('#teamAdminChange').show();
        }

        teamMembers = res.members;

        $('#assignTo').html('')
        $('#teamMembers').html('');

        for( var i=0; i<res.members.length; i++ ){
            var avatarObj = $('<img>').addClass('teamMemberAvatar').attr( 'src', getAvatar(res.members[i].email) );
            var emailObj = $('<div>').addClass('teamMemberEmail').text(res.members[i].displayName);
            var roleObj = $('<div>').addClass('teamMemberRole').text( res.members[i].role );
            var makeAdminObj = $('<div>').attr('userID',res.members[i]._id)
                .addClass('teamMemberMakeAdmin btn')
                .hide()
                .text( 'Make Admin')
                .click( function() {
                    $.post('/api/team/admin', {newAdmin: $(this).attr('userID')}).done( function() {
                        $('.teamMemberMakeAdmin').hide();
                        refresh(true)
                    })
                });
            var statusObj = $('<div>').addClass('teamMemberStatus').text( res.members[i].status );
            var memberObj = $('<div>').addClass('teamMember')
                .append( avatarObj )
                .append( emailObj )
                .append( res.isAdmin ? makeAdminObj : '' )
                .append( roleObj )
                .append( statusObj );


            $('#teamMembers').append( memberObj );
        }

        callback();
    });

    $('#sendInvitationButton').click( function() {
        $.post('/api/team/invite',{ email: $('#inviteEmail').val() })
            .done( function() {
                alert('Invitation is sent.')
                $('#inviteEmail').val('');
                getTeamInfo();
            });
    });
}

function selectAssignedToFromList() {
    var selectedFormID = $('#formsList :selected').attr('id');

    forms.forEach( function(form) {
        if( form.formID == selectedFormID )
            $('#assignTo option[name=' + form.assignedTo + ']').attr('selected','selected');
    });
}

function getApplicationComments(appID) {
    $('#activitiesModal .comments').html('');

    $.get('/api/application/comments', {applicationID:appID}).done( function(res){
        res.comments.forEach( function(comment) {
            var commentObj = $('<div>').addClass('comment');
            commentObj.append( $('<div>').addClass('commentNote').text('Asked: ' +  comment.note) );
            commentObj.append( $('<div>').addClass('commentTime').text( 'At ' + (new Date(comment.askingTime)).toLocaleString()) );
            commentObj.append( $('<div>').addClass('commenter').text(comment.commenter.email + "'s comment:") );
            commentObj.append( $('<div>').addClass('commentBody').text(comment.comment) );
            commentObj.append( $('<div>').addClass('commentTime').text( 'At ' + (new Date(comment.commentTime)).toLocaleString()) );

            $('.comments').append( commentObj );
        });
    });
}

function getPositionComments(appID) {
    $('#positionComments .comments').html('');

    $.get('/api/form/comments', {formID:appID}).done( function(res){
        res.comments.forEach( function(comment) {
            var commentObj = $('<div>').addClass('comment');
            commentObj.append( $('<div>').addClass('commentNote').text('Asked: ' +  comment.note) );
            commentObj.append( $('<div>').addClass('commentTime').text( 'At ' + (new Date(comment.askingTime)).toLocaleString()) );
            commentObj.append( $('<div>').addClass('commenter').text(comment.commenter.email + "'s comment:") );
            commentObj.append( $('<div>').addClass('commentBody').text(comment.comment) );
            commentObj.append( $('<div>').addClass('commentTime').text( 'At ' + (new Date(comment.commentTime)).toLocaleString()) );

            $('#positionComments .comments').append( commentObj );
        });
    });
}
