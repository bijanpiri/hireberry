/**
 * Created by Bijan on 05/04/2014.
 */
$.fn.populateUserCombo = function(members,selectedMember, inputName){

    $(this).each(function(){
        if(!selectedMember)
            selectedMember = 0;

        if(!inputName)
            inputName = 'name';

        var contents =
            $('<div class="btn-group bool-option-field ">' +
                '<a class="bool-combo-selected dropdown"> </a>' +
                '<ul class="dropdown-menu bool-team-members">  </ul>' +
                '<input type="hidden"></div>');
        contents.find('input').attr('name',inputName);

        var container = $(this).empty();
        container.append(contents);

        var memList = contents.find('ul').empty();
        $.each(members, function (i, member) {

            var memberObj = $('<li>')
                .append(generateMemberElement(member))
                .click(function () {
                    var member = $(this).children('a').data('member');
                    showSelected(member,contents);
                });

            memList.append(memberObj);
        });

        if(selectedMember._id)
            showSelected(selectedMember,contents);
        else
            showSelected(members[selectedMember],contents);

    });
}

function showSelected(admin,contents){
    if(admin) {
        contents.find('.bool-combo-selected')
            .replaceWith(
                generateMemberElement(admin,true,false)
                    .addClass('bool-combo-selected')
                    .addClass('dropdown')
                    .attr('data-toggle', 'dropdown')
                    .prepend('<span class="caret bool-caret"></span>')
            );
        contents.find('input').val(admin._id);
    }
}

function getAvatar(email) {
    var hash = CryptoJS.MD5( email.trim().toLowerCase() );
    return 'http://www.gravatar.com/avatar/' + hash;
}

function generateMemberElement(member,showDisplayName,showEmail,alightRight){

    alightRight = alightRight || false;
    showDisplayName = (showDisplayName!==undefined) ? showDisplayName :true;
    showEmail = (showEmail!==undefined) ? showEmail :true;
    var imgurl = member.email ? getAvatar(member.email)+'?size=50' : '';

    var avatarObj = $('<img>').attr('src',imgurl).addClass( alightRight ? 'pull-right' : '' );
    var titleObj =  $('<ul>')
        .append($('<li>').append(showDisplayName? member.displayName:""));
//        .append(
//        $('<li>').append(showEmail ? member.email:"")
//    );

    return $('<a>')
        .addClass( showDisplayName && showEmail ? 'bool-user-item':'bool-single-user-item' )
        .append( avatarObj )
        .append( titleObj )
        .data('member',member);
}

