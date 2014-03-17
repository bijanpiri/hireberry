/**
 * Created by Bijan on 3/17/14.
 */
function SkillWidget(){
    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = this.clone('.skillWidget');
    }

    initLayout.call(this);

    this.setLayout(layout);

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
SkillWidget.prototype=new Widget();
SkillWidget.prototype.constructor=SkillWidget;
SkillWidget.instances=1;
