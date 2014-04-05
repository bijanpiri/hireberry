function PictureWidget(){
    Widget.call(this);

    var layout = "";

    var imgEditor;

    function initLayout1() {
        layout = this.clone('.image-widget');

        var fileInput = layout.find('input[type=file]').change(

        );
        layout.find('button').click(function(){
            fileInput.click();
        });
        imgEditor=layout.find('.image-editor-dialog');
        if(editMode){
            fileInput.fileupload({
                url:'/flyer/upload',
                dataType: 'json',
                replaceFileInput:false,
                add:add,
                dropZone:layout,
                done: function (e, data) {
                    layout.find('.imageWidgetInnerContainer').hide();
                    var img=layout.find('img');
                    img.attr('src', '/uploads/' + data.result.files[0].name);
                },
                progressall:function (e, data) {
                    var progress = parseInt(data.loaded / data.total * 100, 10);
                    $('.progress .bar').css(
                        'width',
                        progress + '%'
                    );
                    var progress = parseInt(data.loaded * 100/ data.total , 10);
                    console.log(progress);
                }
            });

        } else {
            this.portlet.find('input[type=file]').remove();
        }
    }
    function add(e,dudata){
        imgEditor.show();
        var reader = new FileReader();
        reader.onload =
            function (progress) {
                try {
                    var imgly = new imglyKit({container: layout.find(".image-dialog-content")});
                    imgEditor.find('.imgly-container').empty();
                    var d=progress.target.result;
                    imgly.run(d);
                    imgEditor.find('.image-edit-cancel').click(function(){
                        imgEditor.hide();
                    });
                    imgEditor.find('.image-edit-ok').click(function(){
                        imgEditor.hide();
                        imgly.renderToDataURL("image/jpeg", function (err, dataurl){
                            //shows preview
                            layout.find('img').attr('src',dataurl);
                            //convert to blob in order to upload it.
                            var blob=dataURLtoBlob(dataurl);
                            dudata.files[0]=blob;
                            dudata.submit();
                        });
                    });

                } catch (ex) {
                    console.log(ex);
                    imgEditor.hide();

                    if(ex.name == "NoSupportError") {
                        alert("Your browser does not support canvas.");
                    } else if(ex.name == "InvalidError") {
                        alert("The given file is not an image");
                    }
                }
            };

        reader.readAsDataURL(dudata.files[0]);
    }

    initLayout1.call(this);

    this.setLayout(layout);

    this.widgetDidAdd=function(){
        this.setToolbar('.toolbar-picture');
        var widget=this;

        this.addToolbarCommand('add',function(){
            layout.find('input[type=file]').click();
        }).addToolbarCommand('edit',function(){
              imgEditor.show();
                var imgly = new imglyKit({container: layout.find(".image-dialog-content")});
                imgEditor.find('.imgly-container').empty();

        });

    }

    this.serialize=function(){
        return this.portlet.find('.image-widget img').attr('src');
    }
    this.deserialize=function(content) {
        layout.find('.imageWidgetInnerContainer').hide();
        var img=layout.find('img');

        return img.attr('src', content);
    }
}
PictureWidget.prototype=new Widget();
PictureWidget.prototype.constructor=PictureWidget;