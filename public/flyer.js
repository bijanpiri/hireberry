function Flyer(options) {

    var editMode = options.editMode;
    var pStack = this;

    var widgetsType = { Unknow:0, Text:1, Picture:2, Video:3, Button: 4, Tag: 5, Map: 6 };

    function Widget(widgetType){
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

        this.widgetType = widgetType;
        this.init;
        this.serialize;
        this.deserialize;
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

    Widgets[widgetsType.Text] = new Widget({widgetType:widgetsType.Text})
        .onInit(function(portlet) {
            if(editMode){
                portlet.find('.portlet-content').append('<input type="text" name="text">')
            } else {
                portlet.find('.portlet-content').append('<span class="text"></span>');
            }
        })
        .onSerialize(function(portlet) {
            return portlet.find('input[type="text"]').val();
        })
        .onDeserialize(function(portlet, content) {
            if(editMode)
                return portlet.find('input[type="text"]').val(content);
            else
                return portlet.find('span[class="text"]').text(content);
        });


    Widgets[widgetsType.Picture] = new Widget({widgetType:widgetsType.Picture})
        .onInit(function(portlet, elementID) {

            portlet.find('.portlet-content').append(
                '<input type="file" name="picture" multiple>' +
                '<img alt="IMAGE" src="#" class="portlet-picture">');

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
            } else {
                portlet.find('input[type=file]').remove();
            }
        })
        .onSerialize(function(portlet) {
            return portlet.find('.portlet-picture').attr('src');
        })
        .onDeserialize(function(portlet, content) {
            return portlet.find('.portlet-picture').attr('src', content);
        });


    Widgets[widgetsType.Video] = new Widget({widgetType:widgetsType.Video})
        .onInit(function(portlet) {
            if(editMode)
                portlet.find('.portlet-content').append('<input type="text">')

            portlet.find('.portlet-content').append('<iframe width="560" height="314" frameborder="0" allowfullscreen></iframe>')
        })
        .onSerialize(function(portlet) {
            return portlet.find('input[type="text"]').val()
        })
        .onDeserialize(function(portlet, content) {
            if(editMode)
                return portlet.find('input[type="text"]').val(content);

            return portlet.find('iframe').attr('src',content);
        });

    Widgets[widgetsType.Button] = new Widget({widgetType:widgetsType.Button})
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

    Widgets[widgetsType.Tag] = new Widget({widgetType:widgetsType.Tag})
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

    Widgets[widgetsType.Map] = new Widget({widgetType:widgetsType.Map})
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

        var aspect_ratio = 0.75;
        pStack.height( pStack.width() * aspect_ratio );

        $(window).resize(function() {
            pStack.height( pStack.width() * aspect_ratio );
        });
    }

    var addCreationPortlet = function() {
        var portlet = [
            '<div class="portlet" id="portletCreator">',
            '   <div class="portlet-header">New Item</div>',
            '   <div class="portlet-content">',
            '       <div class="row-fluid text-center">',
            '           <div class="span1 newitem" type="picture"><i class="icon-picture"></i></div>',
            '           <div class="span1 newitem" type="text"><i class="icon-font"></i></div>',
            '           <div class="span1 newitem" type="video"><i class="icon-facetime-video"></i></div>',
            '           <div class="span1 newitem" type="button"><i class="icon-globe"></i></div>',
            '           <div class="span1 newitem" type="tag"><i class="icon-tag"></i></div>',
            '           <div class="span1 newitem" type="map"><i class="icon-map-marker"></i></div>',
            '       </div>',
            '   </div>',
            '</div>'
        ].join('');

        pStack.append(portlet);

        // Set click event
        $(function(){
            $(".newitem").click(function(e){
                var itemType = $(this).attr('type');
                var itemID = portletCounter++;
                var portletType = portletTypeString2Type(itemType);

                createPortlet( portletType, itemID, null );
            });
        });
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

        pStack.children().each(function(index) {
            emptySpaceHeight -= $(this).height();
        });

        return emptySpaceHeight;
    }

    var createPortlet = function( ptype, pid, content ) {
        var strType = portletType2string(ptype);

        var portlet = $('<div class="portlet"><div class="portlet-header">'+ strType +
            '</div><div class="portlet-content"></div></div>')
            .attr('id',pid)
            .attr('type',strType);

        pStack.append(portlet);

        initPortlet( portlet );

        // Init
        if(Widgets[ptype] && Widgets[ptype].init )
            Widgets[ptype].init(portlet, pid);

        // Set Content
        if(content && Widgets[ptype] && Widgets[ptype].deserialize )
            Widgets[ptype].deserialize(portlet, content);
    };

    var initPortlet = function(portlet) {
        // Show Close Button just In Edit Mode
        if(editMode) {
            portlet.find( ".portlet-header" )
                .addClass( "ui-widget-header ui-corner-all" )
                .prepend( "<span class='ui-icon ui-icon-closethick'></span>");

            portlet.find( ".portlet-header .ui-icon").first().click(function(e) {
                $(e.target).parent().parent().remove();
            });
        } else {
            portlet.find( ".portlet-header").remove();
        }
    }

    var json2flyer = function(flyerid) {

        $.get('/flyer/json/'+flyerid)
            .done(function(data){
                console.log(data)

                $('input[name=flyertext]').val(data.description);

                for( var i=1; i<data.count; i++ ){
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

        var flyer = {
            description: $('input[name=flyertext]').val(),
            flyerid:  $('input[name=flyerid]').val(),
            count: pStack.children().length
        };

        pStack.children().each(function(index) {

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
    initDimension();

    if(options.editMode)
        addCreationPortlet();

    if(options.flyerid)
        json2flyer(options.flyerid)

    // Public functions
    this.createPortlet = createPortlet;
    this.initPortlet = initPortlet;
    this.json2flyer = json2flyer;
    this.flyer2json = flyer2json;
    this.portletTypeString2Type = portletTypeString2Type;
    this.portletType2string = portletType2string;
    this.remaindedHeight = remaindedHeight;

    return this;
}

$.fn.Flyer = Flyer;