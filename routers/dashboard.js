/**
 * Created by coybit on 3/16/14.
 */

module.exports.showDashboard = function (req,res) {

    if( !req.user )
        return res.redirect('/');

    var ownerID = req.user.id;

    // ToDo: Retrieval real numbers

    res.render('dashboard.ejs', {
        title: 'Dashboard',
        ownerID: ownerID,
        numForms: 10,
        numApplications: 123,
        numUnvisited: 52,
        numTodayApplications: 6
    });
}

// Return all the created forms (template)
module.exports.forms = function(req,res){
    var ownerID = req.query.ownerID;

    BFlyers.find( {owner: ownerID}, function(err,flyers) {
        if( err )
            return res.send(502);

        // Reduce
        // ToDo: Make reducing async
        var forms = flyers.map( function(flyer) {
            var description = (flyer.flyer && flyer.flyer.description.length > 0)  ? flyer.flyer.description : 'Untitlte';

            return {
                formName:description,
                formID:flyer._id
            }
        } );

        res.send( {forms: forms} );
    } )
}

// Return all the submitted form as a data-source
module.exports.applications = function (req,res) {

    // Data-Source template (for WaTable.js)
    var submittedForms = {
        cols: {
            userId: { index: 1, type: "number", unique:true, friendly:"Num" },
            applyTime: { index: 2, type: "string", friendly:"Application Date/Time" },
            name: { index: 3, type: "string", friendly:"Name" },
            email: { index: 4, type: "string", friendly:"Email" },
            skills: { index: 5, type: "string", friendly:"Skills"},
            profiles: { index: 6, type: "string", friendly:"Profiles"},
            workTime: { index: 7, type: "string", friendly:"Work Time" },
            workPlace: { index: 8, type: "string", friendly:"Work Place" },
            resumePath: { index: 9, type: "string", friendly:"Resume" },
            anythingelse: { index: 10, type: "string", friendly:"Cover Letter" }
        },
        rows: []
    };

    // ToDo: Check whether current user is owner of this forms or not.

    var flyerID = req.query.formID;

    MApplyForm.find( {flyerID: flyerID}, function(err,forms) {
        if( err )
            return res.send(303,{error:err});

        for( var i=0; i<forms.length; i++ ) {
            var form = forms[i]._doc;

            // userId
            form.userId = i+1;
            form.checked = false;

            // Skills
            var skills = form.skills.length==0 ? [] : JSON.parse( form.skills );
            var selectedSkill = '';
            for (var j=0; j<skills.length; j++)
                    selectedSkill += '<span class="spanBox">' + skills[j] + '</span>';
            form.skills = selectedSkill;

            // Profiles
            form.profiles = form.profiles || '{}';
            var profiles = JSON.parse( form.profiles );
            var selectedProfiles = '';
            for (var profile in profiles)
                if ( profiles.hasOwnProperty(profile) && profiles[profile]!=='' )
                    selectedProfiles +=
                        '<span class="spanBox">' +
                        makeLinkTag(profile,profiles[profile],false) +
                        '</span>';
            form.profiles = selectedProfiles;

            // Workplace
            //form.workPlace = (form.workPlace=='fulltime') ?

            // Email
            form.email = makeLinkTag( form.email, form.email, true );

            // Apply Date
            var date = new Date( form.applyTime );
            form.applyTime = date.toLocaleDateString();

            // Resume
            form.resumePath = (form.resumePath==='-') ? '' : makeLinkTag( 'link', form.resumePath, false);

            submittedForms.rows.push( form );
        }

        res.send(submittedForms);
    })
}

function makeLinkTag(display, url, mailto) {
    return '<a href="'+ (mailto?'mailto:':'') + url + '">' + display + '</a>';
}