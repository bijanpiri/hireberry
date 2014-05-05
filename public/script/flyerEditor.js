/**
 * Created by Bijan on 04/20/2014.
 */
var flyer;
var flyerid;
var newFlyerName;
var previewWindow = 0;
var dialog_confirm=$('<div id="dialog-confirm"  title="Remove"> <p id="contentholder"> Are you sure?</p></div>').hide();
dialog_confirm.appendTo('body');
var autosaveTimer;
var autosaveInterval = 60*1000;
var teamMembers = [];

$(function() {
    $('form').submit(false);

    if( viewMode=='embeded') {
        // Hidden bars
        $('nav').remove();
        $('#fixToolbar').remove();
        $('body > .container-fluid').css('margin-top','1em');
    }

    if( editMode ) {
        $(document.body).addClass('bool-edit-mode');

        if( existFlyer )
            loadEditor();
        else
            loadTemplateChooser();
    }
    else {
        $('.flyerRow').show();
        loadFlyer();

        // Resume uploading handling
        $('#dropzone').click(function(){
            $('#resumefile').click();
        })
        document.getElementById('resumefile').onchange = function () {
            $('#dropzone').html('Your Résumé :<br/>' + this.value.replace(/^.*[\\\/]/, ''));
        };
        function getDoc(frame) {
            var doc = null;

            // IE8 cascading access check
            try {
                if (frame.contentWindow) {
                    doc = frame.contentWindow.document;
                }
            } catch(err) {
            }

            if (doc) { // successful getting content
                return doc;
            }

            try { // simply checking may throw in ie8 under ssl or mismatched protocol
                doc = frame.contentDocument ? frame.contentDocument : frame.document;
            } catch(err) {
                // last attempt
                doc = frame.document;
            }
            return doc;
        }

        $("#submit_btn").click(function(e) {

            /*
             // Name
             if( $('#name').val().length == 0 ){
             $('.error').show().html('Please enter your name');
             e.preventDefault();
             return false;
             }

             // Email
             if(validateEmail( $('#email').val() )==false){
             $('.error').show().html('Please enter a valid email address');
             e.preventDefault();
             return false;
             }
             */

            $('.error').hide();

            var form = document.getElementById('applyForm');
            var formObj = $('#applyForm');
            var formURL = formObj.attr("action");

            if(window.FormData !== undefined)  // for HTML5 browsers
            {
                var formData = new FormData( form );
                $.ajax({
                    url: formURL,
                    type: 'POST',
                    data:  formData,
                    mimeType:"multipart/form-data",
                    contentType: false,
                    cache: false,
                    processData:false,
                    success: function(data, textStatus, jqXHR) {
                        $('.portlet-container').hide();
                        $('.portletSubmittion').hide();
                        $('.portletThanksMessage').show();
                    },
                    error: function(jqXHR, textStatus, errorThrown) {

                    }
                });
                e.preventDefault();
                $('.applyNowButton').val('Sending...').attr('disabled','disabled');
            }
            else  //for olden browsers
            {
                //generate a random id
                var  iframeId = 'unique' + (new Date().getTime());

                //create an empty iframe
                var iframe = $('<iframe src="javascript:false;" name="'+iframeId+'" />');

                //hide it
                iframe.hide();

                //set form target to iframe
                formObj.attr('target',iframeId);

                //Add iframe to body
                iframe.appendTo('body');
                iframe.load(function(e)
                {
                    var doc = getDoc(iframe[0]);
                    var docRoot = doc.body ? doc.body : doc.documentElement;
                    var data = docRoot.innerHTML;

                    //data is returned from server.
                });
            }
        });
    }

    initCommentView();
});

function loadFlyer() {

    flyerid = $('input[name=flyerid]').val();
    flyer = $('.portletStack').Flyer({
        editMode: editMode,
        flyerid: flyerid,
        templateID: templateID
    });
}

function loadTemplateChooser() {

    $('.thumbnail').unbind('click').click(function(){
        // Deselect old selected item
        if( selectedThumbID )
            $('.thumbnail[thumbnailID='+ selectedThumbID +']').removeClass('selected');

        // Select recent selected item
        selectedThumbID = $(this).attr('thumbnailID');
        $(this).find('img').first().addClass('selected');

        $('.thumbnailPreview').find('.caption').text( $(this).attr('caption') );
        $('.thumbnailPreview').find('.description').text( $(this).attr('description') );
    }) ;

    $('.templateRow').show();
    $('#GoToEditor').click( function() {

        newFlyerName = $('#flyerName1').val();

        if( newFlyerName.length === 0 )
            newFlyerName = 'Untitled - ' + (new Date()).toDateString();

        loadEditor();
    })

}

