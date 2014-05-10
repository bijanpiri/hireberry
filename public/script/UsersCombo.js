/**
 * Created by Bijan on 05/04/2014.
 */
$.fn.populateUserCombo=function(members,selectedMember, inputName){
    $(this).each(function(){
        if(!selectedMember)
            selectedMember=0;

        if(!inputName)
            inputName='name';

        var container=$(this).empty();
        var contents=
            $('<div class="btn-group bool-combo ">' +
                '<a class="bool-combo-selected dropdown"> </a>' +
                '<ul class="dropdown-menu bool-team-members">  </ul>' +
                '<input type="hidden"></div>');

        contents.find('input').attr('name',inputName);

        container.append(contents);
        var memList = contents.find('ul').empty();
        $.each(members, function (i, member) {
            memList.append(
                $('<li>')
                    .append(generateMemberElement(member))
                    .click(function () {
                        var member = $(this).children('a').data('member');
                        showSelected(member,contents);
                    })
            );
        })
        if(selectedMember._id)
            showSelected(selectedMember,contents);
        else
            showSelected(members[selectedMember],contents);

        function showSelected(admin){
            if(admin) {
                contents.find('.bool-combo-selected')
                    .replaceWith(
                    generateMemberElement(admin)
                        .addClass('bool-combo-selected')
                        .addClass('dropdown')
                        .attr('data-toggle', 'dropdown')
                        .prepend('<span class="caret"></span>')
                );
                contents.find('input').val(admin._id);
            }
        }
    });


}
function generateMemberElement(member,showDisplayName,showEmail){
    showDisplayName= showDisplayName!==undefined ? showDisplayName :true;
    showEmail=showEmail!==undefined ? showEmail :true;
    var imgurl = 'http://www.gravatar.com/avatar/'+
        CryptoJS.MD5(member.email)+'?size=50';

    return $('<a>')
        .addClass( showDisplayName && showEmail ?
            'bool-user-item':'bool-single-user-item')
        .append($('<img>')
            .attr('src',imgurl))
        .append(
        $('<ul>')
            .append($('<li>').append(showDisplayName? member.displayName:""))
            .append($('<li>').append(showEmail ? member.email:"")
        )
    ).data('member',member);
}

