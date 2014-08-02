/**
 * Created by coybit on 5/15/14.
 */
util = require('util');
async = require('async');
models = require('./etc/models');
utilities = require('./etc/utilities');


checkTeamsCredit();

function checkTeamsCredit() {

    BTeams.find({}, function(err,teams) {

        var teamBalanceCheckers = [];

        for( var i=0; i<teams.length; i++ ) {

            var teamID = teams[i]._id;
            var teamPlan = teams[i].plan;

            teamBalanceCheckers.push( teamBalanceCheckerBuilder(teamID,teamPlan) );
            teamBalanceCheckers.push( teamMonthlyInvoiceGeneratorBuilder(teams[i]) );
        }

        console.log('#### INVOICE GENERATOR STARTED ####');
        async.series( teamBalanceCheckers, function() {
            console.log('#### INVOICE GENERATOR FINISHED ####');
            process.exit(0);
        } );
    });

}

function teamBalanceCheckerBuilder(teamID,teamPlan) {

    return function(callback) {

        console.log( '## Instantly-Checks started ... ' + teamID );

        calculateCostUpNow( teamID, function(cost) {

            checkBalance( teamID, 0, function(err, hasEnough, balance) {

                if( (balance+cost)<=0 && teamPlan!==0 ) {

                    changePlan( 0, teamID, function() {
                        // Add a notification and inactive all jobs

                        BFlyers.update({owner:teamID},{publishTime:''}, function(err) {

                            BTeams.update({_id:teamID},{autoDowngraded: true}, function(err) {

                                console.log( '## Instantly-Checks finished (downgraded) ... ' + teamID, teamPlan, cost  );
                                callback(null);

                            });

                        });

                    });

                }
                else {
                    console.log( '## Instantly-Checks finished (normal) ... ' + teamID, teamPlan, cost );
                    callback(null);
                }

            });

        });
    }

};

function teamMonthlyInvoiceGeneratorBuilder(team) {

    return function(callback) {

        console.log('## Monthly-Check started ...' + team.name);

        var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
        var today = new Date();
        var lastRenew = new Date( team.planLastRenewDate );
        var diffDays = Math.round(Math.abs((today.getTime() - lastRenew.getTime())/(oneDay)));

        if( diffDays >= 1 && (new Date()).getDate() == 1 ) {// If today is first day of the month

            generateInvoice(teams, function(){
                console.log('## Monthly-Check started (generated) ...' + team.name,diffDays);
                callback();
            });

        }
        else {
            console.log('## Monthly-Check finished (ignored) ...' + team.name,diffDays);
            callback();
        }

    }
}

function calculateCostUpNow(teamID, callback) {

    BTeams.findOne({_id:teamID}, function(err,team) {

        var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
        var today = new Date();
        var lastRenew = new Date( team.planLastRenewDate );
        var diffDays = Math.round(Math.abs((today.getTime() - lastRenew.getTime())/(oneDay)));
        var plan = team.plan;

        var amount = -1 * parseInt(100*( plansCost[plan]*(diffDays/31)))/100

        callback(amount);

    });
}

function generateInvoice(teamID, callback) {

    calculateCostUpNow( teamID, function(amount) {

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
