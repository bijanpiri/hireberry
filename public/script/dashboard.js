/**
 * Created by coybit on 4/28/14.
 */
var teamID = '<%=teamID%>';
var userID = '<%=userID%>';
var teamMembers = [];
var userAdmin = null;
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
function fillAsk4Comment(){
    $('.bool-ask-4-comment-users').populateUserCombo(teamMembers,0,'userID');
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
            fillAsk4Comment();

        });
    });
    fillTable();
    getStat();
    fillAskedForComments();
    fillCalendar();
    fillUserTeams();
    fillTeamSetting();

    if(once==false)
        ;// setTimeout( refresh, 30000 );
}
var badgeNum=0;
function add2NotificationBadge(x){
    badgeNum+=x
    $('#comments_badge').text(badgeNum);
}
function fillAskedForComments() {

    $('#askedForCommentList').empty();
    $.get('/api/user/application/askedForComment').done( function(resApp) {
        var apps = resApp.applications;
        showApplications(apps);
        add2NotificationBadge(apps.length);

    });
    $.get('/api/user/form/askedForComment').done( function(resForm) {
        var A4C_forms = resForm.forms;
        showForms(A4C_forms);
        add2NotificationBadge(resForm.forms.length);
    });
    $.get('/api/user/invitations').done( function(resInvitations) {
        showInvitations(resInvitations);
        add2NotificationBadge(resInvitations.length);
    });
    $.get('/api/user/form/askedForPublish').done( function(askedForPublish) {
        var A4P_forms = askedForPublish;
        showAskedForPublish(A4P_forms);
        add2NotificationBadge( A4P_forms.length);
    });

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

            var assigneeObj = $('<span>')
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

            var settingBtnObj = $('<a>')
                .addClass('fa fa-cogs')
                .attr('href','#')
                .click( function(e) {

                    // Initializing modal fields
                    var modal = $('#job-setting-dialog');

                    // Responder
                    modal.find('#jobResponderList').populateUserCombo(teamMembers, form.autoAssignedTo,'jobResponder');

                    // Public links & Social networks button
                    var publicLink = window.location.origin + '/flyer/embeded/' + form.formID;
                    modal.find('.publicLink').val(publicLink);

                    // Current Status
                    modal.find('.jobStatus-current').text(form.mode);
                    modal.find('.jobStatus-next').empty();
                    var publishOption = $('<button>').attr('name','publish').text('Publish').click( function() {
                        changeJobMode('publish')
                    });
                    var draftOption = $('<button>').attr('name','draft').text('Draft').click( function() {
                        changeJobMode('draft')
                    });;
                    var askForPublishOption = $('<button>').attr('name','askForPublish').text('Ask for publish').click( function() {
                        changeJobMode('ask for publish')
                    });;

                    // ToDo: Use enumeration instead of string for comparing
                    var mode = form.mode.toLocaleLowerCase();
                    if( userAdmin ) {
                        if(mode==='published')
                            modal.find('.jobStatus-next').append(draftOption)// Draft
                        else
                            modal.find('.jobStatus-next').append(publishOption) // Publish
                    }
                    else {
                        if(mode==='published' || mode==='asked for publish')
                            modal.find('.jobStatus-next').append(draftOption) // Draft
                        else
                            modal.find('.jobStatus-next').append(askForPublishOption) // Ask For Publish
                    }

                    function changeJobMode(mode) {
                        $.post('/flyer/changeMode',{mode:mode,flyerID:form.formID});
                    }

                    modal.find('.saveButton').click( function() {
                        var responderID = $('[name=jobResponder]').val();
                        $.post('/api/team/form/assign',{formID:form.formID,userID:responderID}).done( function() {});
                        modal.modal('hide')
                    })

                    modal.modal();

                    e.stopPropagation();
                });

            var editBtnObj = $('<a>')
                .addClass('fa fa-pencil-square-o')
                .attr('href','/flyer/edit/0?flyerid=' + form.formID);

            var viewBtnObj = $('<a>')
                .addClass('fa fa-eye')
                .attr('href','/flyer/embeded/' + form.formID);

            row.find('.colTitle').html('').append(titleObj);
            row.find('.colStatus').html('').append(stateObj);
            row.find('.colAssignedTo').html('').append(assigneeObj);
            row.find('.colOperations').html('').append(settingBtnObj);

            row.addClass('position').attr('id',form.formID).click( function() {
                window.open('/flyer/edit/0?flyerid=' + form.formID);
            });
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
                candidateObj.find('[name="appID"]').val(candidate._id);
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

            $('.bool-toggle-application').unbind('click').click( function() {
                var candidateSection=$(this).closest('.candidate');

                var isExpanded = candidateSection.hasClass('candidate-expanded');

                if(!candidateSection.commentFetched){
                    $.get('/api/application/comments',{appID:candidate._id},function(data){
                        var comments=data.comments;

                        comments.forEach(function(comment){
                            var form=$('.reply-for-comment-form:first').clone().show();

                            candidateSection.find('.bool-application-comments').append(form);

                            form.find('.user-note-avatar')
                                .replaceWith(generateMemberElement(comment.user,true,false));
                            form.find('.commenter-note-avatar')
                                .replaceWith(generateMemberElement(comment.commenter,true,false));
                            form.find('.bool-application-comments-note').html(comment.note);

                        })

                        candidateSection.commentFetched=true;
                    })
                }

                if(!isExpanded ){
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
                offerMessage:  modal.find('.offerMessage').val()
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


        teamMembers = res.team.members;
        $('#assignTo').empty();
        $('#teamMembers').empty();
        userAdmin = res.team.admin._id==res.user;
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



