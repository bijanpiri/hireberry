function BadgeWidget(){
    Widget.call(this);

    var layout = '';

    function visibleBadgesChanged() {

        var count = this.toolbar.find('input[name=badge]:checked').length;

        if( count == 0 ) { // Empty-State
            this.portlet.find('.emptyState').show();
        }
        else {
            this.portlet.find('.emptyState').hide();
        }
    }

    function initLayout() {
        layout = this.clone('.badgeWidget');
        layout.find('.perks-container').sortable({
                items:'.badgeOuterFrame',
                handle:'.badgeIconFrame'
            }
        );
    }

    initLayout.call(this);
    this.setLayout(layout);

    this.widgetDidAdd = function() {

        this.setToolbar('.toolbar-badgeWidget');
        var badges=this.portlet;
        var widget=this;

        if( this.editMode )
            this.portlet.find('.badgeDescription').prop('contenteditable',true);

        this.toolbar.find('input[name=badge]')
            .each(function(i,input){
                $(input).change(function(){
                    badges.find('.'+input.value).css('display',input.checked ?'':'none');
                    visibleBadgesChanged.call(widget);
                });
            });

        visibleBadgesChanged.call(this);
    }

    this.serialize = function() {
        var selectedPerks = {
            chosen:this.toolbar.find('.toolbar-badgeWidget input').serialize().replace(/badge=/gi,'').split('&')
        };

        var descriptions = this.portlet.find('.badgeDescription').toArray().map( function(e) {
            return $(e).html()
        });

        return {
            selectedPerks: selectedPerks,
            descriptions: descriptions
        };
    }

    this.deserialize = function( data ) {
        this.toolbar.find('input[name=badge]').each(function(index,input){
            $(input).prop('checked',data.selectedPerks.chosen.indexOf(input.value)>=0).change();
        });

        var badgeDescriptionObjList = this.portlet.find('.badgeDescription').toArray();
        for(var i=0; i<badgeDescriptionObjList.length; i++ ) {
            $( badgeDescriptionObjList[i] ).html( data.descriptions[i] );
        }
    }
}
BadgeWidget.prototype=new Widget();
BadgeWidget.prototype.constructor=BadgeWidget;
BadgeWidget.instances = 1