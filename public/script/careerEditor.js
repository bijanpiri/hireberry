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

    $('.bool-portlet-font-item').click( function() {
        var fontFamily = $(this).css('font-family');

       $('.bool-portlet').css( 'font-family', fontFamily );

       $('.bool-portlet-dropdown-fonts .dropdown-toggle')
           .css( 'font-family', fontFamily )
           .find('.bool-current-font-name')
           .text( $(this).attr('data-font') );
    });

    $('form').submit(false);

    var viewMode = 'editor';

    if( viewMode=='embeded') {
        // Hidden bars
        $('nav').remove();
        $('#fixToolbar').remove();
        $('body > .container-fluid').css('margin-top','1em');
    }

    if( editMode ) {
        $(document.body).addClass('bool-edit-mode');
        loadEditor();
    }
    else {
        $('.flyerRow').show();
        loadFlyer();
    }

    loadingPositions();
});

function loadingPositions() {
    $.get('/api/team/' +  teamID + '/positions').done( function(res) {

        $('.caption').text( res.teamName );
        $('.team-tel').text( res.teamTel );
        $('.team-address').text( res.teamAddress );

        res.positions.forEach( function(position) {
            var applyButtonObj = $('<a>').addClass('btn btn-success position-apply')
                .attr('href','/flyer/embeded/' + position.id)
                .text('Apply Now');

            var positioDescObj = $('<div>').addClass('position-description')
                .text( position.title);

            // ToDo:
            var positionLocationObj = $('<div>').addClass('position-location');
            if( position.flyer && position.flyer.widgets ) {
                var mapWidgets = position.flyer.widgets.filter( function(widget) {return widget.type==='6'});
                if( mapWidgets.length > 0 )
                    positionLocationObj.text(mapWidgets[0].Contents.address);
            }

            var positionObj = $('<div>').addClass('position')
                .append( positioDescObj )
                .append( positionLocationObj )
                .append( applyButtonObj );

            $('.positions').append( positionObj )

        });
    })
}

function loadFlyer() {

    flyerid = $('input[name=flyerid]').val();

    flyer = $('.portletStack').Flyer({
        editMode: editMode,
        careerid:  teamID,
        flyerLoaded: function(job) {
            var flyer=job.flyer;
        }
    });
}

var admin=false;

function loadEditor() {

    $('.flyerRow').show();

    loadFlyer();

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
            .attr('src','/viwe/careerpage/' + teamID)
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

function saveFlyer(callback) {

    clearTimeout(autosaveTimer);

    callback = callback || function(a){}
    var btn=$('.bool-toolbar-btn-save');
    btn.button('loading');

    flyer.flyer2json(
        function(flyerjson){
            $.post( '/api/careerpage/' + teamID,
                {careerPage:flyerjson} )
                .done(function(data){
                    callback(true);
                    btn.button('reset');
                })
                .fail(function(data){
                    callback(false)
                    btn.text('Save* & Exit').button('reset');
                });
            autosaveTimer = setTimeout(saveFlyer,autosaveInterval);

        }
    );
}
