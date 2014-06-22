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

    //$(document).tooltip();

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
    $('.bool-thanks-message-save').click(function(){
        saveFlyer();
    });
    $('.bool-thanks-message-close').click(function() {
        if(thanksMessage) {
            $('#ThanksMessageEditor').replaceWith(thanksMessage);
            prepareThanksMessage();
        }
        else
            $('#ThanksMessageEditor').empty();
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
                            $(thanksMessage)
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
});
var thanksMessage;
function loadFlyer() {

    flyerid = $('input[name=flyerid]').val();

    $('.comments-sidebar').commentBox({
        postURL: '/api/job/' + flyerid + '/comment',
        getURL: '/api/job/' + flyerid + '/comments',
        togglable: true
    });

    flyer = $('.portletStack').Flyer({
        editMode: editMode,
        flyerid: flyerid,
        templateID: templateID,
        flyerLoaded: function(job) {
            var flyer=job.flyer;
            if( !editMode )
                document.title = flyer.description;
            else
                document.title = 'Editor - ' + flyer.description;
            $('[name="position-title"]').val(flyer.description);
            job.commentators.forEach(function(com){
                $('.bool-commentator-users').append(createCommentatorItem(com));
            });
            if(flyer.thanksMessage) {
                document.getElementById('ThanksMessageEditor').outerHTML = flyer.thanksMessage;
                thanksMessage=flyer.thanksMessage;
                prepareThanksMessage();
            }

            // Set current font
            $('.bool-portlet-dropdown-fonts .dropdown-menu [data-font-family="' + flyer.font + '"]').click();
            $.get('/api/team').done( function(res) {
                admin=res.admin._id===res.user;

                teamMembers= res.members;
                var membersAndNone = JSON.parse(JSON.stringify(res.members));
                membersAndNone.unshift({displayName:'None',email:null,_id:null});
                $('.bool-user-responder')
                    .populateUserCombo(membersAndNone,job.responder,'autoAssignedTo_userID');
                var memNames=teamMembers.map(function(member){
                    return {
                        _id:member._id,
                        label:member.displayName,
                        value:'',
                        email:member.email
                    };
                });
                var list;
                $('.bool-option-search').autocomplete({
                    source:memNames,
                    select:function(event,ui){
                        var exist= $.grep($('.bool-commentator-users>li'),
                            function(item,index){
                                return ui.item.id===$(item).data('commentator')._id;
                            }
                        );
                        if(exist.length>0) {
                            $(exist).fadeTo('fast',.2).delay(100).fadeTo('fast',1);
                            return;
                        }
                        $('.bool-commentator-users').append(createCommentatorItem(ui.item));

                    },
                    minLength:0,
                    autoFocus:true
                }).click(function(){
                    if(list)
                        list.toggle();
                }).data( "ui-autocomplete" )._renderItem = function( ul, item ) {
                    return $('<li>').append(
                        $('<a>')
                            .addClass('bool-user-item')
                            .append(
                            $('<img>')
                                .attr('src', getAvatar(item.email)))
                            .append(item.label))
                        .appendTo(ul);
                };
                $('.bool-option-search')
                    .data('ui-autocomplete')._renderMenu=function(ul,items){
                    var that = this;
                    $.each( items, function( index, item ) {
                        that._renderItemData( ul, item );
                    });
                    $( ul ).addClass( "bool-commentator-list" );
                    list=ul;
                };
            });


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
        loadEditor();
        $('#templateModal').modal('hide');
        saveFlyer(function(){});
    })

}

var admin=false;

function prepareThanksMessage() {
    $('#ThanksMessageEditor').wysiwyg({
        activeToolbarClass: 'bool-active',
        toolbarSelector: '[data-target="#ThanksMessageEditor"]'
    }).on('mouseup keyup mouseout',
        function () {
            var size = document.queryCommandValue('fontSize');
            var sizeText = {'4': 'Small', '6': 'Medium', '7': 'Large'};
            $('.bool-thanks-message .bool-combo-text').html(sizeText[size]);
        });
    $('.bool-thanks-message  .bool-color-chooser').ColorPicker(
        function (color) {
            $('#ThanksMessageEditor').css('color', color);
        }
    );
}
function createCommentatorItem(user) {

    return $('<li>')
        .append($('<a>')
            .append($('<img>').attr('src', getAvatar(user.email, 20)))
            .append(user.label || user.displayName))
        .append(
        $('<a>')
            .addClass('pull-right bool-remove')
            .append('&times;')
            .click(function () {
                $(this).closest('li').remove();
            })).data('commentator', user);
}
function loadEditor() {

    $('.templateRow').hide();
    $('.flyerRow').show();
    $('#fixToolbar').show();
    $('#buttonEditview').hide();
    prepareThanksMessage();

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
            .attr('height', height +100)
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

            $.post('/flyer/publish', {flyer: flyerJson})
                .done(function (data) {

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
            thanksMessage=flyerjson.thanksMessage = document.getElementById('ThanksMessageEditor').outerHTML;

            flyerjson.description = $('[name="position-title"]').val();


            var autoAssignTo = $('[name=autoAssignedTo_userID]').val();

            var commentators=[];

            $('.bool-commentator-users>li').each(function(){
                commentators.push($(this).data('commentator')._id);
            });


            $.post( '/flyer/save',
                {flyer:flyerjson,commentators:commentators,responder:autoAssignTo} )
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
