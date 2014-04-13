/**
 * Created by Bijan on 3/17/14.
 */
var idCounter=1;
var editMode

function Widget(options){
    Widget.instances=1000;
    this.type=0;
    this.portlet = $('<div>').addClass('portlet').data('widget',this);
    this.portletContainer = $('<div>').addClass('portlet-container');
    this.toolbar = $('<div>').addClass('toolbar').hide();
    this.flyerID = '';

    this.editMode = options ? options.editMode : true;

    this.serialize = function(){};
    this.deserialize = function(content){};

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
                        height:150,
                        width:200,
                        modal: true,
                        draggable : false,
                        position:'middle',
                        buttons: {
                            Yes: function() {
                                $( this ).dialog( "close" );
                                widget.portletContainer.remove();
                                Widgets[widget.type].instances++;
                            },
                            No: function() {
                                $( this ).dialog( "close" );
                            }
                        },
                        close: function( event,ui ) {
                            $( this ).dialog( "destroy" )
                        },
                        open:function(){
                            $(".ui-dialog-titlebar-close").hide();
                        }
                    });
                }

            })(this));

        if( this.editMode) {
            this.portletContainer
                //.append(this.dialog_confirm)
                .append(this.portlet)
                .append(this.toolbar)
                .append(moveHandle)
                .append(deleteButton);
        } else {
            this.portletContainer.append(this.portlet)
        }

        this.portlet.append(this.layout);

        return this.portletContainer.append( this.portlet );
    }

    this.widgetDidAdd = function(isNew) {}

    this.widgetFocus=function(){};

    this.clone=function(widget){
        idCounter++;

        var x=$('.widgets>'+widget).clone();

        x.find('*').each(
            function(i,elem){
                if(elem.id)
                    elem.id=elem.id+'_'+idCounter;
                if(elem.htmlFor)
                    elem.htmlFor=elem.htmlFor+'_'+idCounter;
//                if(elem.name)
//                    elem.name=elem.name+'_'+idCounter;
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
        var events='click';
//            'blur focus focusin focusout load resize scroll unload click '
//                +'dblclick mousedown mouseup mousemove mouseover mouseout mouseenter '
//                +'mouseleave change select submit keydown keypress keyup error';

        this.toolbar.delegate('[command^='+command+']',events,function(event){
            if((!this.event && event.type=='click')|| (this.even && this.event.indexOf(event.type)>=0 ))
                callback(widget,$(this).attr('command').split(' '),this,this.event);
        });
        return this;
    }

    this.restated=function(){
        console.log('restated');
    }
}
Widget.prototype.constructor = Widget;
