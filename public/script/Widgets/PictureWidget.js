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
            '<a class="bool-crop-ok bool-btn bool-btn-crop"><i></i></a>'+
            '<a class="bool-crop-cancel bool-btn bool-btn-crop"><i></i></a>'+
            '</div>' );
    var bar;
    var gettingReady=false;
    var undoStack=[];
    var redoStack=[];


    function undo(){
        if(undoStack.length==0)
            return false;

        var image=undoStack.pop();
        var img = widget.portlet.find('img');
        var redoImg=new Image();
        redoImg.src=img.attr('src');

        redoStack.push(redoImg);
        img.attr('src',image.src);

        updateBtn();

        return true;
    }

    function redo(){
        if(redoStack.length==0)
            return false;

        var img = widget.portlet.find('img');

        var undoImg=new Image();
        undoImg.src=img.attr('src');
        undoStack.push(undoImg);

        var image=redoStack.pop();
        img.attr('src', image.src);
        updateBtn();
    }

    function change(){
        var image=new Image();
        image.src=widget.portlet.find('img').attr('src');

        undoStack.push(image);

        redoStack=[];
        updateBtn();
    }
    function updateBtn(){
        var undobtn=widget.toolbar.find('[command=undo]');
        var redobtn=widget.toolbar.find('[command=redo]');
        if(undoStack.length>0)
            undobtn.removeClass('bool-disable');
        else
            undobtn.addClass('bool-disable');

        if(redoStack.length>0)
            redobtn.removeClass('bool-disable');
        else
            redobtn.addClass('bool-disable');
    }

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
    function remask(){
        var container=layout.find('.image-container');
        var clip = container.find('.bool-clipper');
        var top=clip.position().top+'px';
        var bottom=clip.position().top+clip.height()+'px';
        container.find('.bool-clipper-mask-top')
            .height(top);

        container.find('.bool-clipper-mask-bottom')
            .css('top',bottom);

        container.find('.bool-clipper-mask-left').width(clip.position().left)
            .css('top',top).height(clip.height());

        container.find('.bool-clipper-mask-right')
            .css('left',clip.width()+clip.position().left)
            .css('top',top).height((clip.height()));



    }
    function showCrop(){

        var container=layout.find('.image-container');
        var clip=clipper.clone();
        clip.css('top',container.height()/3+'px');
        clip.css('left',container.width()/3+'px');
        clip.css('width',container.width()/3+'px');
        clip.css('height',container.height()/3+'px');

        container.append(clip
            .resizable({
                    handles: "n,s,e,w,ne,nw,se,sw",
                    containment:'parent',
                    minHeight: 50,
                    minWidth: 120,
                resize:remask})
            .draggable({
                containment: "parent",
                drag:remask,
                stop:remask
            }))
            .append(masker.clone());
        container.find('.bool-crop-cancel')
            .click(function(){
                hideCrop();
            });
        container.find('.bool-crop-ok')
            .click(function(){
                crop();
            });
        remask();
    }
    function hideCrop(){
        var container=layout.find('.image-container');
        container.find('.bool-clipper').remove();
        container.find('.bool-clipper-masker').remove();
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
            }).addToolbarCommand('undo',function(){undo();
                widget.changed();
            }).addToolbarCommand('redo',function(){redo();
                widget.changed();
            }).addToolbarCommand('rotate-left',function(){rotate(true);
            }).addToolbarCommand('rotate-right',function(){rotate(false);
            }).addToolbarCommand('save',function(){save();
            });
        }
        else {
            this.portlet.find('.imageWidgetInnerContainer').remove();

        }
    };
    function save(){
        var src=widget.portlet.find('img').attr('src');

        if(src.indexOf('data')==0) {
            var blob = dataURLtoBlob(src);
        layout.find('input[type=file]').fileupload('add',{files:blob});
        }

    }
    this.serialize=function(){
        return this.portlet.find('.image-widget img').attr('src');
    };

    this.deserialize=function(content) {

        action=statesAction.none;
        if( content ) {
            this.portlet.find('.imageWidgetInnerContainer').remove();
            var img = layout.find('.image-container').empty().append($('<img>').attr('src',content));
            action=statesAction.uploaded;
        }
    };

    this.getReady4Save=function(){
        action();
    };
    this.changed=function(){
        action=statesAction.add;
    };

    function rotate(left){
        change();
        var img=new Image();
        img.src=widget.layout.find('img')[0].src;
        img.onload=function() {
            var canvas = document.createElement('canvas');
            canvas.width = img.height;
            canvas.height = img.width;

            var ctx = canvas.getContext('2d');
            var x = 0, y = 0;
            if (left) {
                x = -img.width;
                ctx.rotate(-Math.PI / 2);
    }
            else {
                y = -img.height;
                ctx.rotate(Math.PI / 2);
            }
            ctx.drawImage(img, x, y);

            var dataURL = canvas.toDataURL('image/jpeg');
            widget.layout.find('img').attr('src', dataURL);
        }

    }
    function crop(){
        change();
        var container=widget.layout.find('.image-container');
        var img=container.find('img');
        var clip=container.find('.bool-clipper');

            var tempImg = new Image();
        tempImg.src=img.attr('src');
            tempImg.onload = function() {
                var canvas = document.createElement('canvas');
                var scale = tempImg.width / img.width();
                var width = clip.width() * scale;
                var height = clip.height() * scale;
                canvas.width = width;
                canvas.height = height;
                    var ctx = canvas.getContext("2d");
                var pos = clip.position();

                ctx.drawImage(tempImg,
                        pos.left * scale, pos.top * scale, width, height,
                    0, 0, width, height
                );
                    var dataURL = canvas.toDataURL("image/jpeg");

                img.attr('src', dataURL);

                hideCrop();
            }
    }
}
PictureWidget.prototype=new Widget();
PictureWidget.prototype.constructor=PictureWidget;