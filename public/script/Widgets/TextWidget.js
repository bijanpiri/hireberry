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
                widget.toolbar.find('[command^=align]').removeClass('bool-active');
                widget.toolbar.find('[command="align '+args[1]+'"]').addClass('bool-active');
                widget.portlet.find('.text-widget').css('text-align',args[1]);});

        this.toolbar.find('.bool-color-picker:first').ColorPicker();
        this.addToolbarCommand('color',
            function(widget,args)
            {
                widget.portlet.find('.text-widget').css('color',args[1]);
                widget.toolbar.find('.bool-current-color').css('background',args[1]);
            });

        this.addToolbarCommand('size',
            function(widget,args)
            {
                widget.portlet.
                    find('.text-widget,.text-widget *')
                    .css('font-size',args[1]+'px')
                    .css('line-height',args[1]+'px');
            });
        var widget=this;
        this.toolbar.find('.bool-combo-list a').click(function(){
            widget.toolbar.find('.bool-combo-text').html($(this).html());
        });

//        this.toolbar.find('.bool-tab').click(function(){
//            $(this).show();
//        });


        if( this.editMode ){
            $(id).wysiwyg({
                activeToolbarClass:'bool-active',
                toolbarSelector: '[data-target='+id+']'
            });
        }
    }

    this.widgetFocus=function()
    {
        this.portlet.find(".text-widget").focus();
    }

    this.restated=function(){

    };

    this.serialize = function(){

        var text=this.portlet.find('.text-widget');
        var data={
            text:text.html(),
            align:text.css('text-align'),
            headline:text.hasClass('header'),
            foreColor:text.css('color'),
            fontSize:text.css('font-size')
        }
        return data;
    }

    this.deserialize = function(data){

        this.toolbar.find('[command="align '+data.align+'"]').addClass('bool-active');

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
