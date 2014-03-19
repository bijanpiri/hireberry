function ProfilesWidget(){
    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = this.clone('.profilesWidget');
    }

    initLayout.call(this);
    this.setLayout(layout);

    this.widgetDidAdd = function() {
        this.setToolbar('.toolbar-profileWidget');
        var profile=this.portlet;
        this.toolbar.find('input[name=p]').each(function(i,input){
            $(input).change(function(){
                profile.find('.'+input.value).css('display',input.checked ?'':'none');
            })
        });

    }

    this.serialize = function() {

        var data={profiles:
            this.toolbar
            .find('.toolbar-profileWidget input').serialize().replace(/p=/gi,'').split('&')};

        return data;
    }

    this.deserialize = function( data ) {
        this.toolbar.find('input[name=p]').each(
            function(i,input){
                $(input).prop('checked',data.profiles.indexOf(input.value)>=0).change();
            }
        );
    }
}
ProfilesWidget.prototype=new Widget();
ProfilesWidget.prototype.constructor=ProfilesWidget;
ProfilesWidget.instances = 1;