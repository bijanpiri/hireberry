function PictureWidget(){
    Widget.call(this);

    var layout = "";
    var jcropApi;
    var coordinates;
    var imgly = new imglyKit({container: "#imageEditor"});
    function initLayout1() {
        layout = this.clone('.image-widget');

        var fileInput = layout.find('input[type=file]').change(

        );
        var imgEditor=$('.image-editor-dialog');
        layout.find('button').click(function(){
            fileInput.click();
        });




        if(editMode){
            fileInput.fileupload({
                url:'/flyer/upload',
                dataType: 'json',
                replaceFileInput:false,
                add:function(e,dudata){
                    imgEditor.show();
                    var reader = new FileReader();
                    reader.onload =
                        function (progress) {
//                            try {
                                imgEditor.find('.imgly-container').empty();
                                var d=progress.target.result;
                                imgly.run(d);
                                imgEditor.find('.image-edit-cancel').click(function(){
                                    imgEditor.hide();
                                });
                                imgEditor.find('.image-edit-ok').click(function(){
                                    imgEditor.hide();
                                    imgly.renderToDataURL("image/jpeg", function (err, dataurl){
                                        var blob=dataURLtoBlob(dataurl);
//                                        dudata.files=[];
                                        dudata.files[0]=blob;
//                                        fileInput.fileupload('option','formData',undefined);
                                        dudata.submit();
                                    });
                                });

//                            } catch (ex) {
//                                console.log(ex);
//                                imgEditor.hide();
//
//                                if(ex.name == "NoSupportError") {
//                                    alert("Your browser does not support canvas.");
//                                } else if(ex.name == "InvalidError") {
//                                    alert("The given file is not an image");
//                                }
//                            }
                        };

                    reader.readAsDataURL(dudata.files[0]);
                },
                done: function (e, data) {
                    layout.find('.imageWidgetInnerContainer').hide();
                    var img=layout.find('img');
                    img.attr('src', '/uploads/' + data.result.files[0].name);
                },
                progressall:function (e, data) {
                    var progress = parseInt(data.loaded * 100/ data.total , 10);
                    console.log(progress);
                }
            });
            fileInput.fileupload('option',{dropZone:layout});
        } else {
            this.portlet.find('input[type=file]').remove();
        }
    }

    initLayout1.call(this);

    this.setLayout(layout);

    this.widgetDidAdd=function(){
        this.setToolbar('.toolbar-picture');
        var widget=this;

        this.addToolbarCommand('add',function(){
            layout.find('input[type=file]').click();
        }).addToolbarCommand('edit',function(){
                event.preventDefault();
                var img=layout.find('img');
                img.Jcrop({
                    onSelect: function (coords) {
                        coordinates = coords;
                    },
                    onRelease: function () {
                        coordinates = null;
                    }
                },function(){jcropApi=this;});

                widget.toolbar.find('[command=crop]').show();
                widget.toolbar.find('[command=edit]').hide();

            }).addToolbarCommand('crop',function(){
                event.preventDefault();
                widget.toolbar.find('[command=crop]').hide();
                widget.toolbar.find('[command=edit]').show();

                var img=layout.find('img');
                if(img && coordinates){
                    replaceResults(loadImage.scale(img[0], {
                        left: coordinates.x,
                        top: coordinates.y,
                        sourceWidth: coordinates.w,
                        sourceHeight: coordinates.h,
                        minWidth: img.width()
                    }));
                    coordinates = null;
                }
                if(jcropApi)
                    jcropApi.destroy();
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