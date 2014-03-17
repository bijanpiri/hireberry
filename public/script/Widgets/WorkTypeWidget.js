function WorkTypeWidget(){
    Widget.call(this);

    var layout = '';

    function initLayout() {
        layout = $('.widgets .workTypeWidget').clone();
    }

    initLayout.call(this);
    this.setLayout(layout);

    this.widgetDidAdd = function() {
        this.setToolbar('.toolbar-workTypeWidget');

        function stateChangedHandle( portlet ) {

            return function() {
                var visibility = [true,true];
                var mode = parseInt( $(this).attr('no') );

                if( mode == 1 ){
                    portlet.find('.workPlaceSpan').hide();
                    portlet.find('.workTimeSpan').show();
                }
                else if( mode == 2 ){
                    portlet.find('.workPlaceSpan').show();
                    portlet.find('.workTimeSpan').hide();
                }
                else{
                    portlet.find('.workPlaceSpan').show();
                    portlet.find('.workTimeSpan').show();
                }
            }
        }

        this.toolbar.find('input[type=radio]').change( stateChangedHandle(this.portlet) );
    }

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {}

    this.deserialize = function( content ) {};
}
WorkTypeWidget.prototype=new Widget();
WorkTypeWidget.prototype.constructor=WorkTypeWidget;
WorkTypeWidget.instances = 1;