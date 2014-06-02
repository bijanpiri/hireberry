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
    var flyerLoaded = options.flyerLoaded || function(){};

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

        var widgetType = Widgets[wData.type];

        if(widgetType.instances) {
            if (widgetType.instances == 0) {
                alert("You can not use more widget of this type.");
                return;
            }
            widgetType.instances--;
        }
        var widget = new widgetType();
        widget.editMode = editMode;
        widget.flyerID = $('input[name=flyerid]').val();
        var portlet = widget.content();

        widget.type = wData.type;
        if(wData.place)
            wData.place.replaceWith(portlet);
        else
            pStack.append(portlet);

        checkFlyerEmpty();
        // Parameter: is it new?
        widget.widgetDidAdd( (wData.content==null));

        if( editMode ) {
            widget.portlet
                .mouseenter(function(){ $(this).addClass('portlet-hover');})
                .mouseleave(function(){$(this).removeClass('portlet-hover');})
        }

        if(wData.layoutIndex)
            widget.layoutIndex = wData.layoutIndex;

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
                }

                flyer.description = data.description;
                $('body').css('background', data.background);
                $('.bool-color-chooser-background .bool-current-color')
                    .css('background',data.background);
                $('.bool-color-chooser-canvas .bool-current-color')
                    .css('background',data.canvasColor);
                $('.bool-portlet').css('background',data.canvasColor);
                setLogo(data.logo);
                flyer.thanksMessage = data.thanksMessage;

                var widgetData = data.widgets;
                var nWidgets = widgetData ? widgetData.length : 0;

                for( var i=0; i<nWidgets; i++ ){
                    if( widgetData[i] )
                        createPortlet({
                            type:parseInt(widgetData[i].type),
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

    var flyer2json = function(preparedCallback) {

        var portlets = pStack.find('.portlet');

        var flyer = {
            description: this.description,
            flyerid:  $('input[name=flyerid]').val(),
            background: $('body').css('background'),
            canvasColor:$('.bool-portlet').css('background'),
            logo: $('.portletHeader .logo').attr('src'),
            thanksMessage: this.thanksMessage,
            count: portlets.length,

            widgets:[]
        };
        var widgetCount=portlets.length+1;//+1 for times when there is no widget(Empty Flyer)
        checkReady();
        portlets.each(function(index) {
            var widget = $(this).data('widget');
            widget.prepare2Save(function(){
                flyer.widgets.push( {
                    "type": widget.type,
                    'layoutIndex':widget.layoutIndex,
                    "Contents":  ( widget  && widget.serialize())
                });
                checkReady();
            });
        });
        function checkReady(){
            widgetCount--;
            if(widgetCount==0)
                preparedCallback(flyer);
        }


    }
    var flyer4Submit=function(preparedCallback){
        var portlets = pStack.find('.portlet');
        var widgetCount=portlets.length+1;//+1 for times when there is no widget(Empty Flyer)
        checkReady();
        portlets.each(function(index) {
            var widget = $(this).data('widget');
            widget.prepare2Submit(function(){
                checkReady();
            });
        });
        function checkReady(){
            widgetCount--;
            if(widgetCount==0)
                preparedCallback(flyer);
        }

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

    var initPortletsStack = function () {
        // Initialization
        if( editMode ){

            pStack.sortable({
//                connectWith: ".portletStack",
                cursor: "move",
                axis: "y",
                drag: "y",
                placeholder:'bool-placeholder',
                items:'.portlet-container',
                handle: ".move-btn-frame",
                start: function() {
                    $('.bool-flyer-empty').hide();
                },
//                drag: function() {
//                    alert('drag')
//                },
                stop: function() {
//                    alert('stop')
                }
            })//.disableSelection();

            $('.bool-widget-btn').draggable({
                connectToSortable: ".portletStack",
                helper: "clone",
                revert: "invalid",
                stop:replaceWidgets
            });
        }

        function replaceWidgets(){
            $('.portletStack>.bool-widget-btn').each(
                function(){
                    var type = parseInt($(this).attr('type'));
                    createPortlet({type: type,isNew:true,place:$(this)});
                }
            );
            $('.portletStack>.bool-widget-btn').remove();
        }
        // Set click event
        $(function(){

            $(".bool-widget-btn").click(function(e){
                var itemType = parseInt($(this).attr('type'));
                createPortlet( {type:itemType,isNew:true});
            });
        });

        // templateID=0 means 'don't use template'
        if( options.flyerid)
            this.json2flyer( options.templateID, options.flyerid, flyerLoaded );
    };

    // Public functions
    this.createPortlet = createPortlet;
    this.json2flyer = json2flyer;
    this.flyer2json = flyer2json;
    this.getThumbnail = getThumbnail;
    this.setLogo = setLogo;
    this.flyer4Submit=flyer4Submit;

    initPortletsStack.call(this);

    return this;
}

$.fn.Flyer = Flyer;