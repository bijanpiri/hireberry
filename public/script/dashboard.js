/**
 * Created by coybit on 4/28/14.
 */
var teamID = '<%=teamID%>';
var userID = '<%=userID%>';
var teamMembers = [];
var forms = [];


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

function fillTeamSetting(){
    $.get('/api/team/settings',
        function (data) {
            $('[name=teamAdmin]').val(data.admin._id);
            $('[name=teamName]').val(data.name);
            $('[name=teamAddress]').val(data.address);
            $('[name=teamTel]').val(data.tel);
            $('.team-admin-combo').populateUserCombo(data.members,data.admin,'teamAdmin');
        }
    );
}

$(function(){
    teamSettings();
    fillTeamSetting();
    teamInvitation();
    $('button[data-loading-text]').click(function(){
        var btn=$(this);
        btn.button('loading');
        setTimeout(function(){
            btn.button('reset');
        },3000);
    });
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
    }).click();
});

function refresh(once) {
    // First fill Forms list, then fill table according to current selected form
    fillPositionsList( function() {
        getTeamInfo( function() {
            $('.colAssignedTo select option').remove();

            for( var i=0; i<teamMembers.length; i++ ){
                var option = $('<option>')
                    .attr('userID',teamMembers[i]._id)
                    .text(teamMembers[i].displayName);
                $('.colAssignedTo select').append( option.clone() );

            }

        });
    });
    fillTable()
    getStat();
    fillAskedForComments();
    fillCalendar();
    fillUserTeams();
    fillTeamSetting();
    if(once==false)
        ;// setTimeout( refresh, 30000 );
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
                .append( $('<a>').attr('applicationID',a4c.applicationID._id).text('this application')
                    .click( function() {
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
                .text(form.formName)
                .click( function() {
                    window.open('/flyer/edit/0?flyerid=' + form.formID);
                });

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

            row.find('.colTitle').html('').append(titleObj);
            row.find('.colStatus').html('').append(stateObj);
            row.find('.colCreator').html('').append(creatorObj);
            row.find('.colAssignedTo').html('').append(assigneeObj);
            //row.find('.colOperations').html('').append(editBtnObj).append(viewBtnObj);

            row.addClass('position').attr('id',form.formID);
            $('.positionsContainer').append( row );
        });

        callback();
    })
}

