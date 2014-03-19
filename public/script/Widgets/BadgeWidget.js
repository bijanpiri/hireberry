function BadgeWidget(){
    Widget.call(this);

    var layout = '';


    function initLayout() {
        layout = this.clone('.badgeWidget');
    }

    initLayout.call(this);
    this.setLayout(layout);

    this.widgetDidAdd = function() {}

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
BadgeWidget.prototype=new Widget();
BadgeWidget.prototype.constructor=BadgeWidget;
BadgeWidget.instances = 1