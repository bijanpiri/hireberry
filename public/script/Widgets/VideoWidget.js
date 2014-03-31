// Youtube Thumbnail: See this http://stackoverflow.com/a/2068371/946835
function VideoWidget(){
    Widget.call(this);

    var videoSourceURL;
    var layout = '';

    /* function showVideo() {
     var videoURL;

     // Youtube
     var parts = this.videoSourceURL.split('/')
     var videoID = parts[parts.length-1];
     videoURL = '//www.youtube.com/embed/' + videoID;

     var iframe = $('<iframe width="100%" height="100%" frameborder="0" allowfullscreen></iframe>').attr('src', videoURL + '?rel=0')
     var container = $('<div class="videoWidget" ></div>').append(iframe);
     this.portlet.html('').append(container);

     }*/

    function playVideo()
    {
        var tmp_videoWidget=this;
        var host=GetHostVideo(this.videoSourceURL);
        if(host!='')
        {
            var himg=this.portlet.find("#thumbnailImg").height();
            var wimg=this.portlet.find("#thumbnailImg").width();
            this.portlet.remove("#thumbnailImg");
            var videoURL = undefined;
            if(host=="vimeo")
            {
                $.get('http://vimeo.com/api/oembed.json?url=http%3A//'+this.videoSourceURL).done(function(response)
                {
                    var parse_response= eval(response);
                    videoURL='//player.vimeo.com/video/' +parse_response['video_id'] +'?autoplay=1';
                    var iframe = $('<iframe width="100%" height="100%" frameborder="0"  allowfullscreen></iframe>').attr('src', videoURL);
                    var container = $('<div class="videoWidget"  style="position: inherit"></div>').append(iframe);
                    container.height(himg);
                    container.width(wimg);
                    tmp_videoWidget.portlet.html('').append(container);
                });
            }
            else if(host=="youtube")
            {
                videoURL='//www.youtube.com/embed/' +GetYoutubeVideoID(this.videoSourceURL).videoID +'?autoplay=1';
                var iframe = $('<iframe width="100%" height="100%" frameborder="0"  allowfullscreen></iframe>').attr('src', videoURL);
                var container = $('<div class="videoWidget" style="position: inherit"></div>').append(iframe);
                container.height(himg);
                container.width(wimg);
                tmp_videoWidget.portlet.html('').append(container);
            }
        }
        else
        {
            alert("The URL : '"+url+"' is not valid.");
        }
    }

    function showPreview() {

        var widget_tmp=this;
        var img = $('<img id="thumbnailImg" class="videoWidget" style="position: inherit" src=""/>').click(function()
        {
            playVideo.call(widget_tmp);
        });

        img.load(function()
        {
            container.width(this.naturalWidth);
            container.height(this.naturalHeight);

            //img.height(this.naturalHeight);
            //img.width(this.naturalWidth);
            $(this).height(this.naturalHeight);
            $(this).width(this.naturalWidth);
        });

        img.mouseout(function()
        {
            img.fadeTo('fast',1.0,function(){});
        });
        img.mouseenter(function()
        {
            img.fadeTo('fast',0.5,function(){});
        });

        var container = $('<div class="videoWidget"  style="position: inherit"></div>').append(img);
        ShowThumbnail($(img),this.videoSourceURL,2);
        this.portlet.html('').append(container);
    }

    function initLayout() {
        var emptyStateHtml = '<div class="videoWidgetOuter">'+
            '<div class="videoWidgetInputboxOutter">'+
            '<input type="text" id="videoWidgetInputboxText" placeholder="Paste your video link here">'+
            '<button class="wbtn wbtn-2 wbtn-2a videoWidgetInputboxDone" id="Done">Done</button>'+
            '<div class="videoWidgetInputboxFooter">Youtube and Vimeo are supported</div>'+
            '</div></div></div>';

        layout = $(emptyStateHtml);

        layout.find('#Done').click( (function(widget){
            return function(){
                widget.videoSourceURL = widget.portlet.find('#videoWidgetInputboxText').val();
                showPreview.call(widget);
                widget.toolbar.find('.videoWidgetInputboxOutterToolbar').show();
                // showVideo.call(widget);
            }
        }(this)));
    }

    initLayout.call(this);

    this.setLayout(layout);

    this.widgetDidAdd=function(){
        this.setToolbar('.toolbar-videoWidget');
        this.toolbar.find('.videoWidgetInputboxOutterToolbar').hide();

        var widget=this;

        if(widget.editMode==false)
        {
            widget.portlet.find("#videoWidgetInputboxText").prop('readOnly','readOnly').css("cursor","default");
            widget.portlet.find("#Done").off();
        }

        this.addToolbarCommand('done',function(){
            while(widget.portlet.find(".videoWidget").length>0)
            {
                widget.portlet.find(".videoWidget")[0].remove();
            }
            widget.videoSourceURL = widget.toolbar.find('#videoWidgetInputboxTextToolbar').val();
            showPreview.call(widget);
        });

       /* this.toolbar.find('#DoneToolbar').click( (function(widget){
            return function(){
                while(widget.portlet.find(".videoWidget").length>0)
                {
                    widget.portlet.find(".videoWidget")[0].remove();
                }
                widget.videoSourceURL = widget.toolbar.find('#videoWidgetInputboxTextToolbar').val();
                showPreview.call(widget);
            }
        }(this)));*/
    }

    this.serialize = function() {
        return {videoURL: this.videoSourceURL};
    }

    this.deserialize = function( content ) {
        this.videoSourceURL = content.videoURL;
        //showVideo.call(this);
        showPreview.call(this);
    };
}
VideoWidget.prototype=new Widget();
VideoWidget.prototype.constructor=VideoWidget;
