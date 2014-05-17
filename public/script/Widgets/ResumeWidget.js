function ResumeWidget(){
    Widget.call(this);
    var Resume;
    var layout = '';
    this.dropboxToken = null;
    var widget=this;
    var ready=true;
    function connectionStateChanged() {
        if( this.dropboxToken )
            this.toolbar.find('button[name=connectToDropBox]').text('Disconnect from Dropbox');
        else
            this.toolbar.find('button[name=connectToDropBox]').text('Connect to Dropbox');
    }


    function initParse(){
        Parse.initialize(
            "qoMkGPujIUWxjrHi28WCcOoSrl755V8CgFYrdC59",
            "xCzRaCEshLWlg6XGvnBxLdRRcv6BRGNY4MUQhgvn");
        Resume=Parse.Object.extend("Resume");
    }



    function initLayout() {
        layout = $('.widgets .resumeWidget').clone();
        initParse();

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
                    $.get( '/job/dropboxAuth?flyerid=' + widget.flyerID).done( function(res) {
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
                if(!widget.dropboxToken){
                    ready=false;
                    var resume = new Resume();
                    var file = new Parse.File('resume-file', this.files[0]);

                    resume.set('file', file);

                    resume.save(null, {
                        success: function (resume) {
                            //ToDo: What happens if resume not uploaded yet

                            widget.portlet.find('[name=resume]').val('');
                            widget.portlet.find('[name=resumeUrl]').val(file.url());

                            ready=true;
                            if(preparedCall)
                                preparedCall();

                        }
                    });
                }
            };
        }
    }
    this.getReady=function(){
        if(ready)
            preparedCall();
    }

    //ToDo: dropbox token mustn't be retrieve when users are applying for a job otherwise dropbox can be invaded
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