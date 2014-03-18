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
    this.dialog_confirm =  $('<div id="dialog-confirm"  title="Remove">');
    this.editMode = options ? options.editMode : true;

    this.serialize = function(){};
    this.deserialize = function(content){};
    this.enterToShotMode = function(completedCallback) {completedCallback()};
    this.exitFromShotMode = function() {};

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
                        height:0,
                        width:175,
                        modal: true,
                        draggable : false,
                        position:'middle',
                        buttons: {
                            Ok: function() {
                                $( this ).dialog( "close" );
                                widget.portletContainer.remove();
                                Widgets[widget.type].instances++;
                            },
                            Cancel: function() {
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

        if( editMode) {
            this.portletContainer
                .append(this.dialog_confirm)
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

    this.clone=function(widget){
        idCounter++;

        var x=$('.widgets>'+widget).clone();

        x.find('*').each(
            function(i,elem){
                if(elem.id)
                    elem.id=elem.id+'_'+idCounter;
                if(elem.htmlFor)
                    elem.htmlFor=elem.htmlFor+'_'+idCounter;
                if(elem.name)
                    elem.name=elem.name+'_'+idCounter;
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
        this.toolbar
            .find('[command^='+command+']')
            .each(function(i,elem){
                var e=$(elem);
                var event= e.attr('event') || 'click';
                e.on(event,function(){
                    args=$(this).attr('command').split(' ');
                    callback(widget,args,this);
                })
            });

    }

    this.restated=function(){
        console.log('restated');
    }
}
Widget.prototype.constructor = Widget;
