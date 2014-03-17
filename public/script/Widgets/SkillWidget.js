function SkillWidget(){
    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = $('.widgets .skillWidget').clone();
    }

    initLayout.call(this);

    this.setLayout(layout);

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
SkillWidget.prototype=new Widget();
SkillWidget.prototype.constructor=SkillWidget;
SkillWidget.instances = 1