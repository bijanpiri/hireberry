function PictureWidget(){
    Widget.call(this);

    var layout = "";

    var imgEditor;
    var bar;

    function initLayout1() {
        layout = this.clone('.image-widget');
        bar=layout.find('.progress').hide();
        var fileInput = layout.find('input[type=file]');
        layout.find('button').click(function(){
            fileInput.click();
        });
        imgEditor=layout.find('.image-editor-dialog');
        imgEditor.find('.image-edit-cancel').click(function(){
            imgEditor.hide();
        });
        imgEditor.find('.image-edit-ok').click(editImage);


        if(editMode){
            fileInput.fileupload({
                url:'/flyer/upload',
                dataType: 'json',
                replaceFileInput:false,
                add:add,
                dropZone:layout,
                send:send,
                done: done,
                progressall:progressall
            });

        }
        else {
            this.portlet.find('input[type=file]').remove();
        }
    }
    function readerLoad(progress) {
        try {
            imgly = new imglyKit({container: layout.find(".image-dialog-content")});
            imgEditor.find('.imgly-container').empty();
            var d=progress.target.result;
            imgly.run(d);


        } catch (ex) {
            console.log(ex);
            imgEditor.hide();

            if(ex.name == "NoSupportError") {
                alert("Your browser does not support canvas.");
            } else if(ex.name == "InvalidError") {
                alert("The given file is not an image");
            }
        }
    }
    var dudata;
    function add(e,data){
        dudata=data;
        var obj=data.files[0];
        if(obj instanceof File){
            imgEditor.show();
            var reader = new FileReader();
            reader.onload =readerLoad;
            reader.readAsDataURL(data.files[0]);

        }else
            data.submit();
    }

    function send(){
        bar.slideDown();
        layout.find('.imageWidgetInnerContainer').hide();
    }

    function done(e,data){
        bar.slideUp();
        var img=layout.find('img');
        img.attr('src', '/uploads/' + data.result.files[0].name);

    }
    function progressall(e,data){
        var progress = parseInt(data.loaded / data.total * 100, 10);
        bar.find('.bar').css('width',progress + '%');

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
                imgly = new imglyKit({container: layout.find(".image-dialog-content")});
                imgEditor.find('.imgly-container').empty();
                var img=new Image();
                img.src=layout.find('img').attr('src');
                if(!layout.find('img').attr('src')){
                    imgEditor.hide();
                    alert('First of all add a picture by drag and drop or browse button.');
                    return;
                }
                imgly.run(img);
            });

    }
    var imgly;
    function editImage(){
        imgEditor.hide();
        imgly.renderToDataURL("image/jpeg", function (err, dataurl){
            //shows preview
            layout.find('img').attr('src',dataurl);

            //convert to blob in order to upload it.
            var blob=dataURLtoBlob(dataurl);

            layout.find('input[type=file]').fileupload('add',{files:blob});
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