function fillTable() {

    $('#applicationsTable').html('');
    $('#candidatesCollection .candidate').remove();

    $.get('/api/applications',{
        q: $('.application-searchBox').val(),
        sort: $('.application-sort').attr('sortBy')
    }).done( function(res) {

            for( var i=0; i<res.rows.length; i++ ) {
                var candidateObj = $('#candidateInstance').clone().show().addClass('candidate');
                var candidate = res.rows[i];

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
                candidateObj.find('.askForCommentButton').attr('appID',candidate._id).click( function() {
                    // ToDo: Ask which user should be asked
                    $.post('/api/team/application/askForComment', {
                        applicationID: $(this).attr('appID'),
                        userID: '???'
                    } )
                });

                for( var j=0; j<candidate.activities.length; j++ ) {
                    var activity = candidate.activities[j];
                    var mTimestamp = new moment(activity.timestamp);
                    var timeObj = $('<div>').addClass('activity-time').text( mTimestamp.format('YYYY MMM DD') + '-'+ mTimestamp.fromNow() );
                    var typeObj = $('<div>').addClass('activity-type').text( activity.type );
                    var activityObj = $('<div>').addClass('activity').append(timeObj).append(typeObj);

                    candidateObj.find('.candidate-activities').append( activityObj );
                }

                for( var profile in candidate.profiles )
                    candidate.profiles[ profile ];

                initWorkflow(candidateObj,candidate);
                changeWorkflowStage(candidateObj,candidate, candidate.stage.stage, candidate.stage.subStage );

                $('#candidatesCollection').append( candidateObj );
            }

            $('.candidate .candidate-actions').show();
            $('.candidate .candidate-newComments').hide();
            $('.candidate .candidate-addComment').hide();


            // Search Box
            $('.application-searchBox').unbind('keydown').keydown( function(e) {
                if(e.keyCode==13)
                    $('.application-searchButton').click()
            });

            $('.application-searchButton').unbind('click').click( function() {
                fillTable();
            });

            // Sorting
            $('.application-sort .sortByDate').unbind('click').click( function() {
                $('.application-sort').attr('sortBy','date');
                $('.application-sortType').text('Date');
                fillTable();
            });
            $('.application-sort .sortByName').unbind('click').click( function() {
                $('.application-sort').attr('sortBy','name');
                $('.application-sortType').text('Name');
                fillTable();
            });

            $('.candidate').unbind('click').click( function() {

                var isExpanded = $(this).hasClass('candidate-expanded');

                if( isExpanded==false ){
                    // Deselect Current Selection
                    $('#candidatesCollection .candidate-expanded')
                        .css('clear','none')
                        .removeClass('candidate-expanded')
                        .next()
                        .css('clear','none');

                    $(this).css('clear','both')
                        .addClass('candidate-expanded')
                        .next()
                        .css('clear','both');

                    $('#candidatesCollection .candidate')
                        .filter( function(i,obj) { return !$(obj).hasClass('candidate-expanded') })
                        .css('opacity',0.3);
                    $('#candidatesCollection .candidate-expanded').css('opacity',1)
                }
                else {
                    $(this).css('clear','none')
                        .removeClass('candidate-expanded')
                        .next()
                        .css('clear','none');

                    $('#candidatesCollection .candidate').css('opacity',1);
                }

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

function initWorkflow(candidateObj,candidate) {

    candidateObj.find('.archiveButton').click( function(e) {
        e.stopPropagation();
        gotoNewStage(4,1);
    });

    candidateObj.find('.interviewButton').click( function(e) {
        e.stopPropagation();

        var to = prompt('To:');
        var date = '2015-05-07';
        if( to ) {
            gotoNewStage(2,1,{invitedEmail:to,interviewDate:date});
        }
    });

    candidateObj.find('.offerButton').click( function(e) {
        e.stopPropagation();

        var to = prompt('To:');
        var date = '2015-05-07';
        if( to ) {
            gotoNewStage(3,1,{offeredEmail:to});
        }
    });

    candidateObj.find('.askForCommentButton').click( function(e) {
        e.stopPropagation();
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

    var stages = ['pending', 'interviewing', 'offered', 'archived'];
    stageNo--; // Convert to zero-base index
    subStageNo = subStageNo || 1;

    // Hide all
    candidateObj.find('.candidate-workflow-substage').hide();

    // Show selected stage
    var cssSelector = '.candidate-workflow-stage.' + stages[stageNo] + ' .candidate-workflow-substage[sub-stage=' + subStageNo + ']';
    candidateObj.find(cssSelector).show();

    if( stageNo==1 )
        candidateObj.find('.candidate-workflow-stage.' + stages[1] +' .interviewDate').text( candidate.stage.interviewDate );
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

            var option = $('<option>')
                .attr('name',teamMembers[i]._id)
                .attr('id',teamMembers[i]._id)
                .text(teamMembers[i].displayName);
            $('#teamMembersForAssign').append( option.clone() );
            $('#teamMembersForComment').append( option.clone() );
        }

}

function loadDecisionBox(activity,applicationID) {

    loadWorkflowStage(0,1);
}

function getAvatar(email) {
    var hash = CryptoJS.MD5( email.trim().toLowerCase() );
    return 'http://www.gravatar.com/avatar/' + hash;
}

function getTeamInfo(callback) {
    $.get('/api/team/members').done( function(res){
        $('#teamJobsPage').attr('href','/team/' +  res.team._id + '/jobs')
        $('#teamName').text( res.team.name);
        $('#teamAdmin').text( res.team.admin.email);

        $('#currentTeamName').text( res.team.name);

        if( res.isAdmin===true ) {
            $('#teamNameChange').show();
            $('#teamAdminChange').show();
        }

        teamMembers = res.team.members;

        $('#assignTo').html('');
        $('#teamMembers').html('');
        var userAdmin=res.team.admin._id==res.user;
        for( var i=0; i<res.team.members.length; i++ ){
            var avatarObj = $('<img>').addClass('teamMemberAvatar').attr( 'src', getAvatar(res.team.members[i].email));
            var emailObj = $('<div>').addClass('teamMemberEmail').text(res.team.members[i].displayName);
            var roleObj = $('<div>').addClass('teamMemberRole').text(
                    res.team.members[i]._id==res.team.admin._id ?
                        'Hiring Manager': 'Member');

            var makeAdminObj = $('<div>').attr('userID',res.team.members[i]._id)
                .addClass('teamMemberMakeAdmin btn')
                .hide()
                .text( 'Make Admin')
                .click( function() {
                    $.post('/api/team/admin', {newAdmin: $(this).attr('userID')}).done( function() {
                        $('.teamMemberMakeAdmin').hide();
                        refresh(true)
                    })
                });

            var memberObj = $('<div>').addClass('teamMember')
                .append( avatarObj )
                .append( emailObj )
                .append( userAdmin ? makeAdminObj : '' )
                .append( roleObj );

            $('#teamMembers').append( memberObj );
        }

         $('a[href=#team-settings-dialog]').toggleClass('hide',!userAdmin);
         $('a[href=#team-invitation-dialog]').toggleClass('hide',!userAdmin);
        $('a[href=#team-]').hide();
        $('.teamAddress').html(res.team.address)
        $('.teamPhone').html(res.team.tel);

        callback();
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

function generateMemberElement(member){

    var imgurl = 'http://www.gravatar.com/avatar/'+
        CryptoJS.MD5(member.email)+'?size=50';

    return $('<a>')
        .addClass('bool-user-item')
        .append($('<img>')
            .attr('src',imgurl))
        .append(
            $('<ul>')
                .append($('<li>').append(member.displayName))
                .append($('<li>').append(member.email)
                )
        ).data('member',member);
}
