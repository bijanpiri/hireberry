function WorkTypeWidget(){
    Widget.call(this);

    var layout = '';
    var visibilityMode;

    function initLayout() {
        layout = this.clone('.workTypeWidget');

    }

    function changeVisibility() {

        this.portlet.find('.workTimeSpan').removeClass('span6 span5 span0 offset3 offset1 offset0')
        this.portlet.find('.workPlaceSpan').removeClass('span6 span5 span0 offset3 offset1 offset0')

        if( this.visibilityMode == 1 ){
            this.portlet.find('.workPlaceSpan').hide();
            this.portlet.find('.workTimeSpan').show();

            //this.portlet.find('.workPlaceSpan').addClass('span0')
            this.portlet.find('.workTimeSpan').addClass('offset3 span6')
        }
        else if( this.visibilityMode == 2 ){
            this.portlet.find('.workPlaceSpan').show();
            this.portlet.find('.workTimeSpan').hide();

            this.portlet.find('.workPlaceSpan').addClass('offset3 span6')
            //this.portlet.find('.workTimeSpan').addClass('span0')
        }
        else{
            this.portlet.find('.workPlaceSpan').show();
            this.portlet.find('.workTimeSpan').show();

            this.portlet.find('.workPlaceSpan').addClass('offset1 span5')
            this.portlet.find('.workTimeSpan').addClass('span5')
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

        if(editMode)
            this.portlet.find('label').attr('for','');

        this.toolbar.find('input[type=radio]').change( stateChangedHandle(this));
        this.portlet.find('input[value=fulltime]').prop('checked',true);
        this.portlet.find('input[value=office]').prop('checked',true);
    }

    this.getSettingPanel = function () { return $('<div>') }

    this.serialize = function() {
        return {
            mode: this.visibilityMode,
            work: this.portlet.find('input').serialize()
        }
    }

    this.deserialize = function( data ) {
        this.visibilityMode = data.mode;
        this.toolbar.find('input:radio[no=' + this.visibilityMode +']').prop('checked',true); // ToDo: It doesn't Work!
        changeVisibility.call(this);

        this.portlet.find('input').each(
            function(i,input){
                $(input).prop('checked',data.work.indexOf(input.value)>=0).change();
            }
        );
    };
}
WorkTypeWidget.prototype=new Widget();
WorkTypeWidget.prototype.constructor=WorkTypeWidget;
WorkTypeWidget.instances = 1;