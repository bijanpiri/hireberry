function Flyer(options) {

    var editMode = options.editMode;
    var pStack = this;
    var portletCounter = 0;
    var widgetsType = { Unknow:0, Text:1, Picture:2, Video:3, Button: 4, Tag: 5, Map: 6 };
    var splitterIsHold;
    var splitterOwner;
    var splitterOriginY;
    var splitterOriginHeight;

    /****** Widget - Start *******/
    function Widget(){
        this.layouts = [];
        this.layoutIndex = 0;
        this.height = 100; //px
        this.portlet=$('<div>').addClass('portlet');

        this.serialize = function(){};

        this.deserialize = function(){};

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
                ul.append( $('<li>').append( $('<div>').append(this.layouts[i]) ) );
            }
            this.portlet.find('.jcarousel').append(ul).jcarousel();

            return this.portlet;
        }

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

        this.serialize=function(){
            return portlet.find('.portlet-content').html();
        }

        this.deserialize=function(){
            return portlet.find('.portlet-content').html(content);
        }
    }

    TextWidget.prototype = new Widget();
    TextWidget.prototype.constructor = TextWidget;


    function PictureWidget(){
        Widget.call(this);

            var file=
            $('<input type="file" name="picture" multiple hidden>');
        var img=$('<img alt="IMAGE" src="/images/upload.png" class="portlet-picture" style="height: '+ this.height*0.7 +'px">');
        var layout1=$('<div></div>').append(img).append(file);
            this.addLayout(layout1);

            if(editMode){
                file
//                    .attr('id','fileupload'+elementID)
                    .fileupload({
                        url:'/flyer/upload',
                        dataType: 'json',
                        done: function (e, data) {
                            img.attr('src', '/uploads/' + data.result.files[0].name);
                        }
                    });
                img.click(function(){
                    file.click();
                });
            } else {
                this.portlet.find('input[type=file]').remove();
            }
            this.addLayout("picture layout 2");
//        }
//        init();
        this.serialize=function(){
            return this.portlet.find('.portlet-picture').attr('src');
        }
        this.deserialize=function(portlet, content) {
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
    ButtonWidget.prototype=new Widget();
    ButtonWidget.prototype.constructor=ButtonWidget;

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

        this.addLayout('MapWidget layout 1');
        this.addLayout('MapWidget layout 2');
        function init() {
            var id = 'map' + portlet.attr('id');

            this.portlet.find('.portlet-content').append('<div style="height: 200px" id="' + id + '"></div>');

            L.mapbox.map(id, 'coybit.gj1c3kom');
        }
        init();
        this.serialize=function(){}
        this.deserialize=function(){}
    }
    MapWidget.prototype=new Widget();
    MapWidget.prototype.constructor=MapWidget;

    // Widgets Collection
    var Widgets = {};

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

    var portletTypeString2Type = function (strType) {
        switch(strType) {
            case 'text':
                return widgetsType.Text;
            case 'picture':
                return widgetsType.Picture;
            case 'video':
                return widgetsType.Video;
            case 'button':
                return widgetsType.Button;
            case 'tag':
                return widgetsType.Tag;
            case 'map':
                return widgetsType.Map;
            default:
                return widgetsType.Unknow;
        }
    }

    var portletType2string = function (type) {
        switch(type) {
            case widgetsType.Text:
                return 'text';
            case widgetsType.Picture:
                return 'picture';
            case widgetsType.Video:
                return 'video';
            case widgetsType.Button:
                return 'button';
            case widgetsType.Tag:
                return 'tag';
            case widgetsType.Map:
                return 'map';
            default:
                return 'Unknow';
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

    var createPortlet = function( ptype, pid, content ) {

        // Check Empty Space
        if( editMode && remaindedHeight() < 100 )
            return;

        var widget=new Widget();
        switch (ptype){
            case widgetsType.Text:
                widget=new TextWidget();
                break;
            case widgetsType.Picture:
                widget=new PictureWidget();
                break;
            case widgetsType.Video:
                widget=new VideoWidget();
                break;
            case widgetsType.Button:
                widget=new ButtonWidget();
                break;
            case widgetsType.Map:
                widget=new MapWidget();
                break;

        }
        var portlet = widget.content().attr('typeid',ptype);
        pStack.append(portlet);

        var h = widget.height;
        portlet.css('height',h);

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
                    console.log('Resizing...' + splitterOwner.attr('type') + e.clientY);

                    var curHeight = splitterOwner.height();
                    var newHeight = splitterOriginHeight +  (e.clientY - splitterOriginY);
                    var delta = newHeight-curHeight;

                    // Snap
                    if( remaindedHeight() - delta < 5 )
                        newHeight += remaindedHeight() - delta;

                    if( remaindedHeight() - delta >= 0){
                        splitterOwner.height( newHeight );
                        reLocatingPlus();
                    }
                }
            });

            reLocatingPlus();
        }
    };

    var json2flyer = function(flyerid) {

        $.get('/flyer/json/'+flyerid)
            .done(function(data){
                console.log(data)

                $('input[name=flyertext]').val(data.description);
                setBackground(data.background, false);

                for( var i=0; i<data.count; i++ ){
                    if( data[i] )
                        createPortlet(
                            parseInt(data[i].type),
                            data[i].ID,
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

            var portlet =  $(this);
            var ptype =  portletTypeString2Type( portlet.attr('type') );
            var pid =  portlet.attr('id');
            var widget = Widgets[ptype];

            flyer[index] = {
                "type": ptype,
                "ID": pid,
                "Contents":  ( widget && 'serialize' in widget && widget.serialize && widget.serialize(portlet))
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
               var itemType = $(this).attr('type');
               var itemID = portletCounter++;
               var portletType = portletTypeString2Type(itemType);

               createPortlet( portletType, itemID, null );
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
    this.portletTypeString2Type = portletTypeString2Type;
    this.portletType2string = portletType2string;
    this.remaindedHeight = remaindedHeight;
    this.setBackground = setBackground;
    this.getThumbnail = getThumbnail;

    return this;
}

$.fn.Flyer = Flyer;