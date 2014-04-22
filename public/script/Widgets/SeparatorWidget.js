function SeperatorWidget(){
    Widget.call(this);

    var layout = '';


    function initLayout() {
        layout = $('.widgets .seperatorWidget').clone();
    }

    function setColor(color) {
        this.color = color;
        this.portlet.find('.bool-editable').css( 'color', color);
        this.portlet.find('.bool-divider').css( 'background-color', color);
        this.toolbar.find('.bool-current-color').css('background',color);
    }

    function setText(text) {
        this.portlet.find('.bool-editable').html(text);
    }

    initLayout.call(this);
    this.setLayout(layout);

    this.widgetDidAdd = function() {
        this.setToolbar('.toolbar-separatorWidget');

        this.toolbar.find('.bool-color-picker:first').ColorPicker();
        this.addToolbarCommand('color',
            function(widget,args)
            {
                widget.color = args[1];
                widget.portlet.find('.bool-editable').css( 'color', args[1]);
                widget.portlet.find('.bool-divider').css( 'background', args[1]);
            });
        this.toolbar.find('.bool-current-color').css('background-color','#9c9c9c');
        if(editMode)
            layout.find('.bool-editable').attr('contenteditable','true');
    }
    this.layout.delegate('.bool-edit-box-add','click',
        function(){
            layout.find('.bool-edit-box').css('visibility','visible');
        });
    this.layout.delegate('.bool-edit-box-close','click',
        function(){
            $(this).parent().css('visibility','hidden');
        }
    );
    this.getSettingPanel = function () { return $('<div>') }
    this.serialize = function() {
        return {
            text: this.portlet.find('.bool-editable').html(),
            color: this.toolbar.find('.bool-current-color').css('background-color'),
            hasText:this.portlet.find('.bool-edit-box').css('visibility')
        }
    }

    this.widgetFocus=function()
    {
        this.toolbar.find('input[name=text]').focus();
    }

    this.deserialize = function( content ) {
        setColor.call( this, content.color );
        setText.call( this, content.text );
        this.portlet.find('.bool-edit-box').css('visibility',content.hasText);
        this.toolbar.find('.bool-editable').val(content.text)

    };
}
SeperatorWidget.prototype=new Widget();
SeperatorWidget.prototype.constructor=SeperatorWidget;
