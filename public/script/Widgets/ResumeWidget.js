/**
 * Created by Bijan on 3/17/14.
 */

function ResumeWidget(){

    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = this.clone('.resumeWidget');
    }

    initLayout.call(this);

    this.setLayout(layout);

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
ResumeWidget.prototype=new Widget();
ResumeWidget.prototype.constructor=ResumeWidget;
ResumeWidget.instances=1;

