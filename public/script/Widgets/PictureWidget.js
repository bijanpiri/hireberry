//ToDo: When user change a picture it must be deleted in server.

function PictureWidget(){
    Widget.call(this);

    var layout = "";
    var widget=this;
    var bar;
    var gettingReady=false;
    var statesAction={
        none:function(){
           widget.prepared();
        },
        add:function(){
            gettingReady=true;
            save();
        },
        uploading:function(){
            gettingReady=true;
        },
        uploaded:function(){
            widget.prepared();

        }};
    var action=statesAction.none;

    function initLayout1() {
        layout = this.clone('.image-widget');

        bar = layout.find('.progress').hide();
        var fileInput = layout.find('input[type=file]');

        layout.find('.imageWidgetInnerContainer').click(function(e){
            fileInput.click();
            e.stopPropagation()
        });

    }

    function showCropButtons(){
        widget.toolbar.find(
                '[command=crop],' +
                '[command=undo],' +
                '[command=redo],' +
                '[command=save],' +
                '[command=rotate-left],' +
                '[command=rotate-right]').hide();
        widget.toolbar.find(
                '[command=accept],' +
                '[command=cancel]' ).show();
    }
    function hideCropButtons(){
        widget.toolbar.find(
                '[command=accept],' +
                '[command=cancel]' ).hide();
        widget.toolbar.find(
                '[command=crop],' +
                '[command=undo],' +
                '[command=redo],' +
                '[command=save],' +
                '[command=rotate-left],' +
                '[command=rotate-right]').show();
    }
    $(window).resize(function(){
        var img=layout.find('img')[0];
        var container=layout.find('.image-container');

//        if(img && img.src)
//            new Darkroom(img,
//                {
//                    maxWidth: container.width(),
//                    maxHeight: container.width() * img.height/img.width
//                }
//            )
    });
    var dark;
    var image;
    function readerLoad(progress) {
        try {
            var d=progress.target.result;
            layout.find('.imageWidgetInnerContainer').hide();
            layout.find('.image-container').empty().append('<img>');
            layout.find('img').attr('src',d).show();
        var container=layout.find('.image-container');
            var img=layout.find('img')[0];
            image=new Image();
            image.src=d;
//            var img=new Image();
//            img.src=d;
            dark=new Darkroom(img,
                {
                    maxWidth: container.width(),
                    maxHeight:container.width()*img.height/img.width
                });

            action=statesAction.add;
        } catch (ex) {
            console.log(ex);

        }
    }
    var dudata;
    function add(e,data){
        dudata=data;
        var obj=data.files[0];
        if(obj instanceof File){
            var reader = new FileReader();
            reader.onload =readerLoad;
            reader.readAsDataURL(data.files[0]);
        }else
            data.submit();
    }

    function send(){
        action=statesAction.uploading;
        bar.slideDown();
        layout.find('.imageWidgetInnerContainer').hide();
    }

    function done(e,data){
        action=statesAction.uploaded;
        bar.slideUp();
        var img = layout.find('img');
        img.attr('src', '/uploads/' + data.result.files[0].name).show();
        if(gettingReady){
            gettingReady=false;
            widget.prepared();
        }

    }
    function progressall(e,data){
        var progress = parseInt(data.loaded / data.total * 100, 10);
        bar.find('.bar').css('width',progress + '%');

    }

    initLayout1.call(this);

    this.setLayout(layout);

    this.widgetDidAdd=function(){
        this.setToolbar('.toolbar-picture');
        var widget = this;

        if(this.editMode){
            this.portlet.find('input[type=file]').fileupload({
                url:'/flyer/upload',
                dataType: 'json',
                replaceFileInput:false,
                add:add,
                dropZone:layout,
                send:send,
                done: done,
                progressall:progressall
            });

            this.addToolbarCommand('crop',function(){layout.find('.darkroom-icon-crop').click();showCropButtons();
            }).addToolbarCommand('accept',function(){layout.find('.darkroom-icon-accept').click();hideCropButtons();
                widget.changed();
            }).addToolbarCommand('cancel',function(){layout.find('.darkroom-icon-cancel').click();hideCropButtons();
            }).addToolbarCommand('undo',function(){layout.find('.darkroom-icon-back').click();
                widget.changed();
            }).addToolbarCommand('redo',function(){layout.find('.darkroom-icon-forward').click();
                widget.changed();
            }).addToolbarCommand('rotate-left',function(){layout.find('.darkroom-icon-rotate-left').click();
                widget.changed();
            }).addToolbarCommand('rotate-right',function(){layout.find('.darkroom-icon-rotate-right').click();
                widget.changed();
            }).addToolbarCommand('save',function(){save();
            });
        }
        else {
            this.portlet.find('.imageWidgetInnerContainer').remove();
        }
    }
    function save(){
        var data=widget.portlet.find('.lower-canvas')[0].toDataURL('image/jpeg');
//        layout.find('.image-container').empty().append($('<img>').attr('src',data));

        var blob=dataURLtoBlob(data);
        layout.find('input[type=file]').fileupload('add',{files:blob});

    }
    this.serialize=function(){
        return this.portlet.find('.image-widget img').attr('src');
    }

    this.deserialize=function(content) {
        hideEditButton();
        action=statesAction.none;
        if( content ) {
            this.portlet.find('.imageWidgetInnerContainer').remove();
            var img = layout.find('.image-container').empty().append($('<img>').attr('src',content));
            action=statesAction.uploaded;
        }
    }

    this.getReady4Save=function(){
        action();
    }
    this.changed=function(){
        action=statesAction.add;
    }
}
PictureWidget.prototype=new Widget();
PictureWidget.prototype.constructor=PictureWidget;