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
    }

    initLayout.call(this);
    this.setLayout(layout);

    this.widgetDidAdd = function() {
       
        this.setToolbar('.toolbar-badgeWidget');
        var badges=this.portlet;
        var widget=this;

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
        var data = {
            chosen:this.toolbar.find('.toolbar-badgeWidget input').serialize().replace(/badge=/gi,'').split('&')
        };
        return data;
    }

    this.deserialize = function( data ) {
        this.toolbar.find('input[name=badge]').each(function(index,input){
            $(input).prop('checked',data.chosen.indexOf(input.value)>=0).change();
        });
    }
}
BadgeWidget.prototype=new Widget();
BadgeWidget.prototype.constructor=BadgeWidget;
BadgeWidget.instances = 1