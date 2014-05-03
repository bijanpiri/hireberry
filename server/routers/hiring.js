/**
 * Created by Bijan on 04/29/2014.
 */

//region Hiring Form
app.get('/job/dropboxAuth', routerForm.dropboxAuthentication );
app.get('/liprofile/:q', routerForm.findLinkedInProfile )
app.get('/gravatar/:email', routerForm.findGravatarProfile )
app.get('/twprofile/:q', routerForm.findTwitterProfile )
app.post('/apply', routerForm.apply );
app.get('/api/resume', routerForm.getResume );
app.get('/dashboard', routerDashboard.showDashboard );
app.get('/api/forms', routerDashboard.forms );
app.get('/api/applications', routerDashboard.applications );
app.post('/api/applications/:applicationID', routerDashboard.updateApplication );
app.get('/api/applications/stat', routerDashboard.statisticalInfo )
app.get('/api/application/json/:appID', function(req,res) {
    BApplications.find( {_id:req.params.appID} , function(err,application) {
        if( err )
            return res.send(306)
        res.send(application);
    })
})
//endregion
