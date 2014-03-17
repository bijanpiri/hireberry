function AnythingElseWidget(){

    this.limit=100;

    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = this.clone('.anythingElseWidget');

    }

    initLayout.call(this);

    this.setLayout(layout);

    this.widgetDidAdd=function(){
        this.setToolbar('.toolbar-anything');
        this.addToolbarCommand('limit',
            function(widget,args,input){
                widget.limit=parseInt($(input).val());
                widget.portlet.find('textarea').attr('maxlength',$(input).val());
            });
        var widget=this;
        this.portlet.find('textarea').on('change keyup paste',function(){
            var enter=($(this).val().match(/\n/gm)||[]).length;
            var len=$(this).val().length;
            var limit=widget.limit+enter*2;
            widget.portlet.find('textarea').attr('maxlength',limit);
            var rem=Math.max(0, limit-len-enter);
            widget.toolbar.find('.remaind').html(rem);
        });
    }

    this.serialize = function() {
        var data=new Object();
        data.limit=this.limit;
        data.text=this.portlet.find('textarea').val();
        return data;
    }

    this.deserialize = function( data ) {
        this.limit=data.limit;
        this.portlet.find('textarea').val(data.text);
    };
}
AnythingElseWidget.prototype=new Widget();
AnythingElseWidget.prototype.constructor=AnythingElseWidget;
AnythingElseWidget.instances = 1;
