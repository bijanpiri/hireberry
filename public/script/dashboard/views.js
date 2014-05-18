/**
 * Created by coybit on 5/17/14.
 */
BStatView = Backbone.View.extend({
    el: $('.statisticsRow'),
    initialize: function() {
        this.model.on('change', this.render, this);
    },
    render: function() {
        $('.statisticsRow #numForms').text( this.model.get("numForms") )
        $('.statisticsRow #numApplications').text( this.model.get("numApplications") )
        $('.statisticsRow #numNewApplications').text( this.model.get("numNewApplications") )
        $('.statisticsRow #numTodayApplications').text( this.model.get("numTodayApplications") )
        return this;
    }
});
statView = new BStatView({model:stat});

BCalendarView = Backbone.View.extend({
    el: $('#full-clndr'),
    initialize: function() {
        this.model.on('change', this.render, this);
    },
    render: function() {
        // Event Format: [{ date: '2014-04-01', title: 'Persian Kitten Auction', location: 'Center for Beautiful Cats' } ]
        var eventsList = this.model.get('events').map( function(event) {
            var m = new moment(event.time);

            return {
                date: m.format('YYYY-MM-DD'),
                title: (event.title || 'Event'),
                location:  m.format('DD MMM[,] ddd')  + ' ( ' + m.fromNow() + ' ) '
            };
        });

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
        return this;
    }
});
calendarView = new BCalendarView({model:calendar});

BApplicationsView = Backbone.View.extend({
    el: $(''),
    initialize: function() {
        this.model.on('change', this.render, this);
    },
    render: function() {
        var candidates = this.model.get('candidates');
        var stagesName = ['pending','interviewing','offering','archived'];

        $('#candidatesCollection .candidate').remove();

        for( var i=0; i<candidates.length; i++ ) {
            var candidate = candidates[i];
            var candidateObj = $('#candidateInstance')
                .clone().show()
                .addClass('candidate')
                .data('candidate',candidate);

            candidateObj.find('.candidate-avatar').css('background-image','url("'+candidate.avatarURL+'")');
            candidateObj.find('.candidate-name').text(candidate.name);
            candidateObj.find('.candidate-job .value').text(candidate.position);
            candidateObj.find('.candidate-time .value').text(candidate.applyTime);
            candidateObj.find('.candidate-stage .value').text(candidate.stage.stage);
            candidateObj.find('.candidate-skills .value').text(candidate.skills);
            candidateObj.find('.candidate-conditions .value').text((candidate.workTime||'') + (candidate.workPlace ? ' @' + candidate.workPlace : '') );
            candidateObj.find('.candidate-coverLetter').text(candidate.anythingelse);
            candidateObj.find('.candidate-email .value').text(candidate.email);
            candidateObj.find('.candidate-tel .value').text(candidate.tel);
            candidateObj.find('.candidate-website .value').text(candidate.website);
            candidateObj.find('[name="appID"]').val(candidate._id);
            candidateObj.find('.applicationAskForCommentButton').click( function() {
                $('#a4c-dialog').find('[name=appID]').val(candidate._id);
                $('#a4c-dialog').modal('show');
            })
            if( candidate.resumePath )
                candidateObj.find('.candidate-resume').attr('href', candidate.resumePath );
            else
                candidateObj.find('.candidate-resume').remove();

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

                var mTimestamp = new moment(activity.timestamp);
                var timeObj = $('<div>').addClass('activity-time').text( mTimestamp.format('YYYY MMM DD') + '-'+ mTimestamp.fromNow() );
                var typeObj = $('<div>').addClass('activity-type').text( stageChangingDetails || activity.type );
                var stoneObj = $('<div>').addClass('activity-stone');
                var activityObj = $('<div>').addClass('activity').append(stoneObj).append(timeObj).append(typeObj);

                candidateObj.find('.candidate-activities').append( activityObj );
            }

            // Profiles
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

            candidateObj.addClass('candidate-filter-' + stagesName[candidate.stage.stage]);

            initWorkflow(candidateObj,candidate);
            changeWorkflowStage(candidateObj,candidate, candidate.stage.stage, candidate.stage.subStage );

            $('#candidatesCollection').append( candidateObj );
        }

        return this;
    }
});
applicationsView = new BApplicationsView({model:applications});

