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

        // As soon as the user clicks the render button...
        // Listen for "Render final image" click

//        renderButton.click(function (event) {
//            var dataUrl;
//
//            // dataUrl = imgly.renderToDataURL("png", function (err, dataUrl) {});
//            // `dataUrl` now contains the full-sized rendered image
//            // Caution: This string will probably exceed the maximum
//            // dataURL size of 2M. You will not be able to set location.href
//            // or an <img> tag's `src` attribute to this dataUrl.
//
//            // dataUrl = imgly.renderToDataURL("png", { maxSize: "100x100" }, function (err, dataUrl) {});
//            // `dataUrl` now contains a resized rendered image that
//            // does not exceed 100x100 while keeping the ratio
//
//            // dataUrl = imgly.renderToDataURL("png", { size: "100x100" }, function (err, dataUrl) {});
//            // `dataUrl` now contains a resized rendered image with
//            // a size of 100x100 pixels while _not_ keeping the ratio
//
//            imgly.renderToDataURL("png", { size: "300x" }, function (err, dataUrl) {
//                // `dataUrl` now contains a resized rendered image with
//                // a width of 300 pixels while keeping the ratio
//
//                $("<img>").attr({
//                    src: dataUrl
//                }).appendTo($("body"));
//            });
//            imgEditor.show();
//        });
//


        if(editMode){
            fileInput.fileupload({
                url:'/flyer/upload',
                dataType: 'json',
                replaceFileInput:false,
                add:function(e,dudata){
                    imgEditor.show();
                    var reader = new FileReader();
                    reader.onload =
                        function (e) {
                            try {
                                imgEditor.find('.imgly-container').empty();
                                var d=e.target.result;
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

                            } catch (e) {
                                console.log(e);
                                imgEditor.hide();

                                if(e.name == "NoSupportError") {
                                    alert("Your browser does not support canvas.");
                                } else if(e.name == "InvalidError") {
                                    alert("The given file is not an image");
                                }
                            }
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