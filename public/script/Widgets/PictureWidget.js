function PictureWidget(){
    Widget.call(this);

    var layout = "";
    var coordinates;
    function initLayout1() {
        layout = this.clone('.image-widget');

        var file = layout.find('input[type=file]');
        layout.find('button').click(function(){file.click();});



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
        this.addToolbarCommand('add',function(){
            layout.find('input[type=file]').click();
        });
        this.addToolbarCommand('edit',function(){
            var img=$(layout.find('img')[0]);
            img.Jcrop({

                onSelect: function (coords) {
                    coordinates = coords;
                },
                onRelease: function () {
                    coordinates = null;
                },
                allowSelect: true,
                allowMove: true,
                allowResize: true
            });
           img.setOptions({ allowMove: true,
                allowMove: true,
                allowResize: true});

        });

        $('#can_size').change(function(e) {
            jcrop_api.setOptions({ allowResize: !!this.checked });
        });

    }
    $('#crop').on('click', function (event) {
        event.preventDefault();
        var img = result.find('img, canvas')[0];
        if (img && coordinates) {
            replaceResults(loadImage.scale(img, {
                left: coordinates.x,
                top: coordinates.y,
                sourceWidth: coordinates.w,
                sourceHeight: coordinates.h,
                minWidth: result.width()
            }));
            coordinates = null;
        }
    });
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