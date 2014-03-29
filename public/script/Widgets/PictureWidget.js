function PictureWidget(){
    Widget.call(this);

    var layout = "";
    var jcropApi;
    var coordinates;
    function initLayout1() {
        layout = this.clone('.image-widget');

        var file = layout.find('input[type=file]');
        layout.find('button').click(function(){
            file.click();
        });



        if(editMode){
            file.fileupload({
                url:'/flyer/upload',
                dataType: 'json',
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
            file.fileupload('option',{dropZone:layout});
        } else {
            this.portlet.find('input[type=file]').remove();
        }
    }

    initLayout1.call(this);

    this.setLayout(layout);

    this.widgetDidAdd=function(){
        this.setToolbar('.toolbar-picture');
        var widget=this;
        var replaceResults = function (img) {
            var content;
            if (!(img.src || img instanceof HTMLCanvasElement)) {
                content = $('<span>Loading image file failed</span>');
            } else {
                content = $('<a target="_blank">').append(img)
//                    .attr('download', currentFile.name)
                    .attr('href', img.src || img.toDataURL());
            }
            layout.children('img').replaceWith(content);

        }
        this.addToolbarCommand('add',function(){
            layout.find('input[type=file]').click();
        }).addToolbarCommand('edit',function(){
            event.preventDefault();
            var img=layout.find('img');
            jcropApi= img.Jcrop({

                onSelect: function (coords) {
                    coordinates = coords;
                },
                onRelease: function () {
                    coordinates = null;
                },
                allowSelect: true,
                allowMove: true,
                allowResize: true
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
                        minWidth: $(img).width()
                    }));
                    coordinates = null;
                }
                if(jcropApi)
                   jcropApi.release().destroy();
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