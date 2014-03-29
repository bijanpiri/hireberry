function PersonalInfoWidget(){
    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = $('.widgets .personalInfoWidget').clone();
    }

    initLayout.call(this);
    this.setLayout(layout);

    this.widgetDidAdd = function() {
        $('#email').blur(function(){
            var name = $('#name').val();
            var email = $('#email').val();

            fillProfiles();
        }) .autocomplete({
                minLength: 3,
                source: function( request, response ) {
                    // delegate back to autocomplete, but extract the last term
                    var term = request.term;

                    var emailProviders = [
                        'gmail.com',
                        'yahoo.com',
                        'ymail.com',
                        'aol.com'
                    ];

                    var parts = term.split('@');
                    var provider = parts.length==2 ? parts[1] : '';
                    var username = parts[0];
                    var matchedProvider = [];

                    for( var i=0; i<emailProviders.length; i++) {
                        if( provider=='' ||
                            (emailProviders[i].indexOf(provider) == 0  &&  emailProviders[i].length != provider.length ) ) {
                            matchedProvider.push( username + '@' + emailProviders[i] );
                        }
                    }

                    response( matchedProvider );
                    return false;
                },
                focus: function() {
                    // prevent value inserted on focus
                    return false;
                },
                select: function( event, ui ) {
                    $(this).val( ui.item.value );

                    //fillProfiles();

                    return false;
                }
            });

        if(this.editMode) {
            this.portlet.find('input').prop('readOnly','readOnly').css('cursor','default');
        }
    }

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
PersonalInfoWidget.prototype=new Widget();
PersonalInfoWidget.prototype.constructor=PersonalInfoWidget;
PersonalInfoWidget.instances = 1