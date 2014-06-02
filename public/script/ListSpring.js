/**
 * Created by Bijan on 05/29/2014.
 */
(function($) {

    var start=0;
    var opt;
    var scrollable;
    $(document).ready(function(){
        $('[data-scrollable]').listSpring();
    });
    $.fn.listSpring = function (options) {

        if (!options)
            options = {mode: 'scroll' | 'dropdown', nv: 5};
        opt=options;

        scrollable=this;

        this.find('[data-scroll=up]').click(scrollUp);

        this.find('[data-scroll=down]').click(scrollDown);

        this.find('ul').bind('mousewheel DOMMouseScroll',function(event){
            var deltaY = event.originalEvent.deltaY;

            if(deltaY>0)
                scrollDown();
            else
                scrollUp();

            event.preventDefault();
            event.stopPropagation();
        });

        scroll();
        return scrollable;

    };
    $.fn.scrollDown=scrollDown;

    function scrollDown(down) {
        if(!down || down instanceof jQuery.Event)
            down=1;
        start=Math.min(
                start+down,
                Math.abs(scrollable.children('ul>li').length-opt.nv));
        scroll();
        return scrollable;
    }

    $.fn.scrollUp=scrollUp;

    function scrollUp(up){
        if(!up || up instanceof jQuery.Event)
            up=1;
        start=Math.max(0,start-up);
        scroll();
        return scrollable;
    }
    function scroll() {
        scrollable.each(
            function () {
                var list = scrollable.find('ul');
                list.children('li').hide()
                    .slice(start, start + opt.nv).show();
            }
        )
    }

}(jQuery));
