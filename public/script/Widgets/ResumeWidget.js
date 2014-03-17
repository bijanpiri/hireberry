function ResumeWidget(){
    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = $('.widgets .resumeWidget').clone();
    }

    initLayout.call(this);

    this.setLayout(layout);

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
ResumeWidget.prototype=new Widget();
ResumeWidget.prototype.constructor=ResumeWidget;
ResumeWidget.instances = 1;