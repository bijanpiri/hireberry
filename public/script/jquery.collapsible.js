/**
 * Created by Bijan on 06/12/2014.
 */
(function($){

    $(document).ready(function(){
        $('[data-role="collapsible"]').collapsible();
    });
    var list;
    var drop;
    $.fn.collapsible=function(){
        list=$(this).children('ul');

        drop= $('<li class="bool-collapsed-dropdown">')
            .append(list.clone());


        list.append(drop);
    }

}(jQuery));
