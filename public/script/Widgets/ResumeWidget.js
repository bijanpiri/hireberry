function ResumeWidget(){
    Widget.call(this);

    var layout = '';

    var widget;

    function connectionStateChanged() {
        if( client.isAuthenticated() )
            this.toolbar.find('button[name=connectToDropBox]').text('Disconnect from Dropbox');
        else
            this.toolbar.find('button[name=connectToDropBox]').text('Connect to Dropbox');
    }
    var Resume,client;

    function initParse(){
        Parse.initialize(
            "qoMkGPujIUWxjrHi28WCcOoSrl755V8CgFYrdC59",
            "xCzRaCEshLWlg6XGvnBxLdRRcv6BRGNY4MUQhgvn");
        Resume=Parse.Object.extend("Resume");
    }

    function initDropBox(){
        client = new Dropbox.Client({ key: "06p3gxkcx05qpc9"});
    }


    function initLayout() {
        layout = $('.widgets .resumeWidget').clone();
        initParse();
        initDropBox();
    }

    initLayout.call(this);

    this.setLayout(layout);
    function uploadDropBox() {
        var xhrListener = function (dbXhr) {
            dbXhr.xhr.upload.onprogress("progress", function (event) {
                // event.loaded bytes received, event.total bytes must be received
                reportProgress(event.loaded, event.total);
            });
            return true;  // otherwise, the XMLHttpRequest is canceled
        };
        client.onXhr.addListener(xhrListener);
        client.writeFile("resume", data, function (error, stat) {

        });
        client.onXhr.removeListener(xhrListener);
    }

    function reportProgress(loaded,total){
        console.log('loaded '+loaded);
        console.log('total '+total);
    }

    this.widgetDidAdd = function() {
        widget=this;
        this.setToolbar('.toolbar-resumeWidget');
        var connectButton = this.toolbar.find('button[name=connectToDropBox]');
        connectionStateChanged.call(this);
        layout.find('#resumefile').change(
            function(){
                client.authenticate(
                    {interactive: false},
                    function(error, client) {
                    if (error) {
                        return handleError(error);
                    }
                    if (client.isAuthenticated()) {
                        // Cached credentials are available, make Dropbox API calls.
                        uploadDropBox();
                    } else {
                        $('#dropzone').html('Your Résumé :<br/>' + this.value.replace(/^.*[\\\/]/, ''));
                        var resume = new Resume();
                        var file = new Parse.File('resume-file', this.files[0]);

                        resume.set('file', file);

                        resume.save(null, {
                            success: function (resume) {
                                var url = file.url();

                            }
                        });
                    }
                });

            }
        );
        connectButton.click(

            function() {
                if( widget.dropboxToken ) {
                    widget.dropboxToken = null;
                    connectionStateChanged.call(widget);
                }
                else
                    client.authenticate(function(error, client) {
                        if (error) {

                        }

                        widget.dbToken=client._oauth._token;
                    });
            }
        );

        // Add resume handler
        if( !this.editMode) {
            layout.find('#dropzone').click(function(){
                $('#resumefile').click();
            });


        }
    }

    this.serialize = function() {
        return {token:client._oauth._token};

    }

    this.deserialize = function( content ) {
        this.client = new Dropbox.Client(
            {   key: "06p3gxkcx05qpc9",
                token:content.token,
                sandbox:false});
        if(content.token)
            this.client.authenticate();
        connectionStateChanged.call(this);
    };
}
ResumeWidget.prototype=new Widget();
ResumeWidget.prototype.constructor=ResumeWidget;
ResumeWidget.instances = 1;