function initCommentView() {

    // ToDo: Manage comment view permission
    var canViewComments = true;

    // Get Comments
    if( canViewComments ) {
        $.get('/api/form/comments', {formID:flyerid}).done( function(res){

            $('.portlet-comments').html('');

            if( res.comments.length == 0 )
                $('.portlet-comments').text('There is no comments.')
            else {
                res.comments.forEach( function(comment) {

                    if( comment.commentTime.length > 0 ) {

                        var commentObj = $('<div>').addClass('portlet-comment');
                        commentObj.append( $('<div>').addClass('commentNote').text('Asked: ' +  comment.note) );
                        commentObj.append( $('<div>').addClass('commentTime').text( 'At ' + (new Date(comment.askingTime)).toLocaleString()) );
                        commentObj.append( $('<div>').addClass('commenter').text(comment.commenter.email + "'s comment:") );
                        commentObj.append( $('<div>').addClass('commentBody').text(comment.comment) );
                        commentObj.append( $('<div>').addClass('commentTime').text( 'At ' + (new Date(comment.commentTime)).toLocaleString()) );

                        $('.portlet-comments').append( commentObj );
                    }
                });
            }
        });
    }

    $.get('/api/user/form/askedForComment').done( function(resForm){

        $('.portlet-askedForComment-list').html('');

        if( resForm.forms.length == 0 )
            $('.portlet-askedForComment-list').text('There is no "Asked For Comment" request.');
        else {
            resForm.forms.forEach( function(a4c) {

                if( a4c.formID._id == flyerid ) {
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
                                });
                        });

                    $('.portlet-askedForComment-list').append( $('<li>').attr('id',objID)
                        .append(dateObj)
                        .append(titleObj)
                        .append(textAreaObj)
                        .append(sendBtnObj) );
                }
            });
        }

    });

    $('#buttonComment').click( function() {
        $('.portlet-comments').toggle();
        $('.portlet-askedForComment-list').toggle();

        var isVisible = !($('.portlet-comments').css('display')==='none');

        $('#buttonComment').text( isVisible ? 'Hide comments' : 'Show Comments' )
    })
}

function loadEditor() {

    $('.templateRow').hide();
    $('.flyerRow').show();
    $('#fixToolbar').show();
    $('#buttonEditview').hide();

    loadFlyer();

    $('#buttonPublish').click( function() {
        loadPublishPanel();
    })

    $('#plusButton').click(function(){
        $('#plusButton').hide();
        $('#addButtons').show();
    });

    $('.closeButton').click(function(){
        $('#plusButton').show();
        $('#addButtons').hide();
    });

    // Saving flyer methods
    autosaveTimer = setTimeout(saveFlyer,autosaveInterval);
    $('#buttonSave').click(function(){
        saveFlyer();
    });

    // Logo uploading handling
    var logoInput = $('input.logofile');
    $(document).delegate('.portletHeader .logo','mousedown',function(){
        if(editMode)
            logoInput.click();
    });

    logoInput.fileupload({
        url:'/flyer/upload',
        dataType: 'json',
        replaceFileInput:false,
        dropZone:$('.portletHeader .logo'),
        done: function (e, data) {
            flyer.setLogo( '/uploads/' + data.result.files[0].name , true );
        }
    });
}

function GoToEditMode() {
    $(document.body).addClass('bool-edit-mode');
    showLoading();

    $('#buttonPreview').show();
    $('#buttonSave').show();
    $('#buttonPublish').show();
    $('#buttonEditview').hide();
    $('.portletCreator').show().animate({height:100},500);

    setTimeout(function(){
        hideLoading()
        $('#previewFrame iframe').remove();
        $('#previewFrame').hide();
        $('.flyerRow').show();
    }, 1000);

};

