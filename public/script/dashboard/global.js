/**
 * Created by Bijan on 05/10/2014.
 */
var teamID = '<%=teamID%>';
var userID = '<%=userID%>';
var teamMembers = [];
var userAdmin = null;
var forms = [];
var badgeNum=0;

function refresh(once) {
    badgeNum=0;
    // First fill Forms list, then fill table according to current selected form
    fillPositionsList( function() {
        getTeamInfo( function() {
            $('.colAssignedTo select option').remove();

            for( var i=0; i<teamMembers.length; i++ ){
                var option = $('<option>')
                    .attr('userID',teamMembers[i]._id)
                    .text(teamMembers[i].displayName);
                $('.colAssignedTo select').append( option.clone() );
            }

            $('.bool-ask-4-comment-users').populateUserCombo(teamMembers,0,'userID');

        });
    });

    fillApplications();
    getStat();
    fillAskedForComments();
    fillCalendar();
    initTeamSwtichBox();
    fillTeamSetting();

    if(once==false)
        ;// setTimeout( refresh, 30000 );
}
