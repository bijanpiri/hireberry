// Youtube Thumbnail: See this http://stackoverflow.com/a/2068371/946835
function VideoWidget(){
    Widget.call(this);

    var videoSourceURL;
    var layout = '';
    var URLInfo=undefined;
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
        $(this).remove("#thumbnailImg");
        var URLInfo=GetVideoID(this.videoSourceURL);
        var videoURL = undefined;
        if(URLInfo.IsValid)
        {
            if(URLInfo.host=="youtube")
            {
                videoURL='//www.youtube.com/embed/' + URLInfo.videoID+'?autoplay=1';
            }
            else if(URLInfo.host=="vimeo")
            {
                videoURL='//player.vimeo.com/video/' + URLInfo.videoID+'?autoplay=1';
            }
        }
        else
        {
            alert("The URL : '"+url+"' is not valid.");
        }
        var iframe = $('<iframe width="100%" height="100%" frameborder="0"  allowfullscreen></iframe>').attr('src', videoURL);
        var container = $('<div class="videoWidget" style="position: inherit"></div>').append(iframe);
        this.portlet.html('').append(container);

    }


    function showPreview() {

        var widget_tmp=this;
        var img = $('<img id="thumbnailImg" class="videoWidget" style="position: inherit" src=""/>').click(function()
        {
            playVideo.call(widget_tmp);
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
        this.portlet.html('').append(container);
        ShowThumbnail($(img),this.videoSourceURL,2);

       //img.height( this.portlet.height());
        //alert(img.height());
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
               // showVideo.call(widget);
            }
        }(this)));
    }

    initLayout.call(this);

    this.setLayout(layout);

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
