function Flyer(options) {

    var editMode = options.editMode;
    var pStack = this;
    var splitterIsHold;
    var splitterOwner;
    var splitterOriginY;
    var splitterOriginHeight;
    var Widgets=[Widget,TextWidget,PictureWidget,VideoWidget,ButtonWidget,TagWidget,MapWidget,VoiceWidget];
    this.widgetWidthOpenSettingPanel = null;
    this.pStackNormalHeight;

    function Size(width,height){
        if(width)   this.width=width else this.width=0;
        if(height)  this.height=height else this.height=0;
    }




    /****** Widget - Start *******/
    function Widget(){
        this.layouts = [];
        this.layoutIndex = 0;
        this.height = 100; //px
        this.type=0;
        this.settingPanelIsOpen = false;
        this.portlet = $('<div>').addClass('portlet').data('widget',this);
        this.portletContainer = $('<div>').addClass('portlet-container').width(pStack.width()+24);

        this.serialize = function(){};
        this.deserialize = function(content){};
        this.enterToShotMode = function(completedCallback) {completedCallback()};
        this.exitFromShotMode = function() {};
        this.resized=function(size){

        }

        this.addLayout = function(layout){
                this.layouts.push(layout);
        };

        this.nextLayout = function(event){
            var w = event.data;
            var oldLayoutIndex = w.layoutIndex;
            w.layoutIndex=(w.layoutIndex+1)%w.layouts.length;
            w.layoutChanged(oldLayoutIndex, w.layoutIndex);
        };

        this.prevLayout = function(event){
            var w = event.data;
            var oldLayoutIndex = w.layoutIndex;
            w.layoutIndex=(w.layoutIndex-1+w.layouts.length)%w.layouts.length;
            w.layoutChanged(oldLayoutIndex, w.layoutIndex);
        };

        this.layoutChanged = function( oldLayoutIndex, newLayoutIndex ){
            this.portlet.find('.jcarousel').jcarousel('scroll',this.layoutIndex);

            this.portlet.trigger('portlet:layoutChanged', {old:oldLayoutIndex, new:newLayoutIndex});
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

            var centerPanel = $('<div>').addClass('jcarousel').attr('data-jcarousel','true').attr('data-wrap','circular');
            var resizingHandle = $('<div>').addClass('portlet-splitter');
            var settingApplyButton = $('<button>').text('Apply').addClass('btn').click((function(widget){
                    return function(){
                        widget.applySetting(settingPanel)
                        widget.closeSettingPanel(500,100);
                    }
                })(this));
            var settingPanel = $('<div>').addClass('portlet-settingPanel')
                .append(this.getSettingPanel())
                .append(settingApplyButton);
            var portletTopPadding = $('<div>').addClass('portlet-topPadding');

            var moveHandle = $('<div>')
                .addClass('portlet-aroundButton portlet-moveHandle')
                .append($('<span>').addClass('icon-move'));
            var deleteButton = $('<div>')
                .addClass('portlet-aroundButton portlet-deleteButton')
                .append($('<span>').addClass('icon-trash'))
                .click((function(widget){
                    return function(){
                        widget.portletContainer.remove();
                        reLocatingPlus();
                    }
                })(this));
            var settingButton = $('<div>').addClass('portlet-aroundButton portlet-settingButton')
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
                .append(portletTopPadding)
                .append(settingPanel)
                .append(this.portlet)
                .append(resizingHandle)
                .append(settingButton)
                .append(moveHandle)
                .append(deleteButton);

            // Add layouts containers
            var ul=$('<ul>');
            for(var i=0;i<this.layouts.length;i++){
                var li = $('<li>').width(pStack.width()).append( $('<div>').append(this.layouts[i]));
                ul.append( li );
            }
            this.portlet.find('.jcarousel').append(ul).jcarousel();

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
            layout1 = $('<div>').append(textField);

            textField.css('height',this.height ).hallo({plugins: {
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

        // Add layouts
        this.addLayout(layout1);
        this.addLayout(layout2);
        this.addLayout(layout3);
        this.addLayout(layout4);

        this.portlet.on('portlet:resized', function() {
            $(this).find('.textfield').css('height', $(this).height());
        });

        this.portlet.on('portlet:layoutChanged', function(e,idx) {
            console.log(idx,idx.old,idx.new);
        });

        this.contentSize=function(){

        }

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

        var layout1 = "image layout 1";
        var layout2 = "image layout 2";

        function initLayout1() {
            var file = $('<input type="file" name="picture" multiple hidden>');
            var img =  $('<img>')
                .height(this.height)
                .addClass('img-rounded portlet-picture')
                .attr('src','/images/upload.png');

            layout1 = $('<div>').append(img).append(file);

            if(editMode){
                file.fileupload({
                    url:'/flyer/upload',
                    dataType: 'json',
                    done: function (e, data) {
                        img.attr('src', '/uploads/' + data.result.files[0].name);
                    }
                });

                img.click(function(){
                    file.click()
                });

            } else {
                this.portlet.find('input[type=file]').remove();
            }
        }

        initLayout1.call(this);

        this.addLayout(layout1);
        this.addLayout(layout2);

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

        var layout1 = '';

        function initLayout() {
            layout1 = $('<iframe>')
                .attr('width','100%')
                .attr('height','100px')
                .attr('src','//www.youtube.com/embed/n_6p-1J551Y')
                .attr('frameborder','0');
        }

        initLayout();

        this.addLayout(layout1);
        this.addLayout('Video layout 2');

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

        var layout1 = '';

        function initLayout1() {
            layout1 = $('<a>')
                .addClass('btn btn-success')
                .text('Default')
                .hallo({});
        }

        initLayout1();

        this.addLayout(layout1);
        this.addLayout('ButtonWidget layout 2');

        this.getSettingPanel = function(){
            var input1 = $('<input>')
                .attr('id','displayText')
                .attr('placeholder', 'Display Text')
                .attr('type', 'text')
                .val(layout1.text());

            var input2 = $('<input>')
                .attr('id','url')
                .attr('placeholder', 'URL address')
                .attr('type', 'text')
                .val(layout1.attr('href'));

            var settingPanel = $('<div>').append(input1).append(input2);
            return settingPanel;
        }

        this.applySetting = function (settingPanel){
            layout1.text( settingPanel.find('#displayText').val() );
            layout1.attr('href', settingPanel.find('#url').val() );
        }

        this.serialize = function(){
            return {
                display: layout1.text(),
                url: layout1.attr('href')
            }
        }

        this.deserialize = function(content){
            layout1.text( content.display  );
            layout1.attr( 'href', content.url );
        }
    }
    ButtonWidget.prototype = new Widget();
    ButtonWidget.prototype.constructor = ButtonWidget;


    function TagWidget(){
        Widget.call(this);

        var layout1 = '';

        function initLayout1() {
            layout1 = $('<input>')
                .attr('type','text')
                .attr('name','tags')
                .attr('data-role','tagsinput')
                .attr('placeholder','Add tags')
                .val('')
                .load(function(){
                    $(this).tagsInput({})
                });
        }

        this.serialize = function() {
            return portlet.find('input[name="tags"]').val()
        }

        this.deserialize = function( content) {
            if(editMode)
                return portlet.find('input[name="tags"]').val(content);
            else
                return portlet.find('span[class="tag"]').text(content);
        };

        initLayout1();

        this.addLayout(layout1);

        layout1.tagsInput({})
    }
    TagWidget.prototype=new Widget();
    TagWidget.prototype.constructor=TagWidget;


    function VoiceWidget(){
        Widget.call(this);

        var layout1 = 'Voice Layout 1';

        function initLayout1() {

            layout1 = $('<div>');

            $.get('http://soundcloud.com/oembed?format=json&url=https://soundcloud.com/saghi-s/2vznv6x4pmxh')
                .done(function(res){
                    var embeded = $(res.html).height(100);
                    layout1.append(embeded);
                })
        }

        initLayout1();
        this.addLayout(layout1);

        this.serialize = function() {
        }

        this.deserialize = function( content) {
        };
    }
    VoiceWidget.prototype = new Widget();
    VoiceWidget.prototype.constructor = VoiceWidget;


    function MapWidget(){
        Widget.call(this);

        var layout1 = 'MapWidget layout 1';
        var layout2 = 'MapWidget layout 2';
        var mapAsImage = '';
        var mapbox = [];

        function initLayout1() {
            var id = 'map' + parseInt(Math.random()*100);
            var mapDiv =  $('<div>').attr('id',id);
            layout1 = $('<div>')
                .css('position', 'relative')
                .height( this.height )
                .width( pStack.width() )
                .append(mapDiv);

            mapbox[0] = L.mapbox.map(layout1[0], 'coybit.gj1c3kom');
        }

        function initLayout2() {
            var id = 'map' + parseInt(Math.random()*100);
            var mapDiv =  $('<div>').attr('id',id);
            layout2 =$('<div>')
                .css('position', 'relative')
                .height( this.height*0.7 )
                .width( pStack.width()*0.5 )
                .append(mapDiv);

            mapbox[1] = L.mapbox.map(layout2[0], 'coybit.gj1c3kom');
        }

        initLayout1.call(this);
        initLayout2.call(this);

        this.addLayout(layout1);
        this.addLayout(layout2);

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

            layout1.height(this.height)
                .width(pStack.width());

            layout2.height( this.height*0.7 )
                .width( pStack.width()*0.5 );
        });
    }
    MapWidget.prototype=new Widget();
    MapWidget.prototype.constructor=MapWidget;

    var initDimension = function() {

        var aspect_ratio = Math.sqrt(2);//0.90;
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
            .css('background-size', pStack.width() + 'px ' + pStack.height() + 'px' )
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