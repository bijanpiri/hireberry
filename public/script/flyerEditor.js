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

    $('.bool-color-chooser-canvas').ColorPicker(function(c){
        $('.bool-portlet').css('background',c);
    });
    $('.bool-color-chooser-background').ColorPicker(function(c){
        $('body').css('background',c);
    })
    $('.bool-toolbar-btn-edit').click(function() {
        GoToEditMode();
    });
    $('.bool-toolbar-btn-preview').click(function(){
        GoToViewMode();
    });

    $('.bool-btn-more-options').click( function() {
        $('.portletCreator').css('overflow','hidden');
        $('.bool-widget-btn-carousel').animate({left:-240}, 300, function() {
            $(this).hide();
        });
        $('.bool-more-options').show().animate({left:0}, 300, function() {
            $('.portletCreator').css('overflow','visible');
        });
    });

    $('.bool-btn-back-to-widgets').click( function() {
        $('.portletCreator').css('overflow','hidden');
        $('.bool-more-options').animate({left:240}, 300, function() {
            $(this).hide();
        });
        $('.bool-widget-btn-carousel').show().animate({left:0}, 300, function() {
            $('.portletCreator').css('overflow','visible');
        });
    });

    $('.bool-portlet-font-item').click( function() {
        var fontFamily = $(this).css('font-family');

       $('.bool-portlet').css( 'font-family', fontFamily );

       $('.bool-portlet-dropdown-fonts .dropdown-toggle')
           .css( 'font-family', fontFamily )
           .find('.bool-current-font-name')
           .text( $(this).attr('data-font') );
    });

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
            $('.applyNowButton').button('loading');

            $('.error').hide();
            flyer.flyer4Submit(function(){
                var form = $('#applyForm');
                var formURL = form.attr("action");
                $.ajax({
                    url: formURL,
                    type: 'POST',
                    data:  new FormData(form[0]),
                    mimeType:"multipart/form-data",
                    contentType: false,
                    cache: false,
                    processData:false,
                    success: function(data, textStatus, jqXHR) {
                        $('.portlet-container').hide();
                        $('.portletSubmittion').hide();
                        $('.portletThanksMessage').show();
                        $('.thanksMessageContent')
                            .html(
                            $(flyer.thanksMessage)
                                .attr('id','')
                                .attr('contenteditable','false'));
                    },
                    error: function(jqXHR, textStatus, errorThrown) {

                    }
                });
                e.preventDefault();
            })
        });
    }

    initCommentView();
});

function loadFlyer() {

    flyerid = $('input[name=flyerid]').val();
    flyer = $('.portletStack').Flyer({
        editMode: editMode,
        flyerid: flyerid,
        templateID: templateID,
        flyerLoaded: function(flyer) {
            if( !editMode )
                document.title = flyer.description;
            else
                document.title = 'Editor - ' + flyer.description;

            // Set current font
            $('.bool-portlet-dropdown-fonts .dropdown-menu [data-font-family="' + flyer.font + '"]').click();
        }
    });
}