function GoToViewMode() {
    $(document.body).removeClass('bool-edit-mode')
    var height = $('#portletsBox').height();

    showLoading();

    $('#buttonPreview').hide();
    $('#buttonSave').hide();
    $('#buttonPublish').hide();
    $('#buttonEditview').show();
    $('.portletCreator').animate({height:0},500, function(){$(this).hide()});

    // ToDo: Do a better work when saving is faild (before shwoing preview)
    saveFlyer( function(saveSuccessfuly) {
        var flyerid = $('input[name=flyerid]').val();
        var iframe = $('<iframe>')
            .attr('src','/flyer/embeded/' + flyerid)
            .attr('frameborder','0')
            .attr('width','100%')
            .attr('scrolling','no')
            .attr('height', height )
            .attr('hidden','hidden')
            .load( function() {

                hideLoading();
                $('.flyerRow').hide();
                iframe.show();

            });

        $('#previewFrame').show();
        $('#previewFrame').append( iframe );

        /*
         if( previewWindow.window==null || previewWindow==0 )
         previewWindow = window.open('/flyer/view/0?flyerid=' + flyerid);
         else
         previewWindow.location = '/flyer/view/0?flyerid=' + flyerid;
         */
    })
};

function showLoading() {
    var content = $('<div>').addClass('loadingContent')
        .text('Please Wait ...');
    var loading = $('<div>').addClass('loading')
        .append( content )
        .height( $(document).height() );

    $('.loading').remove();

    $(document.body).append(loading);
}

function hideLoading() {
    $('.loading').remove();
}

function loadPublishPanel() {
    $('.flyerRow').hide();
    $('.publishRow').show();
    $('#fixToolbar').hide();

    var flyerJson = flyer.flyer2json();

    if( existFlyer )
        $('#flyerName2').val( flyer.description );
    else
        $('#flyerName2').val( newFlyerName );

    $('#thanksMessage').val( flyerJson.thanksMessage );

    $.get('/api/team/members').done( function(res) {
        teamMembers = res;

        res.team.members.forEach( function(item) {
            //if( item.status === 'joint' ) {
                var option = $('<option>').attr('id',item._id).text(item.displayName);

                $('#askForComment').append( option.clone() );
                $('#autoAssignTo').append( option.clone() );
            //}
        });
        console.log(res);
    });

    $('#buttonPublishSaveAsDraft').click( function() {
        saveAsDraftOrPublish(true);
    });


    $('#buttonPublishDone').click( function() {
        saveAsDraftOrPublish(false);
    });

    function saveAsDraftOrPublish(saveAsDraft) {
        flyerJson.description = $('#flyerName2').val() ;
        flyerJson.thanksMessage = $('#thanksMessage').val();

        var askForComment = $('#askForComment :selected').attr('id');
        var autoAssignTo = $('#autoAssignTo :selected').attr('id');

        if( autoAssignTo != '0' ) // 0 == None
            $.post('/api/team/form/assign', {formID: flyerid, userID: autoAssignTo});

        if( askForComment != '0' ) // 0 == None
            $.post('/api/team/form/askForComment', {formID: flyerid, userID: askForComment});


        $.post( '/flyer/publish', {saveAsDraft:saveAsDraft,flyer:flyerJson} ).done(function(data){
            $('#publishFinalMessage').text(data.message);
            loadSharePanel();
        });
    }
}

function loadSharePanel() {
    $('.publishRow').hide();
    $('.shareRow').show();

    $('#flyerName3').text( $('#flyerName2').val()  );

    $('#flyerURL').val( document.location.origin + '/flyer/embeded/' + flyerid );

    $('#buttonShareDone').click( function() {
        $('.shareRow').hide();
        document.location = '/dashboard';
    });
}

function rotate(element, degree) {
    element.animate({
        '-webkit-transform': 'rotate(' + degree + 'deg)',
        '-moz-transform': 'rotate(' + degree + 'deg)',
        '-ms-transform': 'rotate(' + degree + 'deg)',
        '-o-transform': 'rotate(' + degree + 'deg)',
        'transform': 'rotate(' + degree + 'deg)',
        'zoom': 1
    }, 5000);
}

function saveFlyer(callback) {

    callback = callback || function(a){}

    $('#buttonSave').text('Saving...').addClass('disabled');

    var flyerjson = flyer.flyer2json();
    flyerjson.thumbnail = '';

    if( !existFlyer )
        flyerjson.description = newFlyerName;

    $.post( '/flyer/save', {flyer:flyerjson} )
        .done(function(data){
            callback(true);
            $('#buttonSave').text('Save').removeClass('disabled');
        })
        .fail(function(data){
            callback(false)
            $('#buttonSave').text('Save*').removeClass('disabled');
        });


    // Set next auto save time
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(saveFlyer,autosaveInterval);
}

function viewModeChanged(e) {

    var isViewMode = $('input[name=viewmode]').prop('checked');

    if( isViewMode )
        GoToViewMode();
    else
        GoToEditMode();
}

