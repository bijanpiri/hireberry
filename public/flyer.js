function Flyer(options) {

    var editMode = options.editMode;
    var pStack = this;
    var portletCounter = 0;
    var layoutIndex = 0;
    var widgetsType = { Unknow:0, Text:1, Picture:2, Video:3, Button: 4, Tag: 5, Map: 6 };


    function Widget(options){

        this.onInit = function(callback){
            this.init = callback;
            return this;
        };

        this.onSerialize = function(callback){
            this.serialize = callback;
            return this;
        };

        this.onDeserialize = function(callback){
            this.deserialize = callback;
            return this;
        };

        this.onNextLayout = function(callback){
            this.nextLayout = callback;
            return this;
        };

        this.onPrevLayout = function(callback){
            this.prevLayout = callback;
            return this;
        };

        this.widgetType = options.widgetType;
        this.height = 100; //px
        this.hasLayout = options.hasLayout;
        this.init;
        this.serialize;
        this.deserialize;
        this.nextLayout;
        this.prevLayout;
    }

    /******** As A Sample **********
     var w = new Widget().onInit(function(){
        console.log('inited');
    }).onSerialize(function(){
            console.log('serialized')
    }).onDeserialize(function(){
            console.log('deserialized')
    });
     w.init();
     w.serialize();
     w.deserialize();
     ******************************/

    // Widgets Collection
    var Widgets = {};

    Widgets[widgetsType.Text] = new Widget({widgetType:widgetsType.Text, hasLayout:false})
        .onInit(function(portlet) {

            //portlet.find('.portlet-content').append('<p></p>');

            portlet.click(function(e){
                $(this).addClass('inEditMode').focus();
            });

            if(editMode){
                portlet.hallo({
                    plugins: {
                        'halloformat': {}
                    }
                })
            }
        })
        .onSerialize(function(portlet) {
            return portlet.text();
        })
        .onDeserialize(function(portlet, content) {
            return portlet.text(content);
        })


    Widgets[widgetsType.Picture] = new Widget({widgetType:widgetsType.Picture, hasLayout:true})
        .onInit(function(portlet, elementID) {

            portlet.find('.portlet-content').append(
                '<input type="file" name="picture" multiple hidden>' +
                    '<img alt="IMAGE" src="/images/upload.png" class="portlet-picture" style="height: '+ this.height*0.7 +'px">');

            if(editMode){
                portlet.find('input[type=file]')
                    .attr('id','fileupload'+elementID)
                    .fileupload({
                        url:'/flyer/upload',
                        dataType: 'json',
                        done: function (e, data) {
                            portlet.find('.portlet-picture').attr('src', '/uploads/' + data.result.files[0].name);
                        }
                    });
                portlet.find('img').click(function(){
                    portlet.find('input[type=file]').click();
                });
            } else {
                portlet.find('input[type=file]').remove();
            }
        })
        .onSerialize(function(portlet) {
            return portlet.find('.portlet-picture').attr('src');
        })
        .onDeserialize(function(portlet, content) {
            return portlet.find('.portlet-picture').attr('src', content);
        })
        .onNextLayout(function(){

        })
        .onPrevLayout(function(){

        });


    Widgets[widgetsType.Video] = new Widget({widgetType:widgetsType.Video, hasLayout:false})
        .onInit(function(portlet) {
            if(editMode)
                portlet.find('.portlet-content').append('<input type="text">')
            portlet.find('.portlet-content').append('<iframe width="560" height="100" frameborder="0" allowfullscreen></iframe>')
        })
        .onSerialize(function(portlet) {
            return portlet.find('input[type="text"]').val()
        })
        .onDeserialize(function(portlet, content) {
            if(editMode)
                return portlet.find('input[type="text"]').val(content);

            return portlet.find('iframe').attr('src',content);
        });

    Widgets[widgetsType.Button] = new Widget({widgetType:widgetsType.Button, hasLayout:false})
        .onInit(function(portlet) {
            if(editMode)
                portlet.find('.portlet-content').append('<input type="text">');
            else
                portlet.find('.portlet-content').append('<a class="btn"></a>');
        })
        .onSerialize(function(portlet) {
            return portlet.find('input[type="text"]').val()
        })
        .onDeserialize(function(portlet, content) {
            if(editMode)
                return portlet.find('input[type="text"]').val(content);
            else
                return portlet.find('a[class="btn"]').text(content).attr('href',content);
        });

    Widgets[widgetsType.Tag] = new Widget({widgetType:widgetsType.Tag, hasLayout:false})
        .onInit(function(portlet) {
            if(editMode){
                portlet.find('.portlet-content').append('<input type="text" name="tags" data-role="tagsinput" placeholder="Add tags">');

                // ToDo: tagsinput doesn't work!
                //portlet.find('input[type="text"]').tagsinput('refresh');
            }
            else
                portlet.find('.portlet-content').append('<span class="tag"></span>');
        })
        .onSerialize(function(portlet) {
            return portlet.find('input[name="tags"]').val()
        })
        .onDeserialize(function(portlet, content) {
            if(editMode)
                return portlet.find('input[name="tags"]').val(content);
            else
                return portlet.find('span[class="tag"]').text(content);
        });

    Widgets[widgetsType.Map] = new Widget({widgetType:widgetsType.Map, hasLayout:false})
        .onInit(function(portlet) {
            var id = 'map' + portlet.attr('id');

            portlet.find('.portlet-content').append('<div style="height: 200px" id="' + id + '"></div>');

            L.mapbox.map(id, 'coybit.gj1c3kom');
        })
        .onSerialize(function(portlet) {
            return '';
        })
        .onDeserialize(function(portlet, content) {
            return '';
        });

    // Functions

    // Set PortletStack size (A4 1.4) height/width = sqrt(2)
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
                .css('bottom',-50)
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
        if( remaindedHeight() < 100 )
            return;

        var strType = portletType2string(ptype);

        var portlet = $(
            '<div class="portlet">'+
                '<div class="portlet-content"></div>'+
                '<div class="portlet-nextLayout"></div>' +
                '<div class="portlet-prevLayout"></div>' +
                '</div>')
            .attr('id',pid)
            .attr('type',strType)
        pStack.append(portlet);

        // Init
        if(Widgets[ptype] && Widgets[ptype].init )
            Widgets[ptype].init(portlet, pid);

        // Set Content
        if(content && Widgets[ptype] && Widgets[ptype].deserialize )
            Widgets[ptype].deserialize(portlet, content);

        var h = Widgets[ptype].height;

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
            portlet.find('.portlet-nextLayout')
                .css('top',(h-32)/2 )
                .css('right',-32)
                .click(function(){

                    console.log('Next');
                });

            // Previous Layout Button
            portlet.find('.portlet-prevLayout')
                .css('top',(h-32)/2)
                .css('left',-32)
                .click(function(){
                    console.log('Prev');
                });

            portlet.find('.portlet-handle')
                .css('top',0)
                .css('left',0)
                .click(function(){
                    console.log('Handle');
                });

            portlet.mouseenter(function(){
                portlet.find('.portlet-closeButton').show();
                portlet.find('.portlet-settingButton').show();
                portlet.find('.portlet-moveButton').show();

                var w = Widgets[ parseInt( $(this).attr('id') ) ];

                if( w && w.hasLayout ){
                    portlet.find('.portlet-nextLayout').show();
                    portlet.find('.portlet-prevLayout').show();
                }
            });
            portlet.mouseleave(function(){
                portlet.find('.portlet-closeButton').hide();
                portlet.find('.portlet-settingButton').hide();
                portlet.find('.portlet-moveButton').hide();

                var w = Widgets[ parseInt( $(this).attr('id') ) ];

                if( w && w.hasLayout ){
                    portlet.find('.portlet-nextLayout').hide();
                    portlet.find('.portlet-prevLayout').hide();
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
                pStack.css('background-image',data.background)
                    .css('background-size','contain');

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

    if(options.editMode){

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
    }

    var setBackground = function (url) {
        pStack
            .css('background-image','url("' + url + '")')
            .css('background-size','contain');
    }

    if(options.flyerid)
        json2flyer(options.flyerid)

    // Public functions
    this.createPortlet = createPortlet;
    this.json2flyer = json2flyer;
    this.flyer2json = flyer2json;
    this.portletTypeString2Type = portletTypeString2Type;
    this.portletType2string = portletType2string;
    this.remaindedHeight = remaindedHeight;
    this.setBackground = setBackground;
    return this;
}

$.fn.Flyer = Flyer;