/**
 * Created by coybit on 6/18/14.
 */

$.fn.commentBox = function(flyerid){

    //var default_options = {};
    // var options = default_options.extend(user_options);

    var commentboxObj = $(this);

    $(this).css('background','red');
    //$(this).empty();

    // Clear button
    $(this).find('.bool-comment-form .bool-comment-button[op="clear"]').click( function() {
        commentboxObj.find('.bool-comment-form textarea').val('');
    });

    // Send button
    $(this).find('.bool-comment-form .bool-comment-button[op="send"]').click( function() {

        $.post('/api/job/'+flyerid+'/comment',{
            text: commentboxObj.find('.bool-comment-form textarea').val()
        }).done( function(comment) {
                addCommentToView(
                    commentboxObj,
                    comment.user.email,
                    comment.user.displayName,
                    comment.date,
                    commentboxObj.find('.bool-comment-form textarea').val());
            });


    });

    // Get comments from server and show them
    $.get('/api/job/'+flyerid+'/comments').done( function(res) {
        res.comments.forEach( function(comment){
            addCommentToView(
                commentboxObj,
                comment.user.email,
                comment.user.displayName,
                comment.date,
                comment.text);
        })

    });

}

function addCommentToView( commentboxObj, commenterEmail, commenterName, commentDate, commentText ) {
    var hash = CryptoJS.MD5( commenterEmail.trim().toLowerCase() );
    var avatarURL = 'http://www.gravatar.com/avatar/' + hash;

    var avatarObj = $('<img>').attr('src',avatarURL);
    var nameObj = $('<span>').text(commenterName);
    var dateObj = $('<i>').addClass('fa fa-clock-o pull-right');
    var commentObj_header = $('<div>').addClass('bool-comment-header').append(avatarObj).append(nameObj).append(dateObj);
    var commentObj_body = $('<div>').addClass('bool-comment-body').text(commentText);
    var commentObj = $('<li>').append(commentObj_header).append(commentObj_body);

    commentboxObj.find('.bool-comments').prepend(commentObj);
}

