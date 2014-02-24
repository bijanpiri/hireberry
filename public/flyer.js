function Flyer(options) {

    var editMode = options.editMode;
    var pStack = this;
    var splitterIsHold;
    var splitterOwner;
    var splitterOriginY;
    var splitterOriginHeight;

    var TagWidget = null;

    var Widgets=[Widget,TextWidget,PictureWidget,VideoWidget,ButtonWidget,TagWidget,MapWidget,VoiceWidget];
    this.widgetWidthOpenSettingPanel = null;
    this.pStackNormalHeight;

    function Size(width,height){
        if(width)
            this.width=width
        else
            this.width=0;
        if(height)
            this.height=height
        else
            this.height=0;
    }




    /****** Widget - Start *******/
    function Widget(){
        this.layouts = "";
        this.height = 100; //px
        this.type=0;
        this.settingPanelIsOpen = false;
        this.portlet = $('<div>').addClass('portlet').data('widget',this);
        this.portletContainer = $('<div>').addClass('portlet-container').width(pStack.width()+24);

        this.serialize = function(){};
        this.deserialize = function(content){};
        this.enterToShotMode = function(completedCallback) {completedCallback()};
        this.exitFromShotMode = function() {};
        this.resized = function(size){}

        this.setLayout = function(layout){
            this.layout = layout;
        };

        this.openSettingPanel = function(duration,delta) {
            // Close other setting panel
            if( pStack.widgetWidthOpenSettingPanel != null )
                pStack.widgetWidthOpenSettingPanel.closeSettingPanel(duration,delta);
            pStack.widgetWidthOpenSettingPanel = this;

            pStack.animate({ height: this.pStackNormalHeight + delta }, duration);
            this.portletContainer.find('.portlet-settingPanel').css('display','block').animate({height: delta}, duration);
            this.portletContainer.animate({ height:  this.portletContainer.height() + delta }, duration);
            this.settingPanelIsOpen = true;

            setTimeout(reLocatingPlus,duration);
        }

        this.closeSettingPanel = function(duration,delta){
            pStack.widgetWidthOpenSettingPanel = null;

            pStack.animate({ height: this.pStackNormalHeight }, duration);
            this.portletContainer.find('.portlet-settingPanel').css('display','none').animate({height: 0}, duration);
            this.portletContainer.animate({ height:  this.portletContainer.height() - delta }, duration);
            this.settingPanelIsOpen = false;

            setTimeout(reLocatingPlus,duration);
        }

        this.content = function(){

            var centerPanel =
                $('<div>').addClass('centerPanel')

            var resizingHandle =
                $('<div>').addClass('portlet-splitter');

            var settingApplyButton = $('<button>').addClass('btn')
                .text('Apply')
                .addClass('btn')
                .click((function(widget){
                    return function(){
                        widget.applySetting(settingPanel)
                        widget.closeSettingPanel(500,100);
                    }
                })(this));

            var settingPanel = $('<div>').addClass('portlet-settingPanel')
                .append(this.getSettingPanel())
                .append(settingApplyButton);

            var moveHandle = $('<div>').addClass('portlet-aroundButton portlet-moveHandle')
                .append($('<span>')
                    .addClass('icon-move'));

            var deleteButton = $('<div>').addClass('portlet-aroundButton portlet-deleteButton')
                .append($('<span>')
                    .addClass('icon-trash'))
                .click((function(widget){
                    return function(){
                        widget.portletContainer.remove();
                        reLocatingPlus();
                    }
                })(this));

            var settingButton = $('<div>')
                .addClass('portlet-aroundButton portlet-settingButton')
                .append($('<span>').addClass('icon-wrench'))
                .click( (function(widget){
                    return function(){

                        var delta = 100;
                        var duration = 500;
                        widget.portletContainer.find('.portlet-settingPanel').width(pStack.width());

                        if( widget.settingPanelIsOpen )
                            widget.closeSettingPanel(duration,delta);
                        else
                            widget.openSettingPanel(duration,delta);
                    }
                })(this));

            this.portlet.width(pStack.width()).append(centerPanel);

            this.portletContainer
                .append(settingPanel)
                .append(this.portlet)
                .append(resizingHandle)
                .append(settingButton)
                .append(moveHandle)
                .append(deleteButton);

            this.portlet.find('.centerPanel').append(this.layout);

            return this.portletContainer.append( this.portlet );
        }

        this.getSettingPanel = function () {
            return 'Default Setting Panel';
        }

        this.applySetting = function (settingPanel){

        }

        this.resize=function(size){

        }

        this.minimumSize=function(){
            return new Size();
        }
        this.maximumSize=function(){
            return new Size();
        }

        this.size=function(){
            return new Size();
        }

        this.portletContainer.on('portlet:resizing', function(e,newHeight){
            if(pStack.widgetWidthOpenSettingPanel)
                pStack.widgetWidthOpenSettingPanel.closeSettingPanel();
        });

        this.portlet.on('portlet:newItemWillAdd', function(){
            if(pStack.widgetWidthOpenSettingPanel)
                pStack.widgetWidthOpenSettingPanel.closeSettingPanel();
        });
    }

    Widget.prototype.constructor = Widget;

    /****** Widget - End *******/

    function TextWidget(){

        Widget.call(this);

        var layout1='layout1';
        var layout2='layout2';
        var layout3='layout3';
        var layout4='layout4';
        var dataSource = [];

        function initLayout1(){
            var textField=$('<div>').addClass('textfield').addClass('portlet-content-text');
            layout1 = $('<div>').append(textField)

            textField.css('height', '100%' ).hallo({plugins: {
                'halloformat': {"bold": true, "italic": true, "strikethrough": true, "underline": true},
                'hallojustify' : {},
                'hallolists' : {},
                'halloheadings': {},
                'hallolink': {}
            }
            });
        }

        function initLayout2(){
            var textField = $('<div>').addClass('textfield').addClass('portlet-content-text');
            layout2 = $('<div>').append(textField);

            textField.css('height',this.height ).hallo({plugins: {
                'halloformat': {"bold": true, "italic": true, "strikethrough": true, "underline": true},
                'hallojustify' : {},
                'hallolists' : {},
                'halloheadings': {},
                'hallolink': {}
            }
            });

        }

        initLayout1.call(this);
        initLayout2.call(this);

        this.setLayout(layout1);

        this.portlet.on('portlet:resized', function() {
            $(this).find('.textfield').css('height', $(this).height());
        });

        this.portlet.on('portlet:layoutChanged', function(e,idx) {
            console.log(idx,idx.old,idx.new);
        });

        this.contentSize = function(){}

        this.getSettingPanel = function () {
            return 'Text Setting Panel';
        }

        this.serialize = function(){
            return this.portlet.find('.portlet-content-text').html();
        }

        this.deserialize = function(content){
            return this.portlet.find('.portlet-content-text').html(content);
        }
    }
    TextWidget.prototype = new Widget();
    TextWidget.prototype.constructor = TextWidget;


    function PictureWidget(){
        Widget.call(this);

        this.height = 160;
        var layout = "image layout 1";

        function initLayout1() {
            var html = '<div class="imageWidgetOuterContainer"><div class="imageWidgetInnerContainer">'+
                '<input type="file" name="picture" multiple hidden>'+
                '<i class="imageWidgetCamera"></i>'+
                '<div>Drop your pictures here</div>'+
                '<div>or <button class="wbtn wbtn-2 wbtn-2a browseImgBtn">Browse</button> your computer</div>'+
                '</div></div>';

            layout = $(html);

            var file = layout.find('input[type=file]');
            var browseButton = layout.find('button');

            if(editMode){
                file.fileupload({
                    url:'/flyer/upload',
                    dataType: 'json',
                    done: function (e, data) {
                        img.attr('src', '/uploads/' + data.result.files[0].name);
                    }
                });

                browseButton.click(function(){
                    file.click()
                });

            } else {
                this.portlet.find('input[type=file]').remove();
            }
        }

        initLayout1.call(this);

        this.setLayout(layout);

        this.portletContainer.on('portlet:resizing', function(e,newHeight) {
            this.height = newHeight;//$(this).height();

            $(this).find('.portlet-picture').height( this.height )
        });

        this.serialize=function(){
            return this.portlet.find('.portlet-picture').attr('src');
        }
        this.deserialize=function(content) {
            return this.portlet.find('.portlet-picture').attr('src', content);
        }
    }
    PictureWidget.prototype=new Widget();
    PictureWidget.prototype.constructor=PictureWidget;


    function VideoWidget(){
        Widget.call(this);

        this.height = 150;
        var layout = '';

        function initLayout() {
            var inputbox = '<div class="videoWidgetInputboxOutter">'+
            '<input type="text" id="videoWidgetInputboxText" placeholder="Paste your video link here">'+
            '<button class="wbtn wbtn-2 wbtn-2a videoWidgetInputboxDone">Done</button>'+
            '<div class="videoWidgetInputboxFooter">Youtube and Vimeo are supported</div>'+
            '</div></div>';

            var outter = $('<div>').addClass('videoWidgetOuter').append(inputbox);

            layout = $(outter)
        }

        initLayout();

        this.setLayout(layout);

        this.portletContainer.on('portlet:resizing', (function(widget){
            return function(e,newHeight) {
                widget.height = newHeight;
                widget.portlet.find('iframe').attr('height',newHeight);
            }
        })(this))
    }
    VideoWidget.prototype=new Widget();
    VideoWidget.prototype.constructor=VideoWidget;


    function ButtonWidget(){
        Widget.call(this);

        var layout = '';

        function initLayout1() {
            layout = $('<a>')
                .addClass('btn btn-success')
                .text('Default')
                .hallo({});
        }

        initLayout1();

        this.setLayout(layout);

        this.getSettingPanel = function(){
            var input1 = $('<input>')
                .attr('id','displayText')
                .attr('placeholder', 'Display Text')
                .attr('type', 'text')
                .val(layout.text());

            var input2 = $('<input>')
                .attr('id','url')
                .attr('placeholder', 'URL address')
                .attr('type', 'text')
                .val(layout.attr('href'));

            var settingPanel = $('<div>').append(input1).append(input2);
            return settingPanel;
        }

        this.applySetting = function (settingPanel){
            layout.text( settingPanel.find('#displayText').val() );
            layout.attr('href', settingPanel.find('#url').val() );
        }

        this.serialize = function(){
            return {
                display: layout.text(),
                url: layout.attr('href')
            }
        }

        this.deserialize = function(content){
            layout.text( content.display  );
            layout.attr( 'href', content.url );
        }
    }
    ButtonWidget.prototype = new Widget();
    ButtonWidget.prototype.constructor = ButtonWidget;

    function VoiceWidget(){
        Widget.call(this);

        this.height = 150;
        var layout = 'Voice Layout 1';

        function initLayout1() {
            var inputbox = '<div class="videoWidgetInputboxOutter">'+
                '<input type="text" id="videoWidgetInputboxText" placeholder="Paste your video link here">'+
                '<button class="wbtn wbtn-2 wbtn-2a videoWidgetInputboxDone">Done</button>'+
                '<div class="videoWidgetInputboxFooter">Soundcloud is supported</div>'+
                '</div></div>';

            var outter = $('<div>').addClass('videoWidgetOuter').append(inputbox);

            layout = $(outter)
        }

        initLayout1();
        this.setLayout(layout);

        this.serialize = function() {
        }

        this.deserialize = function( content) {
        };
    }
    VoiceWidget.prototype = new Widget();
    VoiceWidget.prototype.constructor = VoiceWidget;


    function MapWidget(){
        Widget.call(this);

        var layout = 'MapWidget layout 1';
        var mapAsImage = '';
        var mapbox = [];

        function initLayout1() {
            var id = 'map' + parseInt(Math.random()*100);
            var mapDiv =  $('<div>').attr('id',id);
            layout = $('<div>')
                .css('position', 'relative')
                .height( this.height )
                .width( pStack.width() )
                .append(mapDiv);

            mapbox[0] = L.mapbox.map(layout[0], 'coybit.gj1c3kom');
        }

        initLayout1.call(this);

        this.setLayout(layout);

        $('<img>').addClass('mapAsImage mapAsImage-hide').appendTo(this.portlet);

        this.serialize = function(){
            var center = mapbox[this.layoutIndex].getCenter();

            return {
                center: {lat:center.lat, lng:center.lng },
                zoom: mapbox[this.layoutIndex].getZoom()
            };
        }

        this.deserialize = function(content){
            if( content ){
                mapbox[0].setView( content.center, content.zoom );
                mapbox[1].setView( content.center, content.zoom );
            }
        }

        this.enterToShotMode = function(completedCallback) {

            var curMap =  mapbox[this.layoutIndex];
            var img = this.portlet.find('.mapAsImage');

            leafletImage(curMap, function(err,canvas){

                img.removeClass('mapAsImage-hide')
                    .addClass('mapAsImage-show')
                    .attr('src', canvas.toDataURL())

                if( completedCallback )
                    completedCallback()
            });
        }

        this.exitFromShotMode = function() {
            var img = this.portlet.find('.mapAsImage')
                .removeClass('mapAsImage-show')
                .addClass('mapAsImage-hide');
            img.hide();
        }

        // Triggers
        this.portlet.on('portlet:resized', function() {
            this.height = $(this).height();

            layout.height(this.height)
                .width(pStack.width());
        });
    }
    MapWidget.prototype=new Widget();
    MapWidget.prototype.constructor=MapWidget;

    var initDimension = function() {

        var aspect_ratio = Math.sqrt(2); // A4 ratio
        pStack.height( pStack.width() * aspect_ratio );

        $(window).resize(function() {
            pStack.height( pStack.width() * aspect_ratio );
        });

        this.pStackNormalHeight = pStack.height();
    }

    var reLocatingPlus = function(animated) {
        var rh = remaindedHeight();

        if(animated==undefined)
            animated = true;

        if( rh<30 ){

            if(animated) {
                $('.portletCreator')
                    .animate({
                        height: 50,
                        bottom: -60
                    }, 500)
                    .find('#portletCreatorAlarm')
                    .show();
                $('.portletCreator').find('#items').hide();
            }
            else {
                $('.portletCreator')
                    .css('height',50)
                    .css('bottom',-60)
                    .find('#portletCreatorAlarm')
                    .show();
                $('.portletCreator').find('#items').hide();
            }

        }
        else {
            if(animated) {
                $('.portletCreator')
                    .animate({
                        height: remaindedHeight(),
                        bottom: 0
                    }, 500)
                    .find('#portletCreatorAlarm')
                    .hide();
                $('.portletCreator').find('#items').show();
            }
            else {
                $('.portletCreator')
                    .css('height',remaindedHeight())
                    .css('bottom',0)
                    .find('#portletCreatorAlarm')
                    .hide();
                $('.portletCreator').find('#items').show();
            }
        }
    }

    var remaindedHeight = function () {
        var emptySpaceHeight = pStack.height();

        console.log('Stack-Height:' + pStack.height() );

        pStack.find('.portlet').each(function(index) {
            emptySpaceHeight -= $(this).height();
            console.log('-' + $(this).height() );
        });

        console.log('R-Height:' + emptySpaceHeight);
        return emptySpaceHeight;
    }

    var createPortlet = function( wData ) {

        // Check Empty Space
        if( editMode && remaindedHeight() < 100 )
            return;

        // Create a widget and initializing it
        var widget = new Widgets[wData.type]();
        var portlet = widget.content();
        widget.type = wData.type;
        pStack.append(portlet);
        if(wData.height)
            widget.height = wData.height;
        if(wData.layoutIndex){
            widget.layoutIndex = wData.layoutIndex;
            widget.layoutChanged();
        }
        portlet.css( 'height', widget.height );
        if(wData.content)
            widget.deserialize(wData.content);

        if(editMode) {

            var mouseMove = function(e){
                if( splitterIsHold ) {
                    var curHeight = splitterOwner.height();
                    var newHeight = splitterOriginHeight +  (e.clientY - splitterOriginY);
                    var delta = newHeight-curHeight;

                    // Snap
                    if( remaindedHeight() - delta < 5 )
                        newHeight += remaindedHeight() - delta;

                    splitterOwner.trigger('portlet:resizing',splitterOwner.height());

                    if( remaindedHeight() - delta >= 0){
                        splitterOwner.height( newHeight );
                        reLocatingPlus(false);
                    }
                }
            }

            var mouseUp = function(e){

                if(splitterIsHold)
                    splitterOwner.trigger('portlet:resized',splitterOwner.height());

                splitterIsHold = false;
            }

            var mouseDown = function(e){

                /*
                 // ToDo: Attaching onmousemove event to all the iframs
                 // But a security error is occured during accessing https iframe content.
                 // Solve It!
                 $('iframe').each(function(index,frame){

                 if( $(frame).attr('mouseEventIsSet') == undefined ) {

                 // IE is special
                 var frameDoc = frame.contentDocument || frame.contentWindow.document;
                 var frameBody = frameDoc.getElementsByTagName("body")[0];

                 frameBody.onmouseover = mouseMove;

                 frame.attr('mouseEventIsSet','1')
                 }
                 })
                 */

                splitterIsHold = true;
                splitterOwner = $(this).parent();
                splitterOriginY = e.clientY;
                splitterOriginHeight = splitterOwner.height();
            }

            portlet.find('.portlet-splitter').mousedown(mouseDown);
            $(window).mouseup(mouseUp);
            pStack.parent().mousemove(mouseMove);

            reLocatingPlus(false);
        }
    };

    var json2flyer = function(flyerid, callback) {

        $.get('/flyer/json/'+flyerid)
            .done(function(data){
                if( callback ){
                    callback(data);
                    return;
                }

                if( data.length == 0 ){
                    reLocatingPlus();
                    return;
                }

                $('input[name=flyertext]').val(data.description);
                setBackground(data.background, false);
                var widgetData=data.widgets;
                for( var i=0; i<widgetData.length; i++ ){
                    if( widgetData[i] )
                        createPortlet(
                            {
                                type:widgetData[i].type,
                                content:widgetData[i].Contents,
                                height:widgetData[i].height,
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
            count: portlets.length,
            widgets:[]
        };

        portlets.each(function(index) {
            var widget = $(this).data('widget');
            flyer.widgets.push( {
                "type": widget.type,
                'height':$(this).height(),
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

    var setBackground = function (url, wrapper) {
        pStack
            .css('background-image', ( wrapper ? 'url("' + url + '")' : url ) )
            //.css('background-size', pStack.width() + 'px ' + pStack.height() + 'px' )
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
                handle: ".portlet-moveHandle"
            })//.disableSelection();
        }

        initDimension();

        // Set click event
        $(function(){
            //reLocatingPlus();

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
        // Global Changes
        pStack.find('.portlet-splitter').css('background-color','#000');

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
        pStack.find('.portlet-splitter').css('background-color','');

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
    this.remaindedHeight = remaindedHeight;
    this.setBackground = setBackground;
    this.getThumbnail = getThumbnail;
    this.getShot = getShot;

    return this;
}

$.fn.Flyer = Flyer;