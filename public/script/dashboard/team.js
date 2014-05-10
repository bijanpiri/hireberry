/**
 * Created by Bijan on 05/10/2014.
 */
function teamInvitation(){
    $('#teamInvitationForm').submit(function(){
        var form=$(this);
        form.find('.alert-info').show();
        $.post('/api/team/invite',form.serialize())
            .always(function(){
                $('.alert').hide();
                $('#team-invitation-dialog').modal('hide');
                refresh(true);
            })
            .done( function() {
                form.find('.alert-success').show().delay(2000).fadeOut();
                $('#invitationEmail').val('');
                $('#invitationNote').val('');
                getTeamInfo();
            })
            .fail(function(){
                form.find('.alert-danger').show();
            });
        return false;

    })
}

function teamSettings(){
    $('#teamSettingForm').submit(function(event){
        var form=$(this);
        form.find('.alert-info').show();
        $.post('/api/team/settings',
            form.serialize())
            .always(function(data){
                $('.alert').hide();
                $('#team-settings-dialog').modal('hide');
                refresh(true);
            })
            .fail(function(data){
                form.find('.alert-danger').show();
            })
            .done(function(data){
                form.find('.alert-success').show().delay(2000).fadeOut();
            });
        event.preventDefault();
        return false;
    });
}

function fillTeamSetting(){
    $.get('/api/team/settings',
        function (data) {
            $('[name=teamAdmin]').val(data.admin._id);
            $('[name=teamName]').val(data.name);
            $('[name=teamAddress]').val(data.address);
            $('[name=teamTel]').val(data.tel);
            $('.team-admin-combo').populateUserCombo(data.members,data.admin,'teamAdmin');
        }
    );
}

function getTeamInfo(callback) {
    $.get('/api/team/members').done( function(res){
        $('#teamJobsPage').attr('href','/team/' +  res.team._id + '/jobs')
        $('#teamName').text( res.team.name);
        $('#teamAdmin').text( res.team.admin.email);
        $('#currentTeamName').text( res.team.name);


        teamMembers = res.team.members;
        $('#assignTo').empty();
        $('#teamMembers').empty();
        userAdmin = res.team.admin._id==res.user;
        for( var i=0; i<res.team.members.length; i++ ){
            var avatarObj = $('<img>').addClass('teamMemberAvatar').attr( 'src', getAvatar(res.team.members[i].email));
            var emailObj = $('<div>').addClass('teamMemberEmail').text(res.team.members[i].displayName);
            var roleObj = $('<div>').addClass('teamMemberRole').text(
                    res.team.members[i]._id==res.team.admin._id ?
                    'Hiring Manager': 'Member');

            var makeAdminObj = $('<div>').attr('userID',res.team.members[i]._id)
                .addClass('teamMemberMakeAdmin btn')
                .hide()
                .text( 'Make Admin')
                .click( function() {
                    $.post('/api/team/admin', {newAdmin: $(this).attr('userID')}).done( function() {
                        $('.teamMemberMakeAdmin').hide();
                        refresh(true)
                    })
                });

            var memberObj = $('<div>').addClass('teamMember')
                .append( avatarObj )
                .append( emailObj )
                .append( userAdmin ? makeAdminObj : '' )
                .append( roleObj );

            $('#teamMembers').append( memberObj );
        }

        $('a[href=#team-settings-dialog]').toggleClass('hide',!userAdmin);
        $('a[href=#team-invitation-dialog]').toggleClass('hide',!userAdmin);
        $('a[href=#team-]').hide();
        $('.teamAddress').html(res.team.address)
        $('.teamPhone').html(res.team.tel);

        callback();
    });


}

function initTeamSwtichBox() {

    $('#userTeams').empty();

    $.get('/api/user/teams').done( function(teams) {
        teams.forEach( function(team) {
            $('#userTeams').append( $('<option>').text(team.name).attr('name',team._id) );
        });

        $('#switchButton').unbind('click').click( function() {
            $('#switchTeamEdit').show();
            $('#switchTeamView').hide();
        });

        $('#cancelChangeUserTeam').unbind('click').click( function() {
            $('#switchTeamView').show();
            $('#switchTeamEdit').hide();
        });

        $('#changeUserTeam').unbind('click').click( function() {
            var teamID = $('#userTeams :selected').attr('name');

            $.post('/api/user/changeTeam', {teamID:teamID}).done( function() {
                refresh(true);

                $('#switchTeamView').show();
                $('#switchTeamEdit').hide();
            })
        })
    })
}