BJobsView = Backbone.View.extend({
    el: $(''),
    initialize: function() {
        this.model.on('change', this.render, this);
    },
    render: function() {

        forms = this.model.get('forms');

        $('#jobsp .position').remove();

        forms.forEach( function(form) {
            var row = $('#jobsp .positionsHeaderRow')
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
                .click( function(e) {

                    // Initializing modal fields
                    var modal = $('#job-setting-dialog');
                    var flyer;

                    $.get('/flyer/0/json/'+form.formID)
                        .done(function(data){
                            flyer = data;

                            modal.find('#jobTitle').val( data.description );
                            modal.find('#jobThanksMessage').val( data.thanksMessage );
                        });

                    // Responder
                    modal.find('#jobResponderList').populateUserCombo(teamMembers, form.autoAssignedTo,'jobResponder');

                    // Public links & Social networks button
                    var publicLink = window.location.origin + '/flyer/embeded/' + form.formID;
                    modal.find('.publicLink').val(publicLink);
                    modal.find('.publicLinkOpener').attr('href',publicLink);

                    // Delete
                    modal.find('.deleteJobButton').click( function() {
                        $.ajax({
                            url: '/api/job/' + form.formID,
                            type: 'DELETE',
                            success: function() {
                                refresh();
                                modal.modal('hide');
                            }
                        });
                    });


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
                        $.post('/flyer/changeMode',{mode:mode,flyerID:form.formID}).done( function() {
                            jobs.fetch();
                            modal.modal('hide');
                        });
                    }

                    modal.find('.saveButton').click( function() {
                        var responderID = $('[name=jobResponder]').val();
                        $.post('/api/team/form/assign',{formID:form.formID,userID:responderID}).done( function() {});

                        flyer.description = modal.find('#jobTitle').val();
                        flyer.thanksMessage = modal.find('#jobThanksMessage').val();

                        $.post('/flyer/save',{flyer:flyer});

                        modal.modal('hide');

                        jobs.fetch();
                    })

                    modal.modal();

                    e.stopPropagation();
                });

            row.find('.colTitle').empty().append(titleObj);
            row.find('.colStatus').empty().append(stateObj);
            row.find('.colAssignedTo').empty().append(assigneeObj);
            row.find('.colOperations').empty().append(settingBtnObj);

            row.addClass('position').attr('id',form.formID).click( function() {
                window.open('/flyer/edit/0?flyerid=' + form.formID);
            });

            $('#jobsp').append( row );
        });
    }
})
jobsView = new BJobsView({model:jobs});

BTeamsView = Backbone.View.extend({
    el: $(''),
    initialize: function() {
        this.model.on('change', this.render, this);
    },
    render: function() {
        // Fill teams list
        $('#userTeams').empty();
        this.model.get('teams').forEach( function(team) {
            $('#userTeams').append( $('<option>').text(team.name).attr('name',team._id) );
        });
    }
})
teamsView = new BTeamsView({model:teams});

BTeamView = Backbone.View.extend({
    el: $(''),
    initialize: function() {
        this.model.on('change', this.render, this);
    },
    render: function() {
        var members = this.model.get('members');
        var info = team.get('info');
        var invitedMembers = team.get('invited');
        var currentUser = team.get('user');
        var teamAdmin = team.get('admin');
        userAdmin = (teamAdmin._id==currentUser);

        teamMembers = members;

        // Init Team Setting Modal
        $('[name=teamAdmin]').val(teamAdmin._id);
        $('[name=teamName]').val(info.name);
        $('[name=teamAddress]').val(info.address);
        $('[name=teamTel]').val(info.tel);
        $('.team-admin-combo').populateUserCombo(members, teamAdmin, 'teamAdmin');

        // Init team page
        $('#teamJobsPage').attr('href','/team/' +  info.id + '/jobs')
        $('#teamName').text( info.name);
        $('#teamAdmin').text( teamAdmin.email);
        $('#currentTeamName').text( info.name );

        // Fill members list
        $('#teamMembers').empty();
        for( var i=0; i<members.length; i++ ){
            var avatarObj = $('<img>').addClass('teamMemberAvatar').attr( 'src', getAvatar(members[i].email));
            var nameObj = $('<div>').addClass('teamMemberName').text(members[i].displayName);
            var emailObj = $('<span>').addClass('teamMemberEmail').text('(' + members[i].email + ')');

            var roleObj = $('<div>').addClass('teamMemberRole').text(
                members[i]._id == teamAdmin._id ? 'Hiring Manager': 'Member');

            var memberObj = $('<div>').addClass('teamMember')
                .append( avatarObj )
                .append( nameObj )
                .append( emailObj )
                .append( roleObj );

            $('#teamMembers').append( memberObj );
        }

        $('a[href=#team-settings-dialog]').toggleClass('hide',!userAdmin);
        $('a[href=#team-invitation-dialog]').toggleClass('hide',!userAdmin);
        $('a[href=#team-]').hide();
        $('.teamAddress').html(info.address)
        $('.teamPhone').html(info.tel);
        $('.bool-ask-4-comment-users').populateUserCombo(teamMembers,0,'userID');
    }
})
teamView = new BTeamView({model:team});

BBillingView = Backbone.View.extend({
    el: $(''),
    initialize: function() {
        this.model.on('change', this.render, this);
    },
    render: function() {
        var billing = this.model.get('billing');
        var plan = (billing.plan==0) ? 'Free' : 'Premium';

        $('#billing_plan').text( plan + '(' + (new moment(billing.lastRenew)).fromNow() + ')' );
        $('#billing_balance span').text( billing.balance );

        if( billing.plan == 0 ) {
            $('#freePlanButton').hide();
            $('#premiumPlanButton').show();
        } else {
            $('#freePlanButton').show();
            $('#premiumPlanButton').hide();
        }

        $('#billingsList').empty();

        for( var i=0; i<billing.billings.length; i++ ) {
            var date = new Date(billing.billings[i].time);

            var billingRow = $('<div>')
                .append( $('<span>').text(date.toLocaleDateString()))
                .append( $('<span>').text(billing.billings[i].amount))
                .append( $('<span>').text(billing.billings[i].state));

            $('#billingsList').append( billingRow );
        }
    }
})
billingView = new BBillingView({model:billing});

