function AnythingElseWidget(){
    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = $('.widgets .anythingElseWidget').clone();
    }

    initLayout.call(this);

    this.setLayout(layout);

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
AnythingElseWidget.prototype=new Widget();
AnythingElseWidget.prototype.constructor=AnythingElseWidget;
AnythingElseWidget.instances = 1;