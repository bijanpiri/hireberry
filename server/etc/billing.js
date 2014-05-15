/**
 * Created by coybit on 5/14/14.
 */

"use strict";
var paypal_api = require('paypal-rest-sdk');

var config_opts = {
    'host': 'api.sandbox.paypal.com',
    'port': '',
    'client_id': 'AQ1m3BD1QilgWxOstMw3GuSSsit3W8uoN36NMQxlzDs_iF1m70-XI5cyeQWn',
    'client_secret': 'EKPO6BB35T7v-u1pS_OGTJZepROWqc1m_gYBhps8dIrrY9979iKFjw8tM0_o'
};

paypal_api.configure(config_opts);

var plansCost = [0,1.00];


function pay( teamID, amount, callback ) {

    BTransactions( {teamID: teamID, state: 'init' }).save( function(err,transaction) {

        var create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": "http://localhost:5000/paypal?success=true&tid=" + transaction._id,
                "cancel_url": "http://localhost:5000/paypal?success=false&tid=" + transaction._id
            },
            "transactions": [{
                "amount": {
                    "currency": "USD",
                    "total": amount
                },
                "description": "Increasing credit for {Team} in Booltin"
            }]
        };

        paypal_api.payment.create(create_payment_json, config_opts, function (err, res) {
            if (err)
                callback(err);

            if (res) {
                BTransactions.update({_id:transaction._id},{state:'created',amount:amount,PAYToken:res.id}, function(err){
                    for( var i=0; i<res.links.length; i++ )
                        if( res.links[i].rel==='approval_url' )
                            callback(null,res.links[i].href);
                })

            }
        });
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

function changePlan( newPlan, teamID, callback ) {

    generateInvoice(teamID, function() {

        checkBalance( teamID, plansCost[newPlan] ,function(err, isOK) {
            if(!err.error && isOK ) {
                BTeams.update({_id:teamID},{plan:newPlan}, function(err) {
                    callback({error:err});
                });
            } else {

            }
        })
    });
}

function checkBalance(teamID, minBalance, callback) {
    BTransactions.find( {teamID: teamID, $or:[{state:'sold'},{state:'invoice'}]}, function(err,transactions) {
        var balance = 0;

        for( var i=0; i<transactions.length; i++ )
            balance += parseFloat(transactions[i].amount);

        callback({error:null}, (balance >= minBalance) );
    });
}

app.get('/pay', function(req,res) {
    pay( req.user.teamID, req.query.amount, function(err, approval_url) {
        if( !err )
            res.redirect(approval_url);
    } );
})

app.get('/api/billing', function(req,res) {
    BTransactions.find( {teamID: req.user.teamID, $or:[{state:'sold'},{state:'invoice'}]}, function(err,transactions) {
        var balance = 0;
        var billings = [];

        for( var i=0; i<transactions.length; i++ ) {
            balance += parseFloat(transactions[i].amount);

            if( Math.abs(transactions[i].amount) > 0 )
                billings.push( { state:transactions[i].state, time: transactions[i].paymentTime, amount:transactions[i].amount} );
        }

        BTeams.findOne({_id:req.user.teamID}, function(err,team){
            res.send(200,{
                plan: team.plan,
                lastRenew: team.planLastRenewDate,
                balance: balance,
                billings: billings
            });
        })

    });
});

app.get('/paypal', function(req,res) {
    var transactionID = req.query.tid;
    var ECToken = req.query.token;
    var success = req.query.success;
    var prayerID = req.query.PayerID;

    BTransactions.findOne({_id:transactionID}, function(err,transaction) {

        if( success==='true' ) {
            BTransactions.update({_id:transactionID},{state:'approved',ECToken:ECToken}, function(err){

                // Execute payment
                var execute_payment_details = { "payer_id": prayerID };
                paypal_api.payment.execute( transaction.PAYToken, execute_payment_details, function(error, payment){
                    if(error){
                        console.error(error);
                        res.redirect('/dashboard#billing');
                    } else {

                        BTransactions.update({_id:transactionID},{
                            state: 'sold',
                            payer: payment.payer,
                            paymentTime: payment.update_time
                        }, function(err){
                            console.log(payment);
                            res.redirect('/dashboard#billing');
                        });
                    }
                });
            })
        }
        else {
            BTransactions.update({_id:transaction._id},{state:'canceled',ECToken:ECToken}, function(err){
                res.redirect('/dashboard#billing');
            })
        }
    });
})

app.get('/api/plan/change', function(req,res) {
    changePlan( req.query.new_plan, req.user.teamID, function() {
        res.send(200);
    })
})