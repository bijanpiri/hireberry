function Flyer(options) {

    var editMode = options.editMode;
    var pStack = this;

    var TagWidget = null;

<<<<<<< HEAD
    var Widgets = [ Widget, TextWidget,PictureWidget,VideoWidget,ButtonWidget,TagWidget,MapWidget,VoiceWidget];

=======
    var Widgets = [
        Widget, TextWidget, PictureWidget,
        VideoWidget, ButtonWidget, TagWidget,
        MapWidget, VoiceWidget, WorkTypeWidget,
        PersonalInfoWidget, ResumeWidget, AnythingElseWidget,
        ProfilesWidget, SeperatorWidget, SkillWidget
    ];

    this.widgetWidthOpenSettingPanel = null;
    this.pStackNormalHeight;
>>>>>>> widgets are moved to flyerEditor (from booltin-job)

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


    $(document).delegate('.portlet iframe','focusin',function() {
        console.log('hello');
    });

    var idCounter=1;
    var toolbarid=1;


    /****** Widget - Start *******/
    function Widget(){
        this.type=0;
        this.portlet = $('<div>').addClass('portlet').data('widget',this);
        this.portletContainer = $('<div>').addClass('portlet-container').width(pStack.width());

        this.toolbar=$('<div>').addClass('toolbar').hide();

        this.dialog_confirm=  $('<div id="dialog-confirm"  title="Remove widget?">');

        this.serialize = function(){};
        this.deserialize = function(content){};
        this.enterToShotMode = function(completedCallback) {completedCallback()};
        this.exitFromShotMode = function() {};

        this.setLayout = function(layout){
            this.layout = layout;
        };


        this.content = function(){
            // Action Buttons
            var moveHandle = $('<div>').addClass('action-btn-frame move-btn-frame')
                .append($('<i>').addClass('action-btn move-btn'));

            var deleteButton = $('<div >').addClass('action-btn-frame delete-btn-frame')
                .append($('<i>').addClass('action-btn delete-btn'))
                .click((function(widget){
                    return function(){

                                   $( "#dialog-confirm" ).dialog({
                                    resizable: false,
                                    height:0,
                                    width:175,
                                    modal: true,
                                    draggable : false,
                                    position:'middle',
                                    buttons: {
                                        Ok: function() {
                                            $( this ).dialog( "close" );
                                            widget.portletContainer.remove();
                                            reLocatingPlus();
                                        },
                                        Cancel: function() {
                                            $( this ).dialog( "close" );
                                        }
                                    },
                                    close: function( event,ui ) {
                                        $( this ).dialog( "destroy" )
                                    },
                                    open:function(){
                                        $(".ui-dialog-titlebar-close").hide();
                                        //$(".ui-dialog-titlebar-close").removeClass(".ui-dialog-titlebar-close").addClass(".ui-button-icon-primary ui-icon ui-icon-closethick").show();

                                       }
                                   });
                    }

                })(this));

            this.portletContainer
                .append(this.dialog_confirm)
                .append(this.portlet)
                .append(this.toolbar)
                .append(moveHandle)
                .append(deleteButton);

            this.portlet.append(this.layout);

            return this.portletContainer.append( this.portlet );
        }

        this.widgetDidAdd = function(isNew) {}

        this.clone=function(widget){
            idCounter++;

            var x=$('.widgets>'+widget).clone();

            x.find('*').each(
                function(i,elem){
                    if(elem.id)
                        elem.id=elem.id+'_'+idCounter;
                    if(elem.htmlFor)
                        elem.htmlFor=elem.htmlFor+'_'+idCounter;
                    if(elem.name)
                        elem.name=elem.name+'_'+idCounter;
                    if($(elem).attr('data-target'))
                        $(elem).attr('data-target',$(elem).attr('data-target')+'_'+idCounter);

                });
            return x;
        }

        this.setToolbar=function(toolbar){
            this.toolbar.append($('.toolbars>'+toolbar).clone());

        }
        this.addToolbarCommand=function(command,callback){
            var widget=this;
            this.toolbar
                .find('[command^='+command+']')
                .click(function(){
                    args=$(this).attr('command').split(' ');
                    callback(widget,args);
                }
            );

        }
        this.restated=function(){
            console.log('restated');
        }
    }
    Widget.prototype.constructor = Widget;

    /****** Widget - End *******/

    function TextWidget(){


        Widget.call(this);

        this.layout='layout';

        function initLayout(){
            var x=this.clone('.textWidget');
            this.layout=x;
            return x;
        }

        this.setLayout(initLayout.call(this));

        this.portlet.on('portlet:layoutChanged', function(e,idx) {
            console.log(idx,idx.old,idx.new);
        });

        this.widgetDidAdd=function(isNew){
            var id='#'+this.layout.find('.text-widget').attr('id');
            this.toolbar
                .attr('data-role','editor-toolbar')
                .attr('data-target',id);

            this.setToolbar('.toolbar-text');
            this.addToolbarCommand('align',
                function(widget,args)
                {
                    widget.toolbar.find('[command^=align]').removeClass('btn-info');
                    widget.toolbar.find('[command="align '+args[1]+'"]').addClass('btn-info');
                    widget.portlet.find('.text-widget').css('text-align',args[1]);});


            this.addToolbarCommand('color',
                function(widget,args)
                {widget.portlet.find('.text-widget').css('color',args[1]);});

             this.addToolbarCommand('size',
                 function(widget,args)
                 {
                     widget.portlet.
                         find('.text-widget')
                         .css('font-size',args[1])
                         .css('line-height',args[1]);
                 });


            $(id).wysiwyg(
                {
                    activeToolbarClass:'btn-info',
                    toolbarSelector: '[data-target='+id+']'
                }
            );
        }

        this.restated=function(){

        };

        this.serialize = function(){

            var text=this.portlet.find('.text-widget');
            var data=new Object();
            data.text=text.html();
            data.align=text.css('text-align');
            data.headline=text.hasClass('header');
            data.foreColor=text.css('color');
            data.fontSize=text.css('font-size');

            return data;
        }

        this.deserialize = function(data){

            this.toolbar.find('[command="align '+data.align+'"]').addClass('btn-info');

            if(data.headline){
                this.portlet.parent().find('.headline').attr('checked','checked');
                this.portlet.find('.textfield').addClass('header');
            }
            return this.portlet
                .find('.text-widget')
                    .html(data.text)
                    .css('text-align',data.align)
                    .css('color',data.foreColor)
                    .css('font-size',data.fontSize)
                    .css('line-height',data.fontSize);
        }

    }
    TextWidget.prototype = new Widget();
    TextWidget.prototype.constructor = TextWidget;


    function PictureWidget(){



        Widget.call(this);

        var layout = "";

        function initLayout1() {
            layout = this.clone('.imageWidget');

            var file = layout.find('input[type=file]');
            layout.find('button').click(function(){file.click();});

            var widget=this;

            if(editMode){
                file.fileupload({
                    url:'/flyer/upload',
                    dataType: 'json',
                    done: function (e, data) {
                        var img=$('<img>');
                        layout.html(img);
                        img.attr('src', '/uploads/' + data.result.files[0].name);
                    },
                    progress:function (e, data) {
                        var progress = parseInt(data.loaded / data.total * 100, 10);
                    }
                });
                file.fileupload('option',{dropZone:layout});
            } else {
                this.portlet.find('input[type=file]').remove();
            }
        }

        initLayout1.call(this);

        this.setLayout(layout);

        // Setup the dnd listeners.
        this.handleFileSelect=function(evt) {
            var files = evt.target.files; // FileList object

            // files is a FileList of File objects. List some properties.
            var output = [];
            for (var i = 0, f; f = files[i]; i++) {
                output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                    f.size, ' bytes, last modified: ',
                    f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                    '</li>');
            }
            document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
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

        var videoSourceURL;
        var layout = '';

        function showVideo() {
            var videoURL;

            // Youtube
            var parts = this.videoSourceURL.split('/')
            var videoID = parts[parts.length-1];
            videoURL = '//www.youtube.com/embed/' + videoID;

            var iframe = $('<iframe width="100%" height="100%" frameborder="0" allowfullscreen></iframe>').attr('src', videoURL + '?rel=0')
            var container = $('<div class="videoWidget"></div>').append(iframe);
            this.portlet.html('').append(container);

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

        var layout = 'Voice Layout 1';

        function showVoice() {
            // SoundCloud
            $.get('http://soundcloud.com/oembed?format=json&url=' + this.voiceSourceURL)
                .done( (function(widget) {
                    return function(res){
                        widget.portlet.html( embeded );
                    }
                })(this))

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

        this.widgetDidAdd = function(isNew) {
            geocoder = new google.maps.Geocoder();
            var latlng = new google.maps.LatLng(-34.397, 150.644);
            var mapOptions = {
                zoom: 15,
                center: latlng
            }

            // Load Map
            map = new google.maps.Map( document.getElementById(mapID), mapOptions);

            // Fill with default values; current user location
            if( isNew ) {
                getCurrentPosition( function(pos) {
                    getAddress(pos, function(address) {
                        map.setCenter(pos);
                        layout.find('#address').val(address);
                        setMarker(pos);
                    });
                });
            }



            // Set Events
            layout.find('#Getcode').click(codeAddress);
            layout.find('#address').keydown(
                function(){clearTimeout(updateMapTimer);
                    updateMapTimer = setTimeout(codeAddress,2000);
                })
        }

        initLayout.call(this);
        this.setLayout(layout);

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

            var img = this.portlet.find('#map-image');

            var staticImgURL = 'http://maps.googleapis.com/maps/api/staticmap?'+
                'center='+ map.getCenter().d + ',' + map.getCenter().e +
                '&zoom='+ map.getZoom() +
                '&markers=color:red%7C' + marker.position.d + ',' + marker.position.e +
                '&size=320x170&maptype=roadmap&sensor=false'

            //img.show().attr('src','');

            img.load( completedCallback || function(){} );

            img.show().attr('src', staticImgURL)

            // ToDo: Wait to image load completely

            //if( completedCallback )
            //   completedCallback()
        }

        this.exitFromShotMode = function() {
            var img = this.portlet.find('#map-image');
            img.hide();
        }
    }
    MapWidget.prototype=new Widget();
    MapWidget.prototype.constructor=MapWidget;

<<<<<<< HEAD
=======
    function WorkTypeWidget(){
        Widget.call(this);

        this.height = 329;
        var layout = '';

        function initLayout() {
            layout = $('.widgets .workTypeWidget').clone();
        }

        initLayout.call(this);

        this.setLayout(layout);

        this.getSettingPanel = function () { return $('<div>') }

        this.serialize = function() {}

        this.deserialize = function( content ) {};
    }
    WorkTypeWidget.prototype=new Widget();
    WorkTypeWidget.prototype.constructor=WorkTypeWidget;

    function PersonalInfoWidget(){
        Widget.call(this);

        this.height = 252;
        var layout = '';

        function initLayout() {
            layout = $('.personalInfoWidget').clone();
        }

        initLayout.call(this);

        this.setLayout(layout);

        this.getSettingPanel = function () { return $('<div>') }

        this.serialize = function() {}

        this.deserialize = function( content ) {};
    }
    PersonalInfoWidget.prototype=new Widget();
    PersonalInfoWidget.prototype.constructor=PersonalInfoWidget;

    function ResumeWidget(){
        Widget.call(this);

        this.height = 200;
        var layout = '';

        function initLayout() {
            layout = $('.resumeWidget').clone();
        }

        initLayout.call(this);

        this.setLayout(layout);

        this.getSettingPanel = function () { return $('<div>') }

        this.serialize = function() {}

        this.deserialize = function( content ) {};
    }
    ResumeWidget.prototype=new Widget();
    ResumeWidget.prototype.constructor=ResumeWidget;

    function AnythingElseWidget(){
        Widget.call(this);

        this.height = 200;
        var layout = '';

        function initLayout() {
            layout = $('.anythingElseWidget').clone();
        }

        initLayout.call(this);

        this.setLayout(layout);

        this.getSettingPanel = function () { return $('<div>') }

        this.serialize = function() {}

        this.deserialize = function( content ) {};
    }
    AnythingElseWidget.prototype=new Widget();
    AnythingElseWidget.prototype.constructor=AnythingElseWidget;

    function ProfilesWidget(){
        Widget.call(this);

        this.height = 400;
        var layout = '';

        function initLayout() {
            layout = $('.profilesWidget').clone();
        }

        initLayout.call(this);

        this.setLayout(layout);

        this.getSettingPanel = function () { return $('<div>') }

        this.serialize = function() {}

        this.deserialize = function( content ) {};
    }
    ProfilesWidget.prototype=new Widget();
    ProfilesWidget.prototype.constructor=ProfilesWidget;

    function SeperatorWidget(){
        Widget.call(this);

        this.height = 150;
        var layout = '';

        function initLayout() {
            layout = $('.seperatorWidget').clone();
        }

        initLayout.call(this);

        this.setLayout(layout);

        this.getSettingPanel = function () { return $('<div>') }

        this.serialize = function() {}

        this.deserialize = function( content ) {};
    }
    SeperatorWidget.prototype=new Widget();
    SeperatorWidget.prototype.constructor=SeperatorWidget;

    function SkillWidget(){
        Widget.call(this);

        this.height = 150;
        var layout = '';

        function initLayout() {
            layout = $('.skillWidget').clone();
        }

        initLayout.call(this);

        this.setLayout(layout);

        this.getSettingPanel = function () { return $('<div>') }

        this.serialize = function() {}

        this.deserialize = function( content ) {};
    }
    SkillWidget.prototype=new Widget();
    SkillWidget.prototype.constructor=SkillWidget;

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
>>>>>>> widgets are moved to flyerEditor (from booltin-job)

    var createPortlet = function( wData ) {

        // Create a widget and initializing it
        var widget = new Widgets[wData.type]();
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
                var widgetData = data.widgets;
                var nWidgets = widgetData ? widgetData.length : 0;

                for( var i=0; i<nWidgets; i++ ){
                    if( widgetData[i] )
                        createPortlet(
                            {
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

    var setLogo = function (url, wrapper) {
        $('.portletHeader .logo').attr('src',url);
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