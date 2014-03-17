/**
 * Created by Bijan on 3/17/14.
 */


function PictureWidget(){
    Widget.call(this);

    var layout = "";

    function initLayout1() {
        layout = this.clone('.imageWidget');

        var file = layout.find('input[type=file]');
        layout.find('button').click(function(){file.click();});

        var widget=this;

        if(editMode){
            file.fileupload({
                url:'/flyer/upload',
                dataType: 'json',
                done: function (e, data) {
                    var img=$('<img>');
                    layout.html(img);
                    img.attr('src', '/uploads/' + data.result.files[0].name);
                },
                progress:function (e, data) {
                    var progress = parseInt(data.loaded / data.total * 100, 10);
                }
            });
            file.fileupload('option',{dropZone:layout});
        } else {
            this.portlet.find('input[type=file]').remove();
        }
    }

    initLayout1.call(this);

    this.setLayout(layout);

    // Setup the dnd listeners.
    this.handleFileSelect=function(evt) {
        var files = evt.target.files; // FileList object

        // files is a FileList of File objects. List some properties.
        var output = [];
        for (var i = 0, f; f = files[i]; i++) {
            output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                f.size, ' bytes, last modified: ',
                f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                '</li>');
        }
        document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
    }
    this.serialize=function(){
        return this.portlet.find('.portlet-picture').attr('src');
    }
    this.deserialize=function(content) {
        return this.portlet.find('.portlet-picture').attr('src', content);
    }
}
PictureWidget.prototype=new Widget();
PictureWidget.prototype.constructor=PictureWidget;

