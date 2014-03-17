function ResumeWidget(){
    Widget.call(this);

    var layout = '';
    var dropboxToken = null;

    function initLayout() {
        layout = $('.widgets .resumeWidget').clone();
    }

    initLayout.call(this);

    this.setLayout(layout);

    this.widgetDidAdd = function() {

        function connectionStateChanged() {
            if( dropboxToken )
                connectButton.text('Disconnect from Dropbox');
            else
                connectButton.text('Connect to Dropbox');
        }

        this.setToolbar('.toolbar-resumeWidget');
        var connectButton = this.toolbar.find('button[name=connectToDropBox]');
        connectionStateChanged();

        connectButton.click( function() {

            if( dropboxToken ) {
                dropboxToken = null;
                connectionStateChanged();
            }
            else
                $.get( '/job/dropboxAuth').done( function(res) {
                    if(res.token)
                        dropboxToken = res.token;
                    connectionStateChanged();
                })

        });
    }

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
ResumeWidget.prototype=new Widget();
ResumeWidget.prototype.constructor=ResumeWidget;
ResumeWidget.instances = 1;