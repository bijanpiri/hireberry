/**
 * Created by Bijan on 3/17/14.
 */

function ButtonWidget(){
    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = $('<a>')
            .addClass('btn btn-success')
            .text('Default')
            .hallo({});
    }

    initLayout.call(this);

    this.setLayout(layout);

    this.serialize = function(){
        return {
            display: layout.text(),
            url: layout.attr('href')
        }
    }

    this.deserialize = function(content){
        layout.text( content.display  );
        layout.attr( 'href', content.url );
    }
}
ButtonWidget.prototype = new Widget();
ButtonWidget.prototype.constructor = ButtonWidget;

