function WorkTypeWidget(){
    Widget.call(this);

    var layout = '';
    var visibilityMode;

    function initLayout() {
        layout = $('.widgets .workTypeWidget').clone();
    }

    function changeVisibility() {
        if( this.visibilityMode == 1 ){
            this.portlet.find('.workPlaceSpan').hide();
            this.portlet.find('.workTimeSpan').show();
        }
        else if( this.visibilityMode == 2 ){
            this.portlet.find('.workPlaceSpan').show();
            this.portlet.find('.workTimeSpan').hide();
        }
        else{
            this.portlet.find('.workPlaceSpan').show();
            this.portlet.find('.workTimeSpan').show();
        }
    }

    initLayout.call(this);
    this.setLayout(layout);

    this.widgetDidAdd = function() {
        this.setToolbar('.toolbar-workTypeWidget');

        function stateChangedHandle( widget ) {
            return function() {
                widget.visibilityMode = parseInt( $(this).attr('no') );
                changeVisibility.call(widget);
            }
        }

        this.toolbar.find('input[type=radio]').change( stateChangedHandle(this) );
    }

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {
        return {
            mode: this.visibilityMode
        }
    }

    this.deserialize = function( content ) {
        this.visibilityMode = content.mode;
        this.toolbar.find('input:radio[no=' + this.visibilityMode +']').prop('checked',true); // ToDo: It doesn't Work!
        changeVisibility.call(this);
    };
}
WorkTypeWidget.prototype=new Widget();
WorkTypeWidget.prototype.constructor=WorkTypeWidget;
WorkTypeWidget.instances = 1;