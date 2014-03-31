function BadgeWidget(){
    Widget.call(this);

    var layout = '';

    function visibleBadgesChanged() {

        var count = this.toolbar.find('input[name=badge]:checked').length;

        if( count == 0 ) { // Empty-State
            this.portlet.find('.emptyState').show();
        }
        else {
            this.portlet.find('.emptyState').hide();
        }
    }

    function initLayout() {
        layout = this.clone('.badgeWidget');
    }

    initLayout.call(this);
    this.setLayout(layout);

    this.widgetDidAdd = function() {
        this.portlet.find('.badgeOuterFrame').click(function(){

            var isInExpandedMode = ( parseInt( $(this).attr('expanded') ) == 1 );
            var icon = $(this).find('.badgeIcon');
            var text = $(this).find('.badgeDescription');
            var box = $(this).find('.badgeFrame');
            var scaleMargin = -10;

            var scaleIcon = function( start, end ) {

                // A trick to start scaling
                icon.animate( {scale:start},0);

                icon.animate( {scale:end}, {
                    step: function(now,fx) {
                        var scaleFunction = "scale(" + now + "," + now + ")";
                        $(this).css('-webkit-transform', scaleFunction);
                        $(this).css('-moz-transform', scaleFunction);
                        $(this).css('-o-transform', scaleFunction);
                        $(this).css('-ms-transform', scaleFunction);
                        $(this).css('transform', scaleFunction);
                    },
                    duration:100
                },'linear');
            }

            if( isInExpandedMode ){

                box.animate( { top:0, bottom:0, left:0, right:0 }, 100 );
                icon.animate( {top:0, opacity:1}, 300 , function() { scaleIcon(0.5,1); });
                text.animate( {bottom: -2 * $(this).height() ,opacity:0}, 300 );
                $(this).attr('expanded','0');

            } else {

                $(".badgeOuterFrame[expanded='1']").click();

                scaleIcon(1,0.5);

                box.animate( { top:scaleMargin, bottom:scaleMargin, left:scaleMargin, right:scaleMargin }, 100 );
                icon.animate( {top: 0, opacity:0.1}, 300 )
                text.animate( {bottom:0 ,top: 0, opacity:1}, 300 );
                $(this).attr('expanded','1');
            }
        });
        this.setToolbar('.toolbar-badgeWidget');
        var badges=this.portlet;
        var widget=this;

        this.toolbar.find('input[name=badge]')
            .each(function(i,input){
                $(input).change(function(){
                    badges.find('.'+input.value).css('display',input.checked ?'':'none');
                    visibleBadgesChanged.call(widget);
                });
            });

        visibleBadgesChanged.call(this);
    }

    this.serialize = function() {
        var data = {
            chosen:this.toolbar.find('.toolbar-badgeWidget input').serialize().replace(/badge=/gi,'').split('&')
        };
        return data;
    }

    this.deserialize = function( data ) {
        this.toolbar.find('input[name=badge]').each(function(index,input){
            $(input).prop('checked',data.chosen.indexOf(input.value)>=0).change();
        });
    }
}
BadgeWidget.prototype=new Widget();
BadgeWidget.prototype.constructor=BadgeWidget;
BadgeWidget.instances = 1