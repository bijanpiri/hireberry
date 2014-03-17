function ProfilesWidget(){
    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = $('.widgets .profilesWidget').clone();
    }

    initLayout.call(this);
    this.setLayout(layout);

    this.widgetDidAdd = function() {
        this.setToolbar('.toolbar-profileWidget');

        function stateChangedHandle( profileElement ) {
            return function() {
                if( $(this).is(":checked") )
                    profileElement.css('display','block');
                else
                    profileElement.css('display','none');
            }
        }

        // Checkbox-Row connections
        var connections = [
            { checkboxClass:'.githubCheckbox', rowClass:'.githubRow' },
            { checkboxClass:'.stackoverflowCheckbox', rowClass:'.stackoverflowRow'},
            { checkboxClass:'.twitterCheckbox', rowClass:'.twitterRow'},
            { checkboxClass:'.dribbbleCheckbox', rowClass:'.dribbbleRow'},
            { checkboxClass:'.behanceCheckbox', rowClass:'.behanceRow'},
            { checkboxClass:'.linkedinCheckbox', rowClass:'.linkedinRow'}
        ];

        for( var i=0; i<connections.length; i++ ) {
            var row = this.portlet.find( connections[i].rowClass );
            var checkbox =  this.toolbar.find( connections[i].checkboxClass );

            checkbox.change( stateChangedHandle( row ) );
        }
    }

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
ProfilesWidget.prototype=new Widget();
ProfilesWidget.prototype.constructor=ProfilesWidget;
ProfilesWidget.instances = 1;