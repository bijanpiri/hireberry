/**
 * Created by Bijan on 3/17/14.
 */
var idCounter=1;
var editMode;

function Widget(options){
    Widget.instances=20000;
    var widget=this;
    this.prepared=null;
    this.prepared2Submit=null;

    this.type=0;
    this.portlet = $('<div>').addClass('portlet').data('widget',this);
    this.portletContainer = $('<div>').addClass('portlet-container');
    this.toolbar = $('<div>').addClass('toolbar');
    this.flyerID = '';

    this.editMode = options ? options.editMode : true;

    this.serialize = function(){};
    this.deserialize = function(content){};

    this.setLayout = function(layout){
        this.layout = layout;
    };
    function deleteWidget(){
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
                    checkFlyerEmpty();
                },
                No: function() {
                    $( this ).dialog( "close" );
                    checkFlyerEmpty();
                }
            },
            close: function( event,ui ) {
                $( this ).dialog( "destroy" );
            },
            open:function(){
                $(".ui-dialog-titlebar-close").hide();
            }
        });
    }

    this.content = function(){
        // Action Buttons
        var moveHandle = $('<div>').addClass('action-btn-frame move-btn-frame')
            .append($('<i>').addClass('action-btn move-btn'));

        var deleteButton = $('<div >').addClass('action-btn-frame delete-btn-frame')
            .append($('<i>').addClass('action-btn delete-btn'));

        deleteButton.find('*').click(deleteWidget);

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

        this.toolbar.delegate('[command^='+command+']',events,function(event){
            if((!this.event && event.type=='click')|| (this.even && this.event.indexOf(event.type)>=0 ))
                callback(widget,$(this).attr('command').split(' '),this,this.event);
        });
        return this;
    }

    this.restated=function(){
        console.log('restated');
    }
    this.getReady4Save=function(){
        widget.prepared();
    }
    this.prepare2Save=function(prepareCallback){
        widget.prepared=prepareCallback;
        widget.getReady4Save();

    }
    this.getReady4Submit=function(){
        widget.prepared2Submit();
    }
    this.prepare2Submit=function(submitCallback){
        widget.prepared2Submit=submitCallback;
        widget.getReady4Submit();
    }

    this.changed=function(){

    }
}
Widget.prototype.constructor = Widget;
Widget.instances=1000;
