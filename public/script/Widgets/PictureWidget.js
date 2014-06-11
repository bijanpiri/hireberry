//ToDo: When user change a picture it must be deleted in server.

function PictureWidget(){
    Widget.call(this);

    var layout = "";
    var widget=this;
    var masker=$(
            '<div class="bool-clipper-masker" >' +
            '<div class="bool-clipper-mask bool-clipper-mask-top" ></div>'+
            '<div class="bool-clipper-mask bool-clipper-mask-left" ></div>'+
            '<div class="bool-clipper-mask bool-clipper-mask-right" ></div>'+
            '<div class="bool-clipper-mask bool-clipper-mask-bottom" ></div>'+
            '</div>');

    var clipper=$(

            '<div class="bool-clipper" style="position: absolute;">'+
//            '<div class="bool-clip-handle ui-resizable-handle ui-resizable-handle-nw bool-handle-nw"></div>'+
//            '<div class="bool-clip-handle ui-resizable-handle ui-resizable-handle-ne bool-handle-ne"></div>'+
//            '<div class="bool-clip-handle ui-resizable-handle ui-resizable-handle-sw bool-handle-sw"></div>'+
//            '<div class="bool-clip-handle ui-resizable-handle ui-resizable-handle-se bool-handle-se"></div>'+
//   '<div class="bool-clip-handle ui-resizable-handle ui-resizable-handle-n bool-handle-n"></div>'+
//   '<div class="bool-clip-handle ui-resizable-handle ui-resizable-handle-s bool-handle-s"></div>'+
//   '<div class="bool-clip-handle ui-resizable-handle ui-resizable-handle-w bool-handle-w"></div>'+
//   '<div class="bool-clip-handle ui-resizable-handle ui-resizable-handle-e bool-handle-e"></div>'+
            '<a class="bool-crop-ok bool-btn bool-btn-crop"><i></i></a>'+
            '<a class="bool-crop-cancel bool-btn bool-btn-crop"><i></i></a>'+
            '</div>' );
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

    function showCrop(){
        var container=layout.find('.image-container');
        container.find('.bool-clipper').remove();
        container.find('.bool-clipper-masker').remove();
        container.append(clipper.clone()
            .resizable({
                    handles: "n,s,e,w,ne,nw,se,sw",
                    containment:'parent',
                    minHeight: 50,
                    minWidth: 50,
                    resize:function(){

                    }
                })
            .draggable({ containment: "parent" }))
            .append(masker.clone()
        );

        container.find('.bool-crop-cancel')
            .click(function(){
                container.find('.bool-clipper').remove();
            });
        container.find('.bool-crop-ok')
            .click(function(){

            });
    }
    function hideCrop(){
        widget.toolbar.find(
                '[command=accept],' +
                '[command=cancel]' ).hide();
    }
    $(window).resize(function(){
        var img=layout.find('img')[0];
        var container=layout.find('.image-container');
    });

    var image;
    function readerLoad(progress) {
        try {
            var d=progress.target.result;
            var container=layout.find('.image-container');
            container.append($('<img>').attr('src',d));
            layout.find('.imageWidgetInnerContainer').hide();
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

            this.addToolbarCommand('crop',function(){showCrop();
            }).addToolbarCommand('accept',function(){layout.find('.darkroom-icon-accept').click();hideCrop();
                widget.changed();
            }).addToolbarCommand('cancel',function(){layout.find('.darkroom-icon-cancel').click();hideCrop();
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

    function resizeAndUpload() {

            var tempImg = new Image();

            tempImg.onload = function() {


                var canvas = document.createElement('canvas');
                canvas.width = tempImg.width;
                canvas.height = tempImg.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(this, 0, 0, tempW, tempH);
                var dataURL = canvas.toDataURL("image/jpeg");

                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function(ev){
                    document.getElementById('filesInfo').innerHTML = 'Done!';
                };

                xhr.open('POST', 'uploadResized.php', true);
                xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
                var data = 'image=' + dataURL;
                xhr.send(data);
            }
    }
}
PictureWidget.prototype=new Widget();
PictureWidget.prototype.constructor=PictureWidget;