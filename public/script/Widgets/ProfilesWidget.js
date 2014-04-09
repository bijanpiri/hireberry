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
             if(input.checked)
               $(input).parent().addClass("bool-active");
            else
               $(input).parent().removeClass("bool-active");
        })
            //This call is needed when adding widget to flyer in first time.
            $(input).trigger('change');
        });

        this.toolbar.find('.bool-btn').each(function(i,btn){
            $(btn).click(function(){
               var input= $(btn).find('input[name=p]');
               input.prop('checked',!input.is(':checked')).trigger('change');
            });
        })

        /*this.addToolbarCommand('profile',
        function(widget,args)
        {
            var cmd='[command="profile '+args[1]+'"]';
            var s=widget.toolbar.find(cmd).find('input[id='+args[1]+']');
            if( widget.toolbar.find(cmd).find('input[id='+args[1]+']')[0].checked)
            {
                 widget.toolbar.find(cmd).addClass('bool-active');
            }
            else
            {
                widget.toolbar.find(cmd).removeClass('bool-active');
            }
        });*/
    }

    this.serialize = function() {

        var data={
            profiles:
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