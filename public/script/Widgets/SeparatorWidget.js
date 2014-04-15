function SeperatorWidget(){
    Widget.call(this);

    var layout = '';
    var text;
    var color;

    function initLayout() {
        layout = $('.widgets .seperatorWidget').clone();
    }

    function setColor(color) {
        this.color = color;
        this.portlet.find('.flatSection pre').css( 'color', color);
        this.portlet.find('.flatSection hr').css( 'border-color', color);
        this.toolbar.find('.bool-current-color').css('background',color);
    }

    function setText(text) {
        this.text = text;
        this.portlet.find('.flatSection pre').text(text);
    }

    initLayout.call(this);
    this.setLayout(layout);

    this.widgetDidAdd = function() {
        this.setToolbar('.toolbar-separatorWidget');
        this.toolbar.find('input[name=text]').keyup( (function(widget) {
            return function(e) {
                setText.call( widget, $(e.target).val() );
            }
        })(this))


        this.toolbar.find('.bool-color-picker:first').ColorPicker();
        this.addToolbarCommand('color',
            function(widget,args)
            {
                widget.color = args[1];
                widget.portlet.find('.flatSection pre').css( 'color', args[1]);
                widget.portlet.find('.flatSection hr').css( 'border-color', args[1]);
                widget.toolbar.find('.bool-current-color').css('background',args[1]);
            })
    }

    this.getSettingPanel = function () { return $('<div>') }
    this.serialize = function() {
        return {
            text: this.text,
            color: this.color
        }
    }

    this.widgetFocus=function()
    {
        this.toolbar.find('input[name=text]').focus();
    }

    this.deserialize = function( content ) {
        setColor.call( this, content.color );
        setText.call( this, content.text );
        this.toolbar.find('input[name=text]').val(content.text)

    };
}
SeperatorWidget.prototype=new Widget();
SeperatorWidget.prototype.constructor=SeperatorWidget;
