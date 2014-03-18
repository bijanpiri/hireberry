function SkillWidget(){
    Widget.call(this);

    var layout = '';


    function updateSkillButtons(portlet, chosenBox) {
        var skills = chosenBox.val() || [];

        // connection['SkillName'] = 'buttonClass'
        var connections = {};
        connections['html5'] = 'HTML5';
        connections['css3'] = 'CSS3';
        connections['js'] = 'Javascript';
        connections['jquery'] = 'jQuery';
        connections['git'] = 'Git';
        connections['bootstrap'] = 'Bootstrap';
        connections['less'] = 'Less';

        //var portlet = $(this).parent().parent().parent().parent().find('.portlet');

        for(var key in connections ) {
            var button = portlet.find( '#' + key).parent();

            if( skills.indexOf( connections[key] ) >= 0 )
                button.show();
            else
                button.hide();

        }
    }

    function initLayout() {
        layout = $('.widgets .skillWidget').clone();
    }

    initLayout.call(this);
    this.setLayout(layout);

    this.widgetDidAdd = function() {

        if(this.editMode==false)
            return;

        this.setToolbar('.toolbar-skillsWidget');
        var chosenBox = this.toolbar.find('.chosen-select');

        chosenBox.chosen({
            width:'500px',
            no_results_text: "Oops, nothing found!"
        }).on('change', (function(portlet,chosenBox) {
               return function() {
                   updateSkillButtons( portlet,  chosenBox );
               };
            })(this.portlet, chosenBox));

        // Initialize
        updateSkillButtons( this.portlet,  chosenBox );
    }

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
SkillWidget.prototype=new Widget();
SkillWidget.prototype.constructor=SkillWidget;
SkillWidget.instances = 1