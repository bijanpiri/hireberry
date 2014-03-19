function SkillWidget(){
    Widget.call(this);

    var layout = '';


    function updateSkillButtons(portlet, chosenBox) {
        var skills = chosenBox.val() || [];
        portlet.find('input[name=skill]').each(function(i,input){
            input.parentElement.style.display= skills.indexOf(input.value)>=0 ?
                '':'none';
        });

    }

    function initLayout() {
        layout = this.clone('.skillWidget');
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

    this.serialize = function() {
        var data={
            chosen:this.toolbar.find('.toolbar-skillsWidget select').serialize().replace(/chosen=/gi,'').split('&'),
            skills:this.portlet.find('.skillWidget input').serialize().replace(/skill=/gi,'').split('&')
        };
        return data;
    }

    this.deserialize = function( data ) {

        var chosen=this.toolbar
            .find('.chosen-select')
            .val(data.chosen)
            .trigger("chosen:updated");

        this.portlet.find('.skillWidget input[name=skill]').each(
            function(i,input){
                $(input).prop('checked',data.skills.indexOf(input.value)>0).change();
            }
        );
        updateSkillButtons(this.portlet,chosen);

    };
}
SkillWidget.prototype=new Widget();
SkillWidget.prototype.constructor=SkillWidget;
SkillWidget.instances = 1