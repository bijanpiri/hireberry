/**
 * Created by coybit on 5/15/14.
 */

models = require('./etc/models');

console.log('#### INVOICE GENERATOR STARTED ####');
monthlyInvoiceGenerating();

function monthlyInvoiceGenerating() {
    BTeams.find({}, function(err,teams) {

        for( var i=0; i<teams.length; i++ ) {
            var log = '## [' + teams[i].name + ']: ';

            var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
            var today = new Date();
            var lastRenew = new Date( teams[i].planLastRenewDate );
            var diffDays = Math.round(Math.abs((today.getTime() - lastRenew.getTime())/(oneDay)));

           log +=  diffDays + ' days ...';
            if( diffDays >= 31 ) {
                log += 'generating.';
                generateInvoice(teams[i], function(){});
            }
            else {
                log += 'ignored.';
            }

            console.log( log );
        }

        console.log('#### INVOICE GENERATOR FINISHED ####');
        process.exit(0)
    });
}

function generateInvoice(teamID, callback) {

    BTeams.findOne({_id:teamID}, function(err,team) {

        var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
        var today = new Date();
        var lastRenew = new Date( team.planLastRenewDate );
        var diffDays = Math.round(Math.abs((today.getTime() - lastRenew.getTime())/(oneDay)));
        var plan = team.plan;

        var amount = -1 * parseInt(100*( plansCost[plan]*(diffDays/31)))/100

        BTransactions( {
            teamID: teamID,
            state: 'invoice',
            amount: amount,
            paymentTime: new Date()
        }).save( function(err) {
                BTeams.update({_id:teamID},{planLastRenewDate:new Date()}, function(err) {
                    callback({error:err});
                });
            });

    });
}
