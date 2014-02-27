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

    var idCounter=1;
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
        this.height = this.height || 100; //px
        this.settingPanelHieght = 100;
        this.type=0;
        this.settingPanelIsOpen = false;
        this.portlet = $('<div>').addClass('portlet').data('widget',this);
        this.portletContainer = $('<div>').addClass('portlet-container').width(pStack.width());
        this.settingPanel = ''; // Shortcut to setting panel element

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

            this.pStackNormalHeight = this.pStackNormalHeight || pStack.height();

            pStack.height( this.pStackNormalHeight + delta );
            this.portletContainer.find('.portlet-settingPanel').css('display','block').height(delta);
            this.portletContainer.height( this.portletContainer.height() + delta );
            this.settingPanelIsOpen = true;

            setTimeout(reLocatingPlus,duration);
        }

        this.closeSettingPanel = function(duration,delta){
            pStack.widgetWidthOpenSettingPanel = null;

            pStack.height(this.pStackNormalHeight);
            this.portletContainer.find('.portlet-settingPanel').css('display','none').height(0);
            this.portletContainer.height(this.portletContainer.height() - delta);
            this.settingPanelIsOpen = false;

            setTimeout(reLocatingPlus,duration);
        }

        this.content = function(){

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

            var setttingPanelInside = this.getSettingPanel();
            this.settingPanelHieght = setttingPanelInside.height();
            var settingPanel = $('<div>').height(this.settingPanelHieght).addClass('portlet-settingPanel')
                .append(setttingPanelInside)

            // Action Buttons
            var moveHandle = $('<div>').addClass('action-btn-frame move-btn-frame')
                .append($('<i>').addClass('action-btn move-btn'));

            var deleteButton = $('<div>').addClass('action-btn-frame delete-btn-frame')
                .append($('<i>').addClass('action-btn delete-btn'))
                .click((function(widget){
                    return function(){
                        widget.portletContainer.remove();
                        reLocatingPlus();
                    }
                })(this));

            var settingButton = $('<div>').addClass('action-btn-frame setting-btn-frame')
                .append($('<i>').addClass('action-btn setting-btn'))
                .click( (function(widget){
                    return function(){

                        //var delta = 200;
                        var delta = widget.settingPanelHieght;
                        var duration = 500;
                        widget.portletContainer
                            .find('.portlet-settingPanel')
                            .width('100%');

                        if( widget.settingPanelIsOpen )
                            widget.closeSettingPanel(duration,delta);
                        else
                            widget.openSettingPanel(duration,delta);
                    }
                })(this));

            this.portletContainer
                .append(settingPanel)
                .append(this.portlet)
                .append(resizingHandle)
                .append(settingButton)
                .append(moveHandle)
                .append(deleteButton);

            this.settingPanel = settingPanel;
            this.layout.height(this.height);
            this.portlet.append(this.layout);

            return this.portletContainer.append( this.portlet );
        }

        this.getSettingPanel = function () {
            return 'Default Setting Panel';
        }

        this.widgetDidAdd = function() {}

        this.applySetting = function (settingPanel){}

        this.resize=function(size){}

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

    function TextWidget(height){

        this.height = height || 200;
        Widget.call(this);

        var layout1='layout1';
        var layout2='layout2';
        var layout3='layout3';
        var layout4='layout4';

        function initLayout1(){
            var textField=$('<div>').addClass('textfield').addClass('portlet-content-text');
            layout1 = $('<div>').append(textField);

            textField.height( this.height ).hallo({
                plugins: {
                    'halloformat': {"bold": true, "italic": true, "strikethrough": true, "underline": true},
                    'hallolists' : {}
                }
            });
        }

        initLayout1.call(this);

        this.setLayout(layout1);

        this.portlet.on('portlet:resized', function() {
            $(this).find('.textfield').css('height', $(this).height());
        });

        this.portlet.on('portlet:layoutChanged', function(e,idx) {
            console.log(idx,idx.old,idx.new);
        });

        this.contentSize = function(){}

        this.getSettingPanel = function () {
            idCounter++;
            var x = $('.widgets>.textWidget').clone();

            x.height(240);

            x.find('*').each(
                function(i,elem){
                    if(elem.id)
                        elem.id=elem.id+'_'+idCounter;
                    if(elem.htmlFor)
                        elem.htmlFor=elem.htmlFor+'_'+idCounter;
                    if(elem.name)
                        elem.name=elem.name+'_'+idCounter;

                });
            x.find('#leftAlign_'+idCounter).click((function(widget){
                return function(){
                    widget.portlet.find('.textfield').css('text-align','left');
                }
            })(this));
            x.find('#centerAlign_'+idCounter).click((function(widget){
                return function(){
                    widget.portlet.find('.textfield').css('text-align','center');
                }
            })(this));
            x.find('#rightAlign_'+idCounter).click((function(widget){
                return function(){
                    widget.portlet.find('.textfield').css('text-align','right');
                }
            })(this));

            x.find('#rightAlign_'+idCounter).click((function(widget){
                return function(){
                    widget.portlet.find('.textfield').css('text-align','right');
                }
            })(this));
            x.find('#headline_'+idCounter).click((function(widget){
                return function(){
                    var textField=widget.portlet.find('.textfield');
                    textField.children('div').each(
                        function(id,line){
                            line.innerHTML=('<h2>'+line.innerHTML+'</h2>');
                        });

                    var html=textField.html()
                    var firstline=html.substr(0,html.indexOf('<div>'));
                    var rest=html.substr(html.indexOf('<div>'));
                    if(firstline.length>0)
                        firstline='<h2>'+firstline+'</h2>';
                    textField.html(firstline+rest);

                }
            })(this));

            x.find('#text_'+idCounter).click((function(widget){
                return function(){
                    var text=widget.portlet.find('.textfield');
                    text.html(text.html().replace(/<h2>/g,''));
                    text.html(text.html().replace(/<\/h2>/g,''));
                }
            })(this));
            return x;
        }

        this.serialize = function(){
            // ToDo: Save text-align too.
            var port=this.portlet.find('.portlet-content-text');
            var text=port.html();
            var align=port.css('text-align');
            var data=new TextData(text,align);


            return data;
        }

        this.deserialize = function(data){
            // ToDo: Retrieval text-align too.
            var id = this.portlet.parent().find('.'+data.align+'Align').attr('checked','checked');
            return this.portlet
                .find('.portlet-content-text')
                .html(data.text)
                .css('text-align',data.align);
        }
        function TextData(text,align){
            this.text=text;
            this.align=align;
        }
    }
    TextWidget.prototype = new Widget();
    TextWidget.prototype.constructor = TextWidget;


    function PictureWidget(){

        this.height = 160;

        Widget.call(this);

        var layout = "";

        function initLayout1() {
            var emptyStateHtml = '<div class="imageWidgetOuterContainer"><div class="imageWidgetInnerContainer">'+
                '<input type="file" name="picture" multiple hidden>'+
                '<i class="imageWidgetCamera"></i>'+
                '<div>Drop your pictures here</div>'+
                '<div>or <button class="wbtn wbtn-2 wbtn-2a browseImgBtn">Browse</button> your computer</div>'+
                '</div></div>';

            layout = $(emptyStateHtml);

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

        this.getSettingPanel = function () {
            var settingPanel = $('<div>');
            settingPanel.height(50);
            return settingPanel;
        }

        this.serialize=function(){
            return this.portlet.find('.portlet-picture').attr('src');
        }
        this.deserialize=function(content) {
            return this.portlet.find('.portlet-picture').attr('src', content);
        }
    }
    PictureWidget.prototype=new Widget();
    PictureWidget.prototype.constructor=PictureWidget;


    // Youtube Thumbnail: See this http://stackoverflow.com/a/2068371/946835
    function VideoWidget(){
        Widget.call(this);

        this.height = 150;
        var videoSourceURL;
        var layout = '';

        function showVideo() {
            var videoURL;

            // Youtube
            var parts = this.videoSourceURL.split('/')
            var videoID = parts[parts.length-1];
            videoURL = '//www.youtube.com/embed/' + videoID;

            var normalStateHtml = '<iframe width="356" height="150" frameborder="0" allowfullscreen></iframe>'
            this.portlet.html( $(normalStateHtml).attr('src', videoURL + '?rel=0') );

            // Update Setting Panel
            this.settingPanel.find('#videoWidgetInputboxText').val(this.videoSourceURL );
        }

        function initLayout() {
            var emptyStateHtml = '<div class="videoWidgetOuter">'+
                '<div class="videoWidgetInputboxOutter">'+
                '<input type="text" id="videoWidgetInputboxText" placeholder="Paste your video link here">'+
                '<button class="wbtn wbtn-2 wbtn-2a videoWidgetInputboxDone" id="Done">Done</button>'+
                '<div class="videoWidgetInputboxFooter">Youtube and Vimeo are supported</div>'+
                '</div></div></div>';

            layout = $(emptyStateHtml);

            layout.find('#Done').click( (function(widget){
                return function(){
                    widget.videoSourceURL = widget.portlet.find('#videoWidgetInputboxText').val();

                    showVideo.call(widget);
                }
            }(this)));
        }

        initLayout.call(this);

        this.setLayout(layout);

        this.portletContainer.on('portlet:resizing', (function(widget){
            return function(e,newHeight) {
                widget.height = newHeight;
                widget.portlet.find('iframe').attr('height',newHeight);
            }
        })(this))

        this.getSettingPanel = function () {
            var settingPanelHtml = '<div class="videoWidgetOuter">'+
                '<div class="videoWidgetInputboxOutter">'+
                '<input type="text" id="videoWidgetInputboxText" placeholder="Paste your video link here">'+
                '<button class="wbtn wbtn-2 wbtn-2a videoWidgetInputboxDone" id="Chanage">Done</button>'+
                '<div class="videoWidgetInputboxFooter">Youtube and Vimeo are supported</div>'+
                '</div></div></div>';

            var settingPanel = $(settingPanelHtml);

            settingPanel.height(160);

            settingPanel.find('#Chanage').click( (function(widget){
                return function(){
                    widget.videoSourceURL = widget.settingPanel.find('#videoWidgetInputboxText').val();
                    showVideo.call(widget);
                }
            }(this)));

            return settingPanel;
        }

        this.serialize = function() {
            return {videoURL: this.videoSourceURL};
        }

        this.deserialize = function( content ) {
            this.videoSourceURL = content.videoURL;
            showVideo.call(this);
        };
    }
    VideoWidget.prototype=new Widget();
    VideoWidget.prototype.constructor=VideoWidget;


    function ButtonWidget(){
        Widget.call(this);

        var layout = '';

        function initLayout() {
            layout = $('<a>')
                .addClass('btn btn-success')
                .text('Default')
                .hallo({});
        }

        initLayout.call(this);

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

        this.getSettingPanel = function () {
            var settingPanel = $('<div>');
            settingPanel.height(50);
            return settingPanel;
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

    // Sound Cloud 4 Test: http://soundcloud.com/oembed?format=json&url=https://soundcloud.com/saghi-s/2vznv6x4pmxh
    // Youtube 4 Test: //www.youtube.com/embed/n_6p-1J551Y
    function VoiceWidget(){
        Widget.call(this);

        this.height = 150;
        var layout = 'Voice Layout 1';

        function showVoice() {
            // SoundCloud
            $.get('http://soundcloud.com/oembed?format=json&url=' + this.voiceSourceURL)
                .done( (function(widget) {
                    return function(res){
                        var embeded = $(res.html).height(widget.height);
                        widget.portlet.html( embeded );
                    }
                })(this))

            // Update Setting Panel
            this.settingPanel.find('#videoWidgetInputboxText').val(this.voiceSourceURL );
        }

        function initLayout() {
            var inputbox = '<div class="videoWidgetInputboxOutter">'+
                '<input type="text" id="videoWidgetInputboxText" placeholder="Paste your video link here">'+
                '<button class="wbtn wbtn-2 wbtn-2a videoWidgetInputboxDone" id="done">Done</button>'+
                '<div class="videoWidgetInputboxFooter">Soundcloud is supported</div>'+
                '</div></div>';

            var outter = $('<div>').addClass('videoWidgetOuter').append(inputbox);
            layout = $(outter)

            layout.find('#done').click( (function(widget){
                return function(){
                    widget.voiceSourceURL = widget.portlet.find('#videoWidgetInputboxText').val();

                    showVoice.call(widget);
                }
            }(this)));
        }

        initLayout.call(this);

        this.setLayout(layout);

        this.getSettingPanel = function () {
            var settingPanelHtml = '<div class="videoWidgetOuter">'+
                '<div class="videoWidgetInputboxOutter">'+
                '<input type="text" id="videoWidgetInputboxText" placeholder="Paste your video link here">'+
                '<button class="wbtn wbtn-2 wbtn-2a videoWidgetInputboxDone" id="Chanage">Done</button>'+
                '<div class="videoWidgetInputboxFooter">Youtube and Vimeo are supported</div>'+
                '</div></div></div>';

            var settingPanel = $(settingPanelHtml);

            settingPanel.height(160);

            settingPanel.find('#Chanage').click( (function(widget){
                return function(){
                    widget.voiceSourceURL = widget.settingPanel.find('#videoWidgetInputboxText').val();
                    showVoice.call(widget);
                }
            }(this)));

            return settingPanel;
        }

        this.serialize = function() {
            return {voiceURL: this.voiceSourceURL};
        }

        this.deserialize = function( content ) {
            this.voiceSourceURL = content.voiceURL;
            showVoice.call(this);
        };
    }
    VoiceWidget.prototype = new Widget();
    VoiceWidget.prototype.constructor = VoiceWidget;


    function MapWidget(){
        Widget.call(this);

        this.height = 210;
        var layout = 'MapWidget layout 1';
        var geocoder;
        var map;
        var mapID;
        var marker;
        var updateMapTimer;

        function codeAddress() {
            var address = document.getElementById('address').value;
            geocoder.geocode( { 'address': address}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {

                    map.setCenter(results[0].geometry.location);

                    setMarker(results[0].geometry.location);

                } else {
                    alert('Geocode was not successful for the following reason: ' + status);
                }
            });
        }

        function setMarker(pos) {
            var image = {
                url: '/images/flyer-icons.png',
                size: new google.maps.Size(52, 53),
                origin: new google.maps.Point(0,700),//(0,-564),
                anchor: new google.maps.Point(52/2, 32)
            };

            if(marker)
                marker.setMap(null);

            marker = new google.maps.Marker({
                map: map,
                //icon: image,
                position: pos,
                draggable: true,
                title: "Drag me!"
            });
        }

        // Convert Lat/Lng to address
        function getAddress(position, callback) {

            geocoder.geocode({'latLng': position}, function(results, status) {

                if(status == google.maps.GeocoderStatus.OK)
                    callback(results[0]['formatted_address']);

            });
        }

        function getCurrentPosition(callback) {
            if(navigator.geolocation) {

                navigator.geolocation.getCurrentPosition(function(position) {

                    // Get Current Position
                    var pos = new google.maps.LatLng(position.coords.latitude,
                        position.coords.longitude);

                    callback(pos);

                }, function() {
                    // Error: The Geolocation service failed.
                });
            } else {
                // Error: Your browser doesn\'t support geolocation.
            }
        }

        function initLayout() {
            layout = $('.widgets .mapWidget').clone();

            mapID = 'map-canvas' + Math.floor(100*Math.random());
            layout.find('#map-canvas').attr('id',mapID);
        }

        this.widgetDidAdd = function() {
            geocoder = new google.maps.Geocoder();
            var latlng = new google.maps.LatLng(-34.397, 150.644);
            var mapOptions = {
                zoom: 15,
                center: latlng
            }

            // Load Map
            map = new google.maps.Map( document.getElementById(mapID), mapOptions);

            /*
            // Fill with default values; current user location
            getCurrentPosition( function(pos) {
                getAddress(pos, function(address) {
                    map.setCenter(pos);
                    layout.find('#address').val(address);
                    setMarker(pos);
                });
            });
*/


            // Set Events
            layout.find('#Getcode').click(codeAddress);
            layout.find('#address').keydown(
                function(){clearTimeout(updateMapTimer);
                    updateMapTimer = setTimeout(codeAddress,2000);
                })
        }


        initLayout.call(this);
        this.setLayout(layout);


        this.getSettingPanel = function () {
            var settingPanel = $('<div>');
            settingPanel.height(50);
            return settingPanel;
        }

        this.serialize = function(){
            return {
                mapCenter : [map.getCenter().d,map.getCenter().e],
                mapZoom : map.getZoom(),
                markerPos : [marker.position.d,marker.position.e],
                address : layout.find('#address').val()
            };
        }

        this.deserialize = function(content){
            if( content ){

                map.setCenter( new google.maps.LatLng(content.mapCenter[0], content.mapCenter[1]) );

                map.setZoom( parseInt(content.mapZoom) );

                setMarker( new google.maps.LatLng(content.markerPos[0], content.markerPos[1]) );

                layout.find('#address').val( content.address );
            }
        }

        this.enterToShotMode = function(completedCallback) {

            var img = this.portlet.find('.mapAsImage');

            var staticImgURL = 'http://maps.googleapis.com/maps/api/staticmap?'+
                'center='+ map.getCenter().d + ',' + map.getCenter().e +
                '&zoom='+ map.getZoom() +
                '&markers=color:red%7C' + marker.position.d + ',' + marker.position.e +
                '&size=320x170&maptype=roadmap&sensor=false'

            img.removeClass('mapAsImage-hide')
                .addClass('mapAsImage-show')
                .attr('src', staticImgURL)

            if( completedCallback )
                completedCallback()
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

        if( rh<64 ){

            if(animated) {
                $('.portletCreator')
                    .animate({
                        height: 100,
                        bottom: -60
                    }, 500)
                    .find('#portletCreatorAlarm')
                    .show();
                $('.portletCreator').find('#items').hide();
            }
            else {
                $('.portletCreator')
                    .css('height',100)
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
        var widget = new Widgets[wData.type](wData.height);
        var portlet = widget.content();
        widget.type = wData.type;
        pStack.append(portlet);

        widget.widgetDidAdd();

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
                handle: ".move-btn"
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