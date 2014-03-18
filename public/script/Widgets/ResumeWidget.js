function ResumeWidget(){
    Widget.call(this);

    var layout = '';
    this.dropboxToken = null;

    function connectionStateChanged() {
        if( this.dropboxToken )
            this.toolbar.find('button[name=connectToDropBox]').text('Disconnect from Dropbox');
        else
            this.toolbar.find('button[name=connectToDropBox]').text('Connect to Dropbox');
    }

    function initLayout() {
        layout = $('.widgets .resumeWidget').clone();
    }

    initLayout.call(this);

    this.setLayout(layout);

    this.widgetDidAdd = function() {

        this.setToolbar('.toolbar-resumeWidget');
        var connectButton = this.toolbar.find('button[name=connectToDropBox]');
        connectionStateChanged.call(this);

        connectButton.click( (function(widget) {

            return function() {
                if( widget.dropboxToken ) {
                    widget.dropboxToken = null;
                    connectionStateChanged.call(widget);
                }
                else
                    $.get( '/job/dropboxAuth').done( function(res) {
                        if(res.token)
                            widget.dropboxToken = res.token;
                        connectionStateChanged.call(widget);
                    })
            }
        })(this) );

        // Add resume handler
        if( this.editMode==false ) {
            layout.find('#dropzone').click(function(){
                $('#resumefile').click();
            });

            document.getElementById('resumefile').onchange = function () {
                $('#dropzone').html('Your Résumé :<br/>' + this.value.replace(/^.*[\\\/]/, ''));
            };
        }
    }

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {
        return {
            dbToken: this.dropboxToken
        }
    }

    this.deserialize = function( content ) {
        this.dropboxToken = content.dbToken;
        connectionStateChanged.call(this);
    };
}
ResumeWidget.prototype=new Widget();
ResumeWidget.prototype.constructor=ResumeWidget;
ResumeWidget.instances = 1;