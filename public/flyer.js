function Flyer(options) {

    var editMode = options.editMode;
    var pStack = this;
    var splitterIsHold;
    var splitterOwner;
    var splitterOriginY;
    var splitterOriginHeight;
    var Widgets=[Widget,TextWidget,PictureWidget,VideoWidget,ButtonWidget,TagWidget,MapWidget];

    /****** Widget - Start *******/
    function Widget(){
        this.layouts = [];
        this.layoutIndex = 0;
        this.height = 100; //px
        this.type=0;
        this.portlet=$('<div>').addClass('portlet').data('widget',this);

        this.serialize = function(){};

        this.deserialize = function(content){};

        this.addLayout = function(layout){
                this.layouts.push(layout);
        };

        this.nextLayout = function(event){
                var w = event.data;
                w.layoutIndex=(w.layoutIndex+1)%w.layouts.length;
                w.layoutChanged();
        };

        this.prevLayout = function(event){
                var w = event.data;
                w.layoutIndex=(w.layoutIndex-1+w.layouts.length)%w.layouts.length;
                w.layoutChanged();
        };

        this.layoutChanged = function(){
                this.portlet.find('.jcarousel').jcarousel('scroll',this.layoutIndex);
        };

        this.content = function(){

            var leftButton = $('<a>').addClass("jcarousel-control-prev").append('‹').click(this,this.prevLayout);
            var rightButton = $('<a>').addClass("jcarousel-control-next").append('›').click(this,this.nextLayout);
            var centerPanel = $('<div>').addClass('jcarousel').attr('data-jcarousel','true').attr('data-wrap','circular');
            var resizingHandle = $('<div>').addClass('portlet-splitter');

            this.portlet
                .append(leftButton)
                .append(rightButton)
                .append(centerPanel)
                .append(resizingHandle);

            // Add layouts containers
            var ul=$('<ul>');
            for(var i=0;i<this.layouts.length;i++){
                var li = $('<li>').width(pStack.width()).append( $('<div>').append(this.layouts[i]));
                ul.append( li );
            }
            this.portlet.find('.jcarousel').append(ul).jcarousel();

            return this.portlet;
        }

        this.resized = function() {};

        this.hasLayout=function(){
            return (this.layouts.length > 1);
        }
    }

    Widget.prototype.constructor = Widget;

    /****** Widget - End *******/

    function TextWidget(){

        Widget.call(this);

        var layout1='layout1';
        var layout2='layout2';
        var layout3='layout3';
        var layout4='layout4';

        function initLayout1(){
            layout1 = $('<div>').append(
                $('<div>').addClass('textfield').addClass('portlet-content-text')
            );

            layout1.find('.textfield').hallo({
                plugins: {
                    'halloformat': {"bold": true, "italic": true, "strikethrough": true, "underline": true},
                    'hallojustify' : {},
                    'hallolists' : {},
                    'halloheadings': {}
                }
            });
        }

        initLayout1();

        // Add layouts
        this.addLayout(layout1);
        this.addLayout(layout2);
        this.addLayout(layout3);
        this.addLayout(layout4);

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
                .height(this.height*0.7)
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

        this.portlet.on('portlet:resized', function() {
            this.height = $(this).height();

            $(this).find('.portlet-picture').height( this.height*0.7 )
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

        this.addLayout('Video layout 1');
        this.addLayout('Video layout 2');
    }
    VideoWidget.prototype=new Widget();
    VideoWidget.prototype.constructor=VideoWidget;


    function ButtonWidget(){
        Widget.call(this);

        this.addLayout('ButtonWidget layout 1');
        this.addLayout('ButtonWidget layout 2');

        this.serialize=function(){
            return this.portlet.find('input[type="text"]').val()
        }
        this.deserialize=function(){

            if(editMode)
                return this.portlet.find('input[type="text"]').val(content);
            else
                return this.portlet.find('a[class="btn"]').text(content).attr('href',content);

        }
    }
    ButtonWidget.prototype = new Widget();
    ButtonWidget.prototype.constructor = ButtonWidget;


    function TagWidget(){
        Widget.call(this);

        this.init=function() {
            if(editMode){
                portlet.find('.portlet-content').append('<input type="text" name="tags" data-role="tagsinput" placeholder="Add tags">');

//                ToDo: tagsinput doesn't work!
                portlet.find('input[type="text"]').tagsinput('refresh');
            }
            else
                portlet.find('.portlet-content').append('<span class="tag"></span>');
        }
        this.serialize=function() {
            return portlet.find('input[name="tags"]').val()
        }
        this.deserialize=function( content) {
            if(editMode)
                return portlet.find('input[name="tags"]').val(content);
            else
                return portlet.find('span[class="tag"]').text(content);
        };
    }
    TagWidget.prototype=new Widget();
    TagWidget.prototype.constructor=TagWidget;


    function MapWidget(){
        Widget.call(this);

        var layout1 = 'MapWidget layout 1';
        var layout2 = 'MapWidget layout 2';
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

        // ToDo: PROBLEM
        //L.mapbox.map(id, 'coybit.gj1c3kom');

        this.serialize = function(){
            return {
                center: mapbox[this.layoutIndex].getCenter(),
                zoom: mapbox[this.layoutIndex].getZoom()
            };
        }
        this.deserialize = function(content){
            if( content ){
                mapbox[0].setView( content.center, content.zoom );
                mapbox[1].setView( content.center, content.zoom );
            }
        }
    }
    MapWidget.prototype=new Widget();
    MapWidget.prototype.constructor=MapWidget;

    var initDimension = function() {

        var aspect_ratio = 0.90;
        pStack.height( pStack.width() * aspect_ratio );

        $(window).resize(function() {
            pStack.height( pStack.width() * aspect_ratio );
        });
    }

    var reLocatingPlus = function() {
        var rh = remaindedHeight();

        if( rh<30 ){
            $('.portletCreator').css('height',50)
                .css('bottom',-60)
                .find('#portletCreatorAlarm')
                .show();
        }
        else {
            $('.portletCreator').css('height',remaindedHeight())
                .css('bottom',0)
                .find('#portletCreatorAlarm')
                .hide();
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

    var createPortlet = function( ptype, content ) {

        // Check Empty Space
        if( editMode && remaindedHeight() < 100 )
            return;

        var widget = new Widgets[ptype]();

        var portlet = widget.content();
        widget.type=ptype;
        pStack.append(portlet);

        var h = widget.height;
        portlet.css('height',h);

        widget.deserialize(content);

        if(editMode) {
            // Close button
            $("<span class='portlet-closeButton ui-icon ui-icon-closethick'></span>")
                .click(function(e) {
                    $(e.target).parent().remove();
                    reLocatingPlus();
                })
                .appendTo(portlet);

            $("<span class='portlet-settingButton ui-icon ui-icon-gear'></span>")
                .click(function(e) {
                    console.log('Setting');;
                })
                .appendTo(portlet);

            $("<span class='portlet-moveButton ui-icon ui-icon-arrow-4'></span>")
                .click(function(e) {})
                .appendTo(portlet);

            // Next Layout Button
            portlet.find('a.jcarousel-control-next')
                .css('top',(h-30)/2 );

            // Previous Layout Button
            portlet.find('a.jcarousel-control-prev')
                .css('top',(h-30)/2);


            portlet.find('.portlet-handle')
                .css('top',0)
                .css('left',0)
                .click(function(){
                    console.log('Handle');
                });

            portlet.find('.portlet-splitter').mousedown(function(e){
                splitterIsHold = true;
                splitterOwner = $(this).parent();
                splitterOriginY = e.clientY;
                splitterOriginHeight = splitterOwner.height();
            });

            $('body').mouseup(function(e){
                splitterIsHold = false;
            });

            // pStack.parent = portletStack + portletCreator
            pStack.parent().mousemove(function(e){
                if( splitterIsHold ) {
                    console.log('Resizing...' + splitterOwner.attr('id') + e.clientY);

                    var curHeight = splitterOwner.height();
                    var newHeight = splitterOriginHeight +  (e.clientY - splitterOriginY);
                    var delta = newHeight-curHeight;

                    // Snap
                    if( remaindedHeight() - delta < 5 )
                        newHeight += remaindedHeight() - delta;

                    $(e.target).parent().trigger('portlet:resized');

                    if( remaindedHeight() - delta >= 0){
                        splitterOwner.height( newHeight );
                        reLocatingPlus();
                    }
                }
            });

            reLocatingPlus();
        }
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

                for( var i=0; i<data.count; i++ ){
                    if( data[i] )
                        portletCounter++;

                        createPortlet(
                            data[i].type,
                            data[i].Contents);
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
            count: portlets.length
        };

        portlets.each(function(index) {
            var widget = $(this).data('widget');
            flyer[index] = {
                "type": widget.type,
                "Contents":  ( widget  && widget.serialize())
            };
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

    var initPortletsStack = function () {
       // Initialization
       if( editMode ){
           pStack.sortable({
               connectWith: ".portletStack",
               cursor: "move",
               axis: "y",
               handle: ".portlet-moveButton"
           })//.disableSelection();
       }

       initDimension();

       // Set click event
       $(function(){
           reLocatingPlus();

           $(".newitem").click(function(e){
               var itemType = parseInt($(this).attr('type'));
               createPortlet( itemType, null );
           });
       });

       if(options.flyerid)
           json2flyer(options.flyerid)
    }

    initPortletsStack();

    // Public functions
    this.createPortlet = createPortlet;
    this.json2flyer = json2flyer;
    this.flyer2json = flyer2json;
    this.remaindedHeight = remaindedHeight;
    this.setBackground = setBackground;
    this.getThumbnail = getThumbnail;

    return this;
}

$.fn.Flyer = Flyer;