var TagWidget = null;

var Widgets = [
    Widget, TextWidget, PictureWidget,
    VideoWidget, ButtonWidget, TagWidget,
    MapWidget, VoiceWidget, WorkTypeWidget,
    PersonalInfoWidget, ResumeWidget, AnythingElseWidget,
    ProfilesWidget, SeperatorWidget, SkillWidget
];

function Flyer(options) {

    var editMode = options.editMode;
    var pStack = this;

    this.pStackNormalHeight;

    $(document).mousedown(function(event){
        if($(event.target).parents().index($('.portletStack'))==-1)
            $('.toolbar').hide();
    });

    $(document).delegate('.portlet','focusin',
        function(){
            $('.toolbar').hide();
            $(this).parent().find('.toolbar').show();
        });
    $(document).delegate('.portlet-container *','mousedown',
        function(){
            $('.toolbar').hide();
            $(this).closest('.portlet-container').find('.toolbar').show();
        });
    $(document).delegate('.portlet-container>*','mousedown',
        function(event){
            event.stopPropagation();
        });

    $(document).delegate('.portlet-container','mousedown',
        function(){
            $('.toolbar').hide();
        });

    if( editMode==false )
        $('.portletCreator').hide();
    else
        $('.portletSubmittion').hide();

    var createPortlet = function( wData ) {

        // Create a widget and initializing it

        if(Widgets[wData.type].instances==0){
            alert("You can not use more widget of this type.");
            return;
        }
        Widgets[wData.type].instances--;

        var widget = new Widgets[wData.type]();
        widget.editMode = editMode;
        var portlet = widget.content();
        widget.type = wData.type;
        pStack.append(portlet);

        // Parameter: is it new?
        widget.widgetDidAdd( (wData.content==null) );

        if(wData.layoutIndex){
            widget.layoutIndex = wData.layoutIndex;
            widget.layoutChanged();
        }

        if(wData.content)
            widget.deserialize(wData.content);
    };

    var json2flyer = function(flyerid, callback) {

        $.get('/flyer/json/'+flyerid)
            .done(function(data){
                if( callback ){
                    callback(data);
                    return;
                }
                $('input[name=flyertext]').val(data.description);
                setBackground(data.background, false);
                setLogo(data.logo);

                var widgetData = data.widgets;
                var nWidgets = widgetData ? widgetData.length : 0;

                for( var i=0; i<nWidgets; i++ ){
                    if( widgetData[i] )
                        createPortlet({
                            type:widgetData[i].type,
                            content:widgetData[i].Contents,
                            layoutIndex:widgetData[i].layoutIndex
                        });
                }
            })
            .fail(function(data){
                console.log(data)
            });
    }

    var flyer2json = function() {

        var portlets = pStack.find('.portlet');

        var flyer = {
            description: $('input[name=flyertext]').val(),
            flyerid:  $('input[name=flyerid]').val(),
            background: pStack.css('background-image'),
            logo: $('.portletHeader .logo').attr('src'),
            count: portlets.length,
            widgets:[]
        };

        portlets.each(function(index) {
            var widget = $(this).data('widget');
            flyer.widgets.push( {
                "type": widget.type,
                'layoutIndex':widget.layoutIndex,
                "Contents":  ( widget  && widget.serialize())
            });
        });

        return flyer;
    }

    var getThumbnail = function (flyerid,callback){
        $.get('/flyer/json/'+flyerid)
            .done(function(data){
                callback(data.thumbnail);
            })
            .fail(function(data){
                callback(-1);
            });
    }

    var setLogo = function (url) {
        $('.portletHeader .logo').attr('src',url);

        if(editMode==false)
            $('.portletHeader .logo').css('border',0);
    }

    var setBackground = function (url, wrapper) {
        pStack
            .css('background-image', ( wrapper ? 'url("' + url + '")' : url ) )
            .css('background-size', 'auto 100%' )
            .css('background-repeat', 'no-repeat');
    }

    var getShot = function (callback) {

        // Generate Thumbnail Image
        enterShotMode( function(){

            html2canvas(pStack, {
                onrendered: function(canvas) {

                    if(callback)
                        callback( canvas.toDataURL() );

                    exitFromShotMode();
                }
            });
        });
    }

    var initPortletsStack = function () {
        // Initialization
        if( editMode ){
            pStack.sortable({
                connectWith: ".portletStack",
                cursor: "move",
                axis: "y",

                handle: ".move-btn-frame"
            })//.disableSelection();

        }


        // Set click event
        $(function(){

            $(".newitem").click(function(e){
                var itemType = parseInt($(this).attr('type'));
                createPortlet( {type:itemType});
            });
        });

        if(options.flyerid)
            json2flyer(options.flyerid)
    }

    initPortletsStack();

    // Private functions
    function enterShotMode(completedCallback){

        // Portlet Changes
        var portlets = pStack.find('.portlet');
        var portletsCount = portlets.length;

        if(portletsCount==0)
            completedCallback();
        else {
            portlets.each(function() {
                var widget = $(this).data('widget');
                widget.enterToShotMode(function(){
                    portletsCount--;

                    if(portletsCount==0)
                        completedCallback();
                });
            });
        }
    }

    function exitFromShotMode() {
        // Global Changes

        // Portlet Changes
        var portlets = pStack.find('.portlet');

        portlets.each(function() {
            var widget = $(this).data('widget');
            widget.exitFromShotMode();
        });
    }


    // Public functions
    this.createPortlet = createPortlet;
    this.json2flyer = json2flyer;
    this.flyer2json = flyer2json;
    this.setBackground = setBackground;
    this.getThumbnail = getThumbnail;
    this.getShot = getShot;
    this.setLogo = setLogo;
    return this;
}

$.fn.Flyer = Flyer;