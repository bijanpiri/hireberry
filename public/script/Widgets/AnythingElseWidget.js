function AnythingElseWidget(){

    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = this.clone('.anythingElseWidget');

    }

    initLayout.call(this);

    this.setLayout(layout);

    this.widgetDidAdd=function(){
        this.setToolbar('.toolbar-anything');
        this.toolbar.find('.remaind').html(this.limit);
        this.addToolbarCommand('limit',
            function(widget,args,input){
                widget.limit=parseInt($(input).val());
                widget.portlet
                    .find('textarea')
                    .attr('maxlength',$(input).val())
                    .change();

            });
        var widget=this;
        this.portlet.find('textarea').on('change keyup keydown paste',function (event){
                var textarea=$(this);
                var enter=(textarea.val().match(/\n/gm)||[]).length;
                var len=textarea.val().length;
                var limit=parseInt(widget.toolbar.find('input[command=limit]').val())+enter*2;
                textarea.attr('maxlength',limit);
                var rem=Math.max(0, limit-len-enter);
                widget.toolbar.find('.remaind').html(rem);
            }
        );
    }


    this.serialize = function() {
        var data=new Object();
        data.limit=parseInt(this.toolbar.find('input[command=limit]').val());
        data.text=this.portlet.find('textarea').val();
        return data;
    }

    this.deserialize = function( data ) {

        this.toolbar.find('input[command=limit]').val(data.limit);
        this.portlet
            .find('textarea')
            .val(this.editMode ? data.text :'')
            .attr('placeholder',data.text)
            .attr('maxlength',this.limit)
            .change();
    };
}
AnythingElseWidget.prototype=new Widget();
AnythingElseWidget.prototype.constructor=AnythingElseWidget;
AnythingElseWidget.instances = 1;
