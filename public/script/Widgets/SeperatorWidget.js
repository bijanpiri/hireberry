function SeperatorWidget(){
    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = $('.widgets .seperatorWidget').clone();

    }

    initLayout.call(this);
    this.setLayout(layout);

    this.widgetDidAdd = function() {
        this.setToolbar('.toolbar-separatorWidget');
        this.toolbar.find('input[name=text]').keyup( (function(layout) {
            return function(e) {
                layout.find('.flatSection span').text( $(e.target).val() );
            }
        })(this.layout))
    }

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
SeperatorWidget.prototype=new Widget();
SeperatorWidget.prototype.constructor=SeperatorWidget;
