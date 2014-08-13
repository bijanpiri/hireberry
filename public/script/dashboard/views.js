/**
 * Created by coybit on 5/17/14.
 */
BStatView = Backbone.View.extend({
    el: $('.statisticsRow'),
    initialize: function() {
        this.model.on('change', this.render, this);
    },
    render: function() {
        $('.statisticsRow #statValue1').text( this.model.get("numForms") );
        $('.statisticsRow #statValue4').text( this.model.get("numTeamMembers") );
        $('.statisticsRow #statValue2').text( this.model.get("numPublished") );
        $('.statisticsRow #statValue3').text( this.model.get("numApplications") );

        $('.fetching-overview').hide();

        return this;
    }
});
statView = new BStatView({model:stat});

BCalendarView = Backbone.View.extend({
    el: $('#full-clndr'),
    initialize: function() {
        this.model.on('change', this.render, this);

        $(function(){
            var calendarObj = $('#full-clndr').clone().addClass('current-calendar');
            calendarObj.clndr({
                template: $('#full-clndr-template').html(),
                events:  []
            });
            $('#full-clndr').parent().append( calendarObj.show() );
        });

    },
    render: function() {
        // Event Format: [{ date: '2014-04-01', title: 'Persian Kitten Auction', location: 'Center for Beautiful Cats' } ]
        var eventsList = this.model.get('events').map( function(event) {
            var m = new moment(event.time);
            var dt = dateTimeToJSON(event.time);

            return {
                date: m.format('YYYY-MM-DD'),
                title: '<a class="eventTitle" href="' + event.application._id + '">' + (event.title || 'Event') + '</a>',
                location:  dt.shortStyle
            };
        }).sort( function(a,b){
                return (new Date(a.date)).getTime()-(new Date(b.date)).getTime()
            });

        // Create an instance of clndr and show it
        var calendarObj = $('#full-clndr').clone().addClass('current-calendar');
        calendarObj.clndr({
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
                calendarObj.find('.eventTitle').click( function(e) {
                    GAEvent('Dashboard','ApplicationView','From Calendar');
                    showApplicationPreview( $(this).attr('href') );
                    e.preventDefault();
                });
            }
        });
        $('#full-clndr').parent().find('.current-calendar').remove();
        $('#full-clndr').parent().append( calendarObj.show() );

        $('.fetching-overview').hide();

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

        $('#application-filter-all').prop('checked',true);

        var stagesCounter = [0,0,0,0,0]; // total, pending, interview, offered, archived

        $.get('/api/applications?d=true').done( function(res) {

            for( var i=0; i<res.candidates.length; i++ ) {
                var candidate = res.candidates[i].application;

                // Because result return back synchronize, so order will not be hold
                var placeHolderObj = $('<div>');
                $('#candidatesCollection').append( placeHolderObj );

                //
                var candidateInstance = initCandidateInstance(candidate,false);
                placeHolderObj.replaceWith(candidateInstance);

                // Count number of applicant at each stage
                stagesCounter[0]++;
                stagesCounter[candidate.stage.stage]++;
            }

            afterFetchingApplciation();
        });

        function afterFetchingApplciation() {
            // Show number of applications in each stage
            $('#applications-filters label').each( function(i,e){
                var countObj =  $('<span>').text( '(' + stagesCounter[i] + ')' );
                $(e).find('span').remove();
                $(e).append( countObj );
            }).click( function() {
                    GAEvent('Dashboard','Applications','Stage Filter - ' + $(this).attr('for') );
                });

            $('.fetching-applications').hide();
        }

        // Show Empty State, if it is needed
        if( candidates.length==0 && this.model.get('allowToShowEmptyState') == true ){
            $('#applicationsp > div').hide();
            $('.applications-empty-state').show();
        } else {
            //$('#applicationsp > div').show();
            //$('.applications-empty-state').hide();
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
        $('.applications-filter-job').empty();
        $('.applications-filter-job').append( $('<option>').text('All Job(s)').attr('formID',0) );

        forms.forEach( function(form) {

            var jobOptionObj = $('<option>').text(form.formName).attr('formID',form.formID);
            $('.applications-filter-job').append( jobOptionObj.clone() );
            $('#new-applicant-dialog .jobsList').append( jobOptionObj.clone() );

            // Trick
            if(form.mode==='drafted')
                form.mode = 'Inactive';

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

                    GAEvent('Dashboard','Job','Open Setting');

                    // Initializing modal fields
                    var modal = $('#job-setting-dialog');
                    var flyer;
                    var commentators = [];

                    $.get('/flyer/0/json/'+form.formID)
                        .done(function(data){
                            flyer = data.flyer;
                            commentators = data.commentators.map( function(c){return c._id} );

                            modal.find('#jobTitle').val( flyer.description );
                        });

                    // Responder
                    modal.find('#jobResponderList').populateUserCombo(teamMembers, form.autoAssignedTo,'jobResponder');

                    // Public links & Social networks button
                    var publicLink = window.location.origin + '/flyer/embeded/' + form.formID;
                    modal.find('.publicLink').val(publicLink);
                    modal.find('.publicLinkOpener').attr('href',publicLink).click( function() {
                        GAEvent('Dashboard','Job','Setting - Open');
                    });

                    // Delete
                    modal.find('.deleteJobButton').click( function() {
                        GAEvent('Dashboard','Job','Setting - Delete');
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
                        GAEvent('Dashboard','Job','Setting - To publish');
                        changeJobMode('publish')
                    });
                    var draftOption = $('<button>').attr('name','draft').text('Inactive').click( function() {
                        GAEvent('Dashboard','Job','Setting - To inactive');
                        changeJobMode('draft');
                    });
                    var askForPublishOption = $('<button>').attr('name','askForPublish').text('Ask for publish').click( function() {
                        changeJobMode('ask for publish')
                    });

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

                    modal.find('#jobApplyByEmail-address').val(form.formID + '@mail.hireberry.com');

                    function changeJobMode(mode) {
                        $.post('/flyer/changeMode',{mode:mode,flyerID:form.formID}).done( function(res) {
                            jobs.fetch();
                            modal.modal('hide');
                        }).fail( function(res){
                                alert(res.responseText);
                            });
                    }

                    modal.find('.saveButton').unbind('click').click( function() {
                        var responderID = $('[name=jobResponder]').val();

                        flyer.description = modal.find('#jobTitle').val();

                        $.post('/flyer/save',{
                            flyer: flyer,
                            responder: responderID,
                            commentators: commentators // Now user can't change commentators in setting modal
                        });

                        modal.modal('hide');

                        jobs.fetch();
                    })

                    modal.modal();

                    e.stopPropagation();
                });


            var PromoteBtnObj = $('<a>')
                .addClass('fa fa-paper-plane')
                .click( function(e) {
                    GAEvent('Dashboard','Job','Open Promote');

                    window.location = '/flyer/promote/0/' + form.formID;
                    e.stopPropagation();
                });

            var commentBtnObj = $('<i>')
                .addClass('fa fa-comments');

            row.find('.colTitle').empty().append(titleObj);
            row.find('.colStatus').empty().append(stateObj);
            row.find('.colAssignedTo').empty().append(assigneeObj);

            if( form.edit ) {
                row.find('.colOperations').empty().append(settingBtnObj);
                row.find('.colPromote').empty().append(PromoteBtnObj);
            }
            else if( form.comment )
                row.find('.colOperations').empty().append(commentBtnObj);


            row.addClass('position').attr('id',form.formID).click( function() {
                GAEvent('Dashboard','Job','Open Editor');
                window.open('/flyer/edit/0?flyerid=' + form.formID);
            });

            $('.positionsRow').append( row );
        });

        if( forms.length == 0 ){
            $('#jobsp > div').hide();
            $('.jobs-empty-state, .career-info').show();
        }

        $('.fetching-jobs').hide();
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

        if( this.model.get('teams').length <= 1 )
            $('#switchButton').hide();
        else
            $('#switchButton').show();
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
        $('#teamJobsPage').attr('href','/editor/careerpage/' +  info.id);
        $('#teamJobsPagePublic').attr('href','/view/careerpage/' +  info.id);
        $('#teamName').text( info.name);
        $('#teamAdmin').text( teamAdmin.email);
        $('.currentTeamName').text( info.name );

        // Fill members list
        $('#teamMembers').empty();
        for( var i=0; i<members.length; i++ ){
            var avatarObj = $('<img>').addClass('teamMemberAvatar').width(30).height(30).attr( 'src', getAvatar(members[i].email));
            var nameObj = $('<div>').addClass('teamMemberName').text(members[i].displayName);
            var emailObj = $('<span>').addClass('teamMemberEmail').text('(' + members[i].email + ')');

            var roleObj = $('<div>').addClass('teamMemberRole').text(members[i]._id === teamAdmin._id ? 'Hiring Manager': 'Member');

            var removeButtonObj = '';
            if(userAdmin && members[i]._id !== teamAdmin._id) {
                removeButtonObj = $('<a>')
                    .addClass('btn btn-danger btn-mini team-disjoint-button')
                    .text('Remove')
                    .attr('userID',members[i]._id)
                    .click( function() {
                        GAEvent('Dashboard','Team','Remove Member');

                        if( confirm('Are you sure?') ){
                            $.post('/api/team/member/remove',{ userID: $(this).attr('userID') }).done( function() {
                            refresh();
                        })
                        }
                    });
            }

            var memberObj = $('<div>').addClass('teamMember')
                .append( avatarObj )
                .append( nameObj )
                .append( emailObj )
                .append( removeButtonObj )
                .append( roleObj )
                .mouseenter( function() {
                    memberObj.find('team-disjoint-button').show();
                })
                .mouseleave( function() {
                    memberObj.find('team-disjoint-button').hide();
                });

            $('#teamMembers').append( memberObj );
        }

        $('a[href=#team-settings-dialog]').toggleClass('hide',!userAdmin);
        $('a[href=#team-invitation-dialog]').toggleClass('hide',!userAdmin);
        $('a[href=#team-]').hide();
        $('.teamAddress').html(info.address)
        $('.teamPhone').html(info.tel);
        $('.bool-ask-4-comment-users').populateUserCombo(teamMembers,0,'userID');

        if(userAdmin) {
            $('label[for="radio-item-billing"]').show();
            $('.team-setting-btn, .team-invite-btn').show();
        }
        else {
            $('label[for="radio-item-billing"]').remove();
            $('input#radio-item-billing').remove();
            $('#billingp').remove();
            $('.team-setting-btn, .team-invite-btn').hide();
        }

        $('.fetching-team').hide();
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
        var plan = (billing.plan==0) ? 'Freeberry' : 'Goldberry';

        if( billing.autoDowngraded ){
            $('.billing-notification').show();
            $('.billing-notification button').unbind('click').click( function() {

                $.post('/api/billing/turnoff-alert').done( function() {
                    $('.billing-notification').hide();
                });

            });
        }
        else {
            $('.billing-notification').hide();
        }

        $('#current-plan').text( plan );
        $('#billing_balance span').text( billing.balance );
        $('.plan-age').text( '(From ' + dateTimeToJSON(billing.lastRenew).from +')');

        if( billing.plan == 0 ) {
            $('#freePlanButton').hide();
            $('#premiumPlanButton').show();
        } else {
            $('#freePlanButton').show();
            $('#premiumPlanButton').hide();
        }

        $('#billingsList tbody').empty();

        for( var i=0; i<billing.billings.length; i++ ) {
            var date = new Date(billing.billings[i].time);
            var dt = dateTimeToJSON(date);
            var amount = billing.billings[i].amount;

            var billingRow = $('<tr>')
                .append( $('<td>').text(dt.fullStyle))
                .append( $('<td>').text( (amount<0?'-':'+') + ' $ ' + Math.abs(amount) ))
                .append( $('<td>').text(billing.billings[i].method));

            $('#billingsList tbody').append( billingRow );
        }

        $('.fetching-billing').hide();
    }
})
billingView = new BBillingView({model:billing});

