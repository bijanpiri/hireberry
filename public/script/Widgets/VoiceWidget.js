/**
 * Created by Bijan on 3/17/14.
 */

    // Sound Cloud 4 Test: http://soundcloud.com/oembed?format=json&url=https://soundcloud.com/saghi-s/2vznv6x4pmxh
    // Youtube 4 Test: //www.youtube.com/embed/n_6p-1J551Y

function VoiceWidget(){
    Widget.call(this);

    var layout = 'Voice Layout 1';

    function showVoice() {
        // SoundCloud
        $.get('http://soundcloud.com/oembed?format=json&url=' + this.voiceSourceURL)
            .done( (function(widget) {
                return function(res){
                    widget.portlet.html( embeded );
                }
            })(this))

    }

    function initLayout() {
        var inputbox = '<div class="videoWidgetInputboxOutter">'+
            '<input type="text" id="videoWidgetInputboxText" placeholder="Paste your video link here">'+
            '<button class="wbtn wbtn-2 wbtn-2a videoWidgetInputboxDone" id="done">Done</button>'+
            '<div class="videoWidgetInputboxFooter">Soundcloud is supported</div>'+
            '</div></div>';

        var outter = $('<div>').addClass('videoWidgetOuter').append(inputbox);
        layout = $(outter)

        layout.find('#done').click( (function(widget){
            return function(){
                widget.voiceSourceURL = widget.portlet.find('#videoWidgetInputboxText').val();

                showVoice.call(widget);
            }
        }(this)));
    }

    initLayout.call(this);

    this.setLayout(layout);

    this.serialize = function() {
        return {voiceURL: this.voiceSourceURL};
    }

    this.deserialize = function( content ) {
        this.voiceSourceURL = content.voiceURL;
        showVoice.call(this);
    };
}
VoiceWidget.prototype = new Widget();
VoiceWidget.prototype.constructor = VoiceWidget;
