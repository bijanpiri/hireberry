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
            $('.bool-portlet-active').removeClass('bool-portlet-active');
    });

    $(document).delegate('.portlet','focusin',
        function(){
            $('.bool-portlet-active').removeClass('bool-portlet-active');
            $(this)
                .parent().addClass('bool-portlet-active');


        });
    $(document).delegate('.portlet-container *','mousedown',
        function(event){
            $('.bool-portlet-active').removeClass('bool-portlet-active');

            if( $(this).hasClass('move-btn')==false && $(this).hasClass('delete-btn')==false )
                $(this).closest('.portlet-container')
                    .addClass('bool-portlet-active');
            else
                event.stopPropagation();
        });
    $(document).delegate('.portlet-container>*','mousedown',
        function(event){
            event.stopPropagation();
        });

    $(document).delegate('.portlet-container' ,'mousedown',
        function(event){
            $('.bool-portlet-active')
                .removeClass('bool-portlet-active');

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

        if(wData.isNew)
        {
            widget.portletContainer.addClass('bool-portlet-active');
            widget.widgetFocus();
        }
    };

    var json2flyer = function(templateID, flyerid, callback) {

        var flyer = this;

        $.get('/flyer/' + templateID + '/json/'+flyerid)
            .done(function(data){
                if( callback ){
                    callback(data);
                    return;
                }

                flyer.description = data.description;
                setBackground(data.background, false);
                setLogo(data.logo);
                flyer.thanksMessage = data.thanksMessage;

                var widgetData = data.widgets;
                var nWidgets = widgetData ? widgetData.length : 0;

                for( var i=0; i<nWidgets; i++ ){
                    if( widgetData[i] )
                        createPortlet({
                            type:widgetData[i].type,
                            content:widgetData[i].Contents,
                            layoutIndex:widgetData[i].layoutIndex,
                            isNew:false
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
            description: this.description,
            flyerid:  $('input[name=flyerid]').val(),
            background: pStack.css('background-image'),
            logo: $('.portletHeader .logo').attr('src'),
            thanksMessage: this.thanksMessage,
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
        {
            $('.portletHeader .logo').css('border',0);
        }
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
                createPortlet( {type:itemType,isNew:true});
            });
        });

        // templateID=0 means 'don't use template'
        if( options.flyerid)
            this.json2flyer( options.templateID, options.flyerid )
    }

    // Public functions
    this.createPortlet = createPortlet;
    this.json2flyer = json2flyer;
    this.flyer2json = flyer2json;
    this.setBackground = setBackground;
    this.getThumbnail = getThumbnail;
    this.setLogo = setLogo;

    initPortletsStack.call(this);

    return this;
}

$.fn.Flyer = Flyer;