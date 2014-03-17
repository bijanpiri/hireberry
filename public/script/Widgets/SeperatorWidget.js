/**
 * Created by Bijan on 3/17/14.
 */
function SeperatorWidget(){
    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = $('.widgets .seperatorWidget').clone();
    }

    initLayout.call(this);

    this.setLayout(layout);

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
SeperatorWidget.prototype=new Widget();
SeperatorWidget.prototype.constructor=SeperatorWidget;
