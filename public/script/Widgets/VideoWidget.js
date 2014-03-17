/**
 * Created by Bijan on 3/17/14.
 */
    // Youtube Thumbnail: See this http://stackoverflow.com/a/2068371/946835
function VideoWidget(){
    Widget.call(this);

    var videoSourceURL;
    var layout = '';

    function showVideo() {
        var videoURL;

        // Youtube
        var parts = this.videoSourceURL.split('/')
        var videoID = parts[parts.length-1];
        videoURL = '//www.youtube.com/embed/' + videoID;

        var iframe = $('<iframe width="100%" height="100%" frameborder="0" allowfullscreen></iframe>').attr('src', videoURL + '?rel=0')
        var container = $('<div class="videoWidget"></div>').append(iframe);
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

                showVideo.call(widget);
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
        showVideo.call(this);
    };
}
VideoWidget.prototype=new Widget();
VideoWidget.prototype.constructor=VideoWidget;
