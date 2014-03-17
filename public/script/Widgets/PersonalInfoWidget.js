function PersonalInfoWidget(){
    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = $('.widgets .personalInfoWidget').clone();
    }

    initLayout.call(this);

    this.setLayout(layout);

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
PersonalInfoWidget.prototype=new Widget();
PersonalInfoWidget.prototype.constructor=PersonalInfoWidget;
