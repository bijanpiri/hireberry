function TextWidget(){
    Widget.call(this);

    this.layout='layout';

    function initLayout(){
        var x=this.clone('.textWidget');
        this.layout=x;
        return x;
    }

    this.setLayout(initLayout.call(this));

    this.portlet.on('portlet:layoutChanged', function(e,idx) {
        console.log(idx,idx.old,idx.new);
    });

    this.widgetDidAdd=function(isNew){
        var id='#'+this.layout.find('.text-widget').attr('id');
        this.toolbar
            .attr('data-role','editor-toolbar')
            .attr('data-target',id);

        this.setToolbar('.toolbar-text');
        this.addToolbarCommand('align',
            function(widget,args)
            {
                widget.toolbar.find('[command^=align]').removeClass('btn-info');
                widget.toolbar.find('[command="align '+args[1]+'"]').addClass('btn-info');
                widget.portlet.find('.text-widget').css('text-align',args[1]);});


        this.addToolbarCommand('color',
            function(widget,args)
            {widget.portlet.find('.text-widget').css('color',args[1]);});

        this.addToolbarCommand('size',
            function(widget,args)
            {
                widget.portlet.
                    find('.text-widget')
                    .css('font-size',args[1])
                    .css('line-height',args[1]);
            });


        $(id).wysiwyg(
            {
                activeToolbarClass:'btn-info',
                toolbarSelector: '[data-target='+id+']'
            }
        );
    }

    this.restated=function(){

    };

    this.serialize = function(){

        var text=this.portlet.find('.text-widget');
        var data=new Object();
        data.text=text.html();
        data.align=text.css('text-align');
        data.headline=text.hasClass('header');
        data.foreColor=text.css('color');
        data.fontSize=text.css('font-size');

        return data;
    }

    this.deserialize = function(data){

        this.toolbar.find('[command="align '+data.align+'"]').addClass('btn-info');

        if(data.headline){
            this.portlet.parent().find('.headline').attr('checked','checked');
            this.portlet.find('.textfield').addClass('header');
        }
        return this.portlet
            .find('.text-widget')
            .html(data.text)
            .css('text-align',data.align)
            .css('color',data.foreColor)
            .css('font-size',data.fontSize)
            .css('line-height',data.fontSize);
    }

}
TextWidget.prototype = new Widget();
TextWidget.prototype.constructor = TextWidget;
