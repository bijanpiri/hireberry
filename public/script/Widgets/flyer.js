var TagWidget = null;

var Widgets = [
    Widget, TextWidget, PictureWidget,
    VideoWidget, ButtonWidget, TagWidget,
    MapWidget, BadgeWidget, WorkTypeWidget,
    PersonalInfoWidget, ResumeWidget, AnythingElseWidget,
    ProfilesWidget, SeperatorWidget, SkillWidget
];
var editMode;
function Flyer(options) {

    editMode = options.editMode;
    var pStack = this;

    this.pStackNormalHeight;

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
        function(event){
            $('.toolbar').hide();

            if( $(this).hasClass('move-btn')==false && $(this).hasClass('delete-btn')==false )
                $(this).closest('.portlet-container').find('.toolbar').show();
            else
                event.stopPropagation();
        });
    $(document).delegate('.portlet-container>*','mousedown',
        function(event){
            event.stopPropagation();
        });

    $(document).delegate('.portlet-container' ,'mousedown',
        function(event){
            $('.toolbar').hide();
            event.stopPropagation();
        });

    if( editMode==false )
        $('.portletCreator').hide();
    else
        $('.portletSubmittion').hide();

    var createPortlet = function( wData ) {

        // Create a widget and initializing it

        if(Widgets[wData.type].instances==0){
            alert("You can not use more widget of this type.");
            return;
        }
        Widgets[wData.type].instances--;

        var widget = new Widgets[wData.type]();
        widget.editMode = editMode;
        widget.flyerID = $('input[name=flyerid]').val();
        var portlet = widget.content();

        if ((widget instanceof ProfilesWidget) &&  editMode==true )
        {
            portlet.find(".profileAddress").find("input").each(function(i,input)
            {
               //$(input).hide();
               //-------Use one of these for disabling input text--------
               //$(input).attr("disabled", "disabled");
               //$(input).prop("disabled", "disabled");
               $(input).prop('readOnly','readOnly');

                //Default cursor type in here is 'not-allowed'
               $(input).css('cursor','default');
               //--------------------------------------------------------
            });
        }

        widget.type = wData.type;
        pStack.append(portlet);

        // Parameter: is it new?
        widget.widgetDidAdd( (wData.content==null) );

        if( editMode ) {
            widget.portlet
                .mouseenter(function(){ $(this).addClass('portlet-hover');})
                .mouseleave(function(){$(this).removeClass('portlet-hover');})
        }

        if(wData.layoutIndex){
            widget.layoutIndex = wData.layoutIndex;
            widget.layoutChanged();
        }

        if(wData.content)
            widget.deserialize(wData.content);
    };

    var json2flyer = function(templateID, flyerid, callback) {

        $.get('/flyer/' + templateID + '/json/'+flyerid)
            .done(function(data){
                if( callback ){
                    callback(data);
                    return;
                }
                $('input[name=flyertext]').val(data.description);
                setBackground(data.background, false);
                setLogo(data.logo);

                var widgetData = data.widgets;
                var nWidgets = widgetData ? widgetData.length : 0;

                for( var i=0; i<nWidgets; i++ ){
                    if( widgetData[i] )
                        createPortlet({
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
            logo: $('.portletHeader .logo').attr('src'),
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

    var setLogo = function (url) {
        $('.portletHeader .logo').attr('src',url);

        if(editMode==false)
            $('.portletHeader .logo').css('border',0);
    }

    var setBackground = function (url, wrapper) {
        pStack
            .css('background-image', ( wrapper ? 'url("' + url + '")' : url ) )
            .css('background-size', 'auto 100%' )
            .css('background-repeat', 'no-repeat');
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

            $(".newitem").click(function(e){
                var itemType = parseInt($(this).attr('type'));
                createPortlet( {type:itemType});
            });
        });

        // templateID=0 means 'don't use template'
        if( options.flyerid)
            json2flyer( options.templateID, options.flyerid )
    }

    initPortletsStack();

    // Public functions
    this.createPortlet = createPortlet;
    this.json2flyer = json2flyer;
    this.flyer2json = flyer2json;
    this.setBackground = setBackground;
    this.getThumbnail = getThumbnail;
    this.setLogo = setLogo;
    return this;
}

$.fn.Flyer = Flyer;