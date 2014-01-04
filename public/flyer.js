function Flyer(isInEditMode) {

    var editMode = isInEditMode;

    // Widget HTML code
    var textWidget = [
        '<div>',
        '<input type="text" name="text">',
        '</div>'
    ].join('');
    var pictureWidget = [
        '<div>',
        '<input type="file" name="picture" multiple>',
        '<img alt="IMAGE" src="#" class="portlet-picture"></img>',
        '</div>'
    ].join('');

    //
    var Widgets = {};
    Widgets['Text'] = {
        html:textWidget,
        init: function(portlet) {
            if(!editMode)
                portlet.find('input[type="text"]').prop('readonly', true);
        },
        getContent: function(portlet) {
            return portlet.find('input[type="text"]').val();
        },
        setContent: function(portlet, content) {
            return portlet.find('input[type="text"]').val(content);
        }
    };
    Widgets['Picture'] = {
        html: pictureWidget,
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
    var createPortlet = function(ptype,pid,content) {
        var portlet = $('<div class="portlet"><div class="portlet-header">'+ ptype +
            '</div><div class="portlet-content"></div></div>')
            .attr('id',pid)
            .attr('type',ptype)
            .appendTo('#portletStack');
        initPortlet( portlet );

        portlet.find('.portlet-content').append(Widgets[ptype].html);

        if(content && Widgets[ptype] && Widgets[ptype].setContent )
            Widgets[ptype].setContent(portlet, content);

        if(Widgets[ptype] && Widgets[ptype].init )
            Widgets[ptype].init(portlet, pid);
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
            var ptype =  portlet.attr('type');
            var pid =  portlet.attr('id');
            var widget = Widgets[ptype];

            flyer[index] = {
                "type":ptype,
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
}
