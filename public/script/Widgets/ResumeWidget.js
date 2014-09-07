function ResumeWidget(){
    Widget.call(this);
    var Resume;
    var layout = '';
    this.dropboxToken = null;
    var widget=this;
    var getReady=false;
    function connectionStateChanged() {
        if( this.dropboxToken )
            this.toolbar.find('button[name=connectToDropBox]').text('Disconnect from Dropbox ');
        else
            this.toolbar.find('button[name=connectToDropBox]').text('Connect to Dropbox ');

        this.toolbar.find('button[name=connectToDropBox]').append('<i class="fa fa-dropbox resume-dropbox-log"></i>');
    }


    function initParse(){
        Parse.initialize(
            "5zDqBqs1fKZXlB5LyQf4XAyO8L5IOavBnZ8w03IJ",
            "Sp6Folp3xhpVlphiJ8MyuEfbhg67iqy8hCESnc3L");
        Resume=Parse.Object.extend("Resume");
    }



    function initLayout() {
        layout = $('.widgets .resumeWidget').clone();
        initParse();

    }

    initLayout.call(this);

    this.setLayout(layout);
    var uploading=false;

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

                    var size=(this.files[0].size/(1024*1024));

                    if(size>5){
                        alert("Resume file mustn't be larger than 5 MB ");
                        return;
                    }

                    uploading=true;

                    $('#dropzone').html('Uploading your resume ...');

                    var resume = new Resume();
                    var file = new Parse.File('resume-file', this.files[0]);

                    resume.set('file', file);

                    resume.save(null, {
                        success: function (resume) {
                            $('#dropzone').html('Your resume uploaded successfully.');
                            widget.portlet.find('[name=resume]').val('');
                            widget.portlet.find('[name=resumeUrl]').val(file.url());
                            uploading=false;

                            if(getReady)
                                widget.prepared2Submit();

                            getReady=false;
                        }
                    });
                }
            };
        }
    };

    //ToDo: dropbox token mustn't be retrieve when users are applying for a job otherwise dropbox can be invaded
    this.serialize = function() {
        return {
            dbToken: this.dropboxToken
        }
    };

    this.getReady4Submit=function(){
        if(uploading)
            getReady=true;
        else
            widget.prepared2Submit();
    };

    this.deserialize = function( content ) {
        this.dropboxToken = content.dbToken;
        connectionStateChanged.call(this);
    };
}
ResumeWidget.prototype=new Widget();
ResumeWidget.prototype.constructor=ResumeWidget;
ResumeWidget.instances = 1;