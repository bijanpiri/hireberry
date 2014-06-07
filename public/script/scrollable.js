/**
 * Created by Bijan on 05/29/2014.
 */
(function($) {

    var start=0;
    var opt;
    var scrollable;
    $(document).ready(function(){
        $('[data-scrollable]').scrollable();
    });
    $.fn.scrollable = function (options) {

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
        $(window).resize(scroll);

        scroll();
        return scrollable;

    };
    $.fn.scrollDown=scrollDown;

    function scrollDown(down) {
        if(!down || down instanceof jQuery.Event)
            down=1;
        start=Math.min(
                start+down,
                Math.abs(scrollable.find('ul>li').length-opt.nv));
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
        var allItems = scrollable.find('ul>li').hide();

        var down=scrollable.find('[data-scroll=down]');
        var up=scrollable.find('[data-scroll=up]');

        if(start<=0)
            up.hide();
        else up.show();

        if(start+opt.nv==allItems.length)
            down.hide();
        else down.show();

        var sumHeight=0;
        var items=allItems
            .slice(start);
        var index=0;
        var maxHeight=scrollable.find('ul').height();
        for(var i=0;i<items.length;i++) {
            sumHeight+=$(items[i]).outerHeight();
            index=i;
            if (sumHeight>maxHeight) {
                index--;
                break;
            }
        }
        items.slice(0,index+1).show();
    }
}(jQuery));
