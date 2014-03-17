
function ProfilesWidget(){

    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = this.clone('.profilesWidget');
    }

    initLayout.call(this);

    this.setLayout(layout);

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
ProfilesWidget.prototype=new Widget();
ProfilesWidget.prototype.constructor=ProfilesWidget;
ProfilesWidget.instances=1;

