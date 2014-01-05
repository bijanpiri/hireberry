function Flyer(isInEditMode) {

    var editMode = isInEditMode;

    var widgetsType = {Unknow:0, Text:1, Picture:2};

    function widget(){
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


        this.init;
        this.serialize;
        this.deserialize;
    }

    var w = new widget().onInit(function(){
        console.log('init');
    }).onSerialize(function(){
            console.log('serialize')
    });

    w.init();

    // Widgets Collection
    var Widgets = {};

    Widgets[widgetsType.Text] = {
        html: '',
        init: function(portlet) {
            if(editMode){
                portlet.find('.portlet-content').append('<input type="text" name="text">')
            } else {
                portlet.find('.portlet-content').append('<span class="text"></span>');
            }
        },
        getContent: function(portlet) {
            return portlet.find('input[type="text"]').val();
        },
        setContent: function(portlet, content) {
            if(editMode)
                return portlet.find('input[type="text"]').val(content);
            else
                return portlet.find('span[class="text"]').text(content);
        }
    };

    Widgets[widgetsType.Picture] = {
        html: [
            '<div>',
            '<input type="file" name="picture" multiple>',
            '<img alt="IMAGE" src="#" class="portlet-picture"></img>',
            '</div>'
        ].join(''),
        init: function(portlet, elementID) {

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
        },
        getContent: function(portlet) {
            return portlet.find('.portlet-picture').attr('src');
        },
        setContent: function(portlet, content) {
            return portlet.find('.portlet-picture').attr('src', content);
        }
    };

    // Functions

    var portletTypeString2Type = function (strType) {
        switch(strType) {
            case 'text':
                return widgetsType.Text;
            case 'picture':
                return widgetsType.Picture;
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
            default:
                return 'Unknow';
        }
    }

    var createPortlet = function(ptype,pid,content) {
        var strType = portletType2string(ptype);

        var portlet = $('<div class="portlet"><div class="portlet-header">'+ strType +
            '</div><div class="portlet-content"></div></div>')
            .attr('id',pid)
            .attr('type',strType)
            .appendTo('#portletStack');
        initPortlet( portlet );

        portlet.find('.portlet-content').append(Widgets[ptype].html);

        if(Widgets[ptype] && Widgets[ptype].init )
            Widgets[ptype].init(portlet, pid);

        if(content && Widgets[ptype] && Widgets[ptype].setContent )
            Widgets[ptype].setContent(portlet, content);
    };

    var initPortlet = function(portlet) {
        portlet.addClass( "ui-widget ui-widget-content ui-helper-clearfix ui-corner-all" )

        // Show Close Button just In Edit Mode
        if(isInEditMode) {
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

    var json2flyer = function() {

        var flyerid = $('input[name=flyerid]').val();

        $.get('/flyer/json/'+flyerid)
            .done(function(data){
                console.log(data)

                $('input[name=flyertext').val(data.description);

                for( var i=1; i<data.count; i++ ){
                    if( data[i] )
                        createPortlet(data[i].type,data[i].ID,data[i].Contents);
                }
            })
            .fail(function(data){
                console.log(data)
            });
    }

    var loadLastFlyer = function() {
        json2flyer();
    }

    var flyer2json = function() {
        var flyer = {
            description: $('input[name=flyertext').val(),
            flyerid:  $('input[name=flyerid').val(),
            count: $('#portletStack').children().length
        };

        $('#portletStack').children().each(function(index) {

            var portlet =  $(this);
            var ptype =  portletTypeString2Type( portlet.attr('type') );
            var pid =  portlet.attr('id');
            var widget = Widgets[ptype];

            flyer[index] = {
                "type": ptype,
                "ID": pid,
                "Contents":  ( widget && 'getContent' in widget && widget.getContent && widget.getContent(portlet))
            };
        });

        return flyer;
    }


    this.createPortlet = createPortlet;
    this.initPortlet = initPortlet;
    this.json2flyer = json2flyer;
    this.flyer2json = flyer2json;
    this.loadLastFlyer = loadLastFlyer;
    this.portletTypeString2Type = portletTypeString2Type;
    this.portletType2string = portletType2string;
}