function loadTemplateChooser() {

    $('.thumbnail').unbind('click').click(function(){
        // Select recent selected item
        templateID = $(this).attr('thumbnailID');
    }) ;

    $('#templateModal').modal();
    $('#GoToEditor').click( function() {

        $('[name="position-title"]').val($('#flyerName1').val());

        $('#templateModal').modal('hide');

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

                    if( comment.commentTime && comment.commentTime.length > 0 ) {

                        var commentObj = $('<div>').addClass('portlet-comment');
                        commentObj.append( $('<div>').addClass('commentNote').text('Asked: ' +  comment.note) );
                        commentObj.append( $('<div>').addClass('comment-date').text( 'At ' + (new Date(comment.askingTime)).toLocaleString()) );
                        commentObj.append( $('<div>').addClass('commenter').text(comment.commenter.email + "'s replied:") );
                        commentObj.append( $('<div>').addClass('comment-body').text(comment.comment) );
                        commentObj.append( $('<div>').addClass('comment-date').text( 'At ' + (new Date(comment.commentTime)).toLocaleString()) );

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
                        .addClass('comment-date');

                    var titleObj = $('<div>')
                        .text('You are asked to put your comment about this form');

                    var textAreaObj = $('<textarea>')
                        .attr('id','comment_form_' + a4c.formID._id)
                        .css('display','block')
                        .addClass('bool-textarea')
                        .attr('placeholder','Your comment ...');

                    var sendBtnObj = $('<button>')
                        .text('Reply')
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

    // Putting comment view in initialization mode
    toggleCommentView.call( $('#buttonComment'), function() {
        $('.portlet-commentsView-container').show();
    });

    $('#ask-for-comment-btn').click( function() {

        $('.askForComment-form').toggle();
        var isHidden = $('.askForComment-form').css('display')==='none';

        $('.portlet-askedForComment-list').toggle();
        $('.portlet-comments').toggle();

        if( !isHidden )
            $(this).text('x');
        else
            $(this).text('Ask For Comment');
    });

    $('.askForComment-send').click( function() {

        var askForComment = $('[name=askForComment-selected-user]').val();

        if( askForComment.length > 0 ) {// It isn't None
            $.post('/api/team/form/askForComment', {formID: flyerid, userID: askForComment}).done( function() {
                // Back to comments list
                $('#ask-for-comment-btn').click();
            });

        }
    });

    $('#buttonComment').click(toggleCommentView);
}

function toggleCommentView(callback) {
    var isOpen = $(this).attr('isOpen')==='1';
    var callback = typeof(callback)==='function' ? callback : function(){};

    if( isOpen ) {
        $('.portlet-commentsView-container').animate( {width:0}, 500, callback );
        $(this).attr('isOpen','0');
    }
    else {
        var width = $('.portlet-commentsView').width();
        $('.portlet-commentsView-container').animate( {width:width}, 500 , callback );
        $(this).attr('isOpen','1');
    }
}

var admin=false;

function loadEditor() {

    $('.templateRow').hide();
    $('.flyerRow').show();
    $('#fixToolbar').show();
    $('#buttonEditview').hide();
    $('#ThanksMessageEditor').wysiwyg({
        activeToolbarClass:'bool-active',
        toolbarSelector: '[data-target="#ThanksMessageEditor"]'
    }).on('mouseup keyup mouseout',
        function(){
            var size=document.queryCommandValue('fontSize');
            var sizeText={'4':'Small','6':'Medium','7':'Large'};
            $('.bool-thanks-message .bool-combo-text').html(sizeText[size] );
            flyer.thanksMessage=this.outerHTML;
        });
    $('.bool-thanks-message  .bool-color-chooser').ColorPicker(
        function(color){
            $('#ThanksMessageEditor').css('color',color);
        }
    );
    $.get('/api/team').done( function(res) {
        admin=res.admin._id===res.user;

        var members = res.members;
        var membersAndNone = JSON.parse(JSON.stringify(res.members));
        membersAndNone.unshift({displayName:'None',email:null,_id:null});
        $('.bool-user-responder').populateUserCombo(membersAndNone,null,'autoAssignedTo_userID');


//        $('#askForComment').populateUserCombo(membersAndNone,null,'askForComment_userID');
//        $('#autoAssignTo').populateUserCombo(members,null,'autoAssignedTo_userID');
//        $('.askForComment-user').populateUserCombo(members,null,'askForComment-selected-user');
        //$('#job-responder').populateUserCombo(members,null,'job-selected-responder');
    });

    loadFlyer();

    $('.bool-toolbar-btn-publish').click( function() {
        loadPublishPanel();
    });

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
    $('.bool-toolbar-btn-save').click(function(){

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

    $('.bool-toolbar-btn-preview').show();
    $('.bool-toolbar-btn-edit').hide();

    setTimeout(function(){
        hideLoading();
        $('#previewFrame iframe').remove();
        $('#previewFrame').hide();
        $('.flyerRow').show();
    }, 1000);

};

function GoToViewMode() {

    var height = $('#portletsBox').height();

    $(document.body).removeClass('bool-edit-mode')

    showLoading();

    $('.bool-toolbar-btn-preview').hide();
    $('.bool-toolbar-btn-edit').show();

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

    flyer.flyer2json(function(flyerJson) {

        publish();


        function publish() {
            flyerJson.description = $('[name="position-title"]').val();
            flyerJson.thanksMessage = flyer.thanksMessage;
            $('.bool-flyer-published-link')
                .html(flyerJson.description)
                .attr('href','/flyer/embeded/'+flyerid);

            var askForComment = $('[name=askForComment_userID]').val();
            var autoAssignTo = $('[name=autoAssignedTo_userID]').val();

            $.post('/api/team/form/assign', {formID: flyerid, userID: autoAssignTo});

//            if( askForComment.length > 0 ) // It isn't None
//                $.post('/api/team/form/askForComment', {formID: flyerid, userID: askForComment});

            $.post('/flyer/publish', {flyer: flyerJson})
                .done(function (data) {
//                    $('#publishFinalMessage').text(data.message);
//                    loadSharePanel();

                    if(admin)
                        $('#publishModalAdmin').modal();
                    else
                        $('#publishModal').modal();

                });
        }

    });
}

function loadSharePanel() {
    $('#publishModal').modal('hide')
    document.location = '/dashboard#jobsp';
    return;

    $('.flyerRow').hide();
    $('.publishRow').show();
    $('#fixToolbar').hide();
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

    clearTimeout(autosaveTimer);

    callback = callback || function(a){}
    var btn=$('.bool-toolbar-btn-save');
    btn.button('loading');

    flyer.flyer2json(
        function(flyerjson){
            flyerjson.thumbnail = '';


            flyerjson.description = $('[name="position-title"]').val();

            $.post( '/flyer/save', {flyer:flyerjson} )
                .done(function(data){
                    callback(true);
                    btn.button('reset');
//                    window.location='/dashboard#jobsp'
                })
                .fail(function(data){
                    callback(false)
                    btn.text('Save* & Exit').button('reset');
                });
            autosaveTimer = setTimeout(saveFlyer,autosaveInterval);

        }
    );



}
