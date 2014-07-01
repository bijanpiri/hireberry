function SkillWidget(){
    Widget.call(this);

    var layout = '';
    var skillsButtons = {
        jquery : ['jquery','jQuery', '#1C283B', '#151E2C', '0 -214px', '-58px -214px', 57, 54, 100],
        html5 : ['html5','HTML5', '#0070BB', '#00548C', '0 -48px', '-51px -48px', 50, 55, 100],
        css3 : ['css3','CSS3', '#E44D26', '#AB3A1C', '0 -103px', '-61px -103px', 61, 55, 100],
        javascript : ['javascript','Javascript', '#F8DC3D', '#BAA52E', '0 -158px', '-77px -158px', 77, 56, 100],
        less : ['less','Less', '#315AA0', '#254378', '0 -269px', '-136px -269px', 136, 60, 150],
        bootstrap : ['bootstrap','Bootstrap', '#5A4080', '#433060', '-47px -329px', '-47px -329px', 47, 55, 100],
        git : ['git','Git', '#F05133', '#B43D26', '0 -384px', '-62px -384px', 62, 61, 100],
        mongodb : ['mongodb','Mongodb', '#5E3E2D', '#462E22', '0 -447px', '-34px -447px', 35, 72, 100],
        nodejs : ['nodejs','Nodejs', '#8FC440', '#6B9330', '0 -518px', '-57px -518px', 57, 60, 100]
    };

    var notFoundButton=['notfound','not found', '#8FC440', '#6B9330', '-170px -150px;', '-170px -150px;', 57, 60, 100];

    var widget=this;
    function buildButton(id, title,
                         activeBackColor,
                         activeShadowColor,
                         activeIconPosition,
                         passiveIconPosition,
                         iconWidth,
                         iconHeight,
                         buttonWidth) {

        // Build structure
        var beautifulButtonObj = $('<div>')
            .addClass('beautifulButton');

        var inputObj = $('<input>').attr('type','checkbox')
            .attr('id',id)
            .attr('title',title)
            .attr('name','skill')
            .val(id);

        if(editMode)
            inputObj.attr('disabled','disabled');

        var labelObj =$('<label>').attr('for',id);
        var iconObj = $('<i>');


        var pObj = $('<p>').text(title);
        var removeBtnObj = $('<span>')
            .addClass('beautifulButtonRemove')
            .text('X')
            .click( function() {
                beautifulButtonObj.remove();
            });

        if(iconWidth==undefined)
            labelObj.append(title);
        else
            labelObj.append(iconObj);

        beautifulButtonObj.append(inputObj)
            .append(labelObj)
            .append(pObj);

        if( this.editMode )
            beautifulButtonObj.append(removeBtnObj);

        // Customize it
        labelObj.width(buttonWidth || 'auto');
        iconObj.css('background-position',passiveIconPosition)
            .width(iconWidth)
            .height(iconHeight);

        inputObj.change( function() {
            changeState( isChecked() );
        });
        labelObj.mouseenter( function() {
            var currentBoxShadow = labelObj.css('box-shadow').replace(/^.*(rgba?\([^)]+\)).*$/,'$1');

            labelObj.css('-webkit-box-shadow','0 3px ' + currentBoxShadow);
            labelObj.css('box-shadow','0 3px ' + currentBoxShadow);
        });
        labelObj.mouseleave( function() {
            var currentBoxShadow = labelObj.css('box-shadow').replace(/^.*(rgba?\([^)]+\)).*$/,'$1');

            labelObj.css('-webkit-box-shadow','0 4px ' + currentBoxShadow);
            labelObj.css('box-shadow','0 4px ' + currentBoxShadow);
        });

        function isChecked() { return beautifulButtonObj.find('input').is(':checked') }

        function changeState(turnOn) {
            if( turnOn ) {
                labelObj.css('background-color', activeBackColor);
                labelObj.css('-webkit-box-shadow','0 3px ' + activeShadowColor);
                labelObj.css('box-shadow','0 3px ' + activeShadowColor);

                iconObj.css('background-position', activeIconPosition)
            } else {
                labelObj.css('background-color', '');
                labelObj.css('-webkit-box-shadow','');
                labelObj.css('box-shadow','');

                iconObj.css('background-position',passiveIconPosition)
            }
        }

        return beautifulButtonObj;
    }


    function addSkillButton(id,title) {

        if( id.length>0 &&
            this.portlet
                .find('.skillsButtons input[name=skill][id="' + id + '"]').length == 0 ) {
                // Check for repetition
            var skillButton = $.extend([id,title], skillsButtons[ id ]);
            var btn =  buildButton.apply(this,skillButton);
            this.portlet.find('.skillsButtons').append( btn );
        }
    }

    function initLayout() {
        layout = this.clone('.skillWidget');
        widget.toolbar.hide();
    }

    initLayout.call(this);
    this.setLayout(layout);

    this.widgetDidAdd = function() {

        var availableTags = [];

        for( var skill in skillsButtons )
            availableTags.push(skill);

        this.setToolbar('.toolbar-skillsWidget');

        var widget = this;

        function AddNewSkill() {
            var e = $('.skillAddButton>input[name="newSkillTextbox"]');
            var title= e.val();
            var skill = e.val().trim().replace(' ', '_').toLowerCase();
            e.val('');
            addSkillButton.call(widget, skill,title);
        }

        this.portlet.find('input[name=newSkillTextbox]').keyup( function(e) {
            if( e.keyCode == 13 ) {
                AddNewSkill();
            }
        }).autocomplete({
                source: availableTags
            });

        this.portlet.find('.skillAddButton>label').click(AddNewSkill);
        if( this.editMode)
        {
            $('.skillsButtons').sortable({
                    items:'.beautifulButton'
//                        ,
//                    handle:'.beautifulButton>label'
            });
        }
        else{
            this.portlet.find('.skillAddButton').hide();
            this.portlet.find('.beautifulButtonRemove').hide();
        }
    };

    this.serialize = function() {
        var data = [];
        var skillButtons = this.portlet.find('.skillsButtons .beautifulButton input[name=skill]');

        for( var i=0; i<skillButtons.length; i++ ) {
            var button=$(skillButtons[i]);
            data.push({id:button.attr('id'),
                    text:button.attr('title')});
        }


        return data;
    };

    this.deserialize = function( data ) {

        for( var i=0; i<data.length; i++ )
            addSkillButton.call(this,data[i].id,data[i].text);
    };
}
SkillWidget.prototype=new Widget();
SkillWidget.prototype.constructor=SkillWidget;
SkillWidget.instances = 1;