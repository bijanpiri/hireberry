/**
 * Created by Bijan on 05/10/2014.
 */
function fillPositionsList( callback ) {

    $.get('/api/forms?teamID=' + teamID).done( function(res) {

        forms = res.forms;

        $('#jobsp .position').remove();

        res.forms.forEach( function(form) {
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

                        flyer.description = modal.find('#jobTitle').val();
                        flyer.thanksMessage = modal.find('#jobThanksMessage').val();

                        $.post('/flyer/save',{flyer:flyer});

                        modal.modal('hide');

                        fillPositionsList();
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

        callback();
    })
}