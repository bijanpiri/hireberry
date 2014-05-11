/**
 * Created by Bijan on 05/10/2014.
 */
function fillApplications() {

    $('#applicationsTable').empty();
    $('#candidatesCollection .candidate').remove();

    $.get('/api/applications',{
        q: $('.application-searchBox').val(),
        sort: $('.application-sort').attr('sortBy')
    }).done( function(res) {

            for( var i=0; i<res.rows.length; i++ ) {
                var candidate = res.rows[i];
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
                candidateObj.find('.candidate-conditions .value').text(candidate.workTime + ' @' + candidate.workPlace);
                candidateObj.find('.candidate-coverLetter').text(candidate.anythingelse);
                candidateObj.find('.candidate-email .value').text(candidate.email);
                candidateObj.find('.candidate-tel .value').text(candidate.tel);
                candidateObj.find('.candidate-website .value').text(candidate.website);
                candidateObj.find('.candidate-resume').attr('href','/api/resume?f=' + decodeURI(candidate.resumePath) );
                candidateObj.find('[name="appID"]').val(candidate._id);
                candidateObj.find('.applicationAskForCommentButton').click( function() {
                    $('#a4c-dialog').find('[name=appID]').val(candidate._id);
                    $('#a4c-dialog').modal('show');
                })

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


            // Ask For Comment Modal

            // Search Box
            $('.application-searchBox').unbind('keydown').keydown( function(e) {
                if(e.keyCode==13)
                    $('.application-searchButton').click()
            });

            $('.application-searchButton').unbind('click').click( function() {
                fillApplications();
            });

            // Sorting
            $('.application-sort .sortByDate').unbind('click').click( function() {
                $('.application-sort').attr('sortBy','date');
                $('.application-sortType').text('Date');
                fillApplications();
            });
            $('.application-sort .sortByName').unbind('click').click( function() {
                $('.application-sort').attr('sortBy','name');
                $('.application-sortType').text('Name');
                fillApplications();
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