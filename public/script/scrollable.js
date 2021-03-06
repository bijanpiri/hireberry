/**
 * Created by Bijan on 05/29/2014.
 */
(function($) {

    var start=0;
    var opt;
    var scrollable;
    $(document).ready(function(){
        $('[data-role="scrollable"]').scrollable();
    });
    $.fn.scrollable = function () {

        scrollable=this;

        this.find('[data-scroll=up]').click(scrollUp);

        this.find('[data-scroll=down]').click(scrollDown);

        this.find('ul[data-list]').bind('mousewheel DOMMouseScroll',function(event){
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

    function scrollDown() {
        start++;
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
            up.css('visibility','hidden');
        else up.css('visibility','visible');

        var sumHeight=0;

        var items=allItems;

        var index=0;
        var maxHeight=scrollable.height();
        var margin=scrollable.attr('data-margin');
        if(margin){
            maxHeight-=parseInt(margin);}

        for(var i=start;i<items.length;i++) {
            sumHeight+=$(items[i]).outerHeight(true);
            index=i;
            if (sumHeight>maxHeight) {
                index--;
                break;
            }
        }
        start--;
        while(start>=0 && sumHeight+$(items[start]).outerHeight(true)<maxHeight )
        {
            sumHeight+=$(items[start]).outerHeight(true);
            start--;
        }

        start++;

        if(index+1==allItems.length)
            down.css('visibility','hidden');
        else down.css('visibility','visible');

        allItems.slice(start,index+1).show();
    }
}(jQuery));
