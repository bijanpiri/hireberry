function AnythingElseWidget(){
<<<<<<< HEAD
=======

    this.limit=100;
>>>>>>> Added toolbar for anything else
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
                widget.limit=$(input).val();
                widget.portlet.find('textarea').attr('maxlength',$(input).val());
            });
        var widget=this;
        this.portlet.find('textarea').on('change keyup paste',function(){
            var len=$(this).val().length;
            var rem=Math.max(0, widget.limit-len);
            widget.toolbar.find('.remaind').html(rem);
        });
//        this.addToolbarCommand('align',
//            function(widget,args)
//            {
//                widget.toolbar.find('[command^=align]').removeClass('btn-info');
//                widget.toolbar.find('[command="align '+args[1]+'"]').addClass('btn-info');
//                widget.portlet.find('.text-widget').css('text-align',args[1]);});
//
//
    }

    this.serialize = function() {
        var data=new Object();
        data.limit=this.limit;
        data.text=this.portlet.find('textarea').html();
        return data;
    }

    this.deserialize = function( data ) {
        this.limit=data.limit;
        this.portlet.find('textarea').html(data.text);
    };
}
AnythingElseWidget.prototype=new Widget();
AnythingElseWidget.prototype.constructor=AnythingElseWidget;
AnythingElseWidget.instances = 1;
