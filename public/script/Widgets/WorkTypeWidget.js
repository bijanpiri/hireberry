/**
 * Created by Bijan on 3/17/14.
 */

function WorkTypeWidget(){

    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = $('.widgets .workTypeWidget').clone();
    }

    initLayout.call(this);

    this.setLayout(layout);

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
WorkTypeWidget.prototype=new Widget();
WorkTypeWidget.prototype.constructor=WorkTypeWidget;
WorkTypeWidget.instances=1;
