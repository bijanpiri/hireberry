/**
 * Created by coybit on 5/17/14.
 */
BStat = Backbone.Model.extend({
    urlRoot: '/api/applications/stat',
    defaults: {
        numForms: 0,
        numApplications: 0,
        numNewApplications: 0,
        numTodayApplications: 0
    },
    initialize: function(){}
});
stat = new BStat;

BCalendar = Backbone.Model.extend({
    urlRoot: '/api/calendar',
    defaults:{
        events: []
    },
    initialize: function(){}
});
calendar = new BCalendar;

BTeams = Backbone.Model.extend({
    urlRoot: '/api/teams',
    defaults: {
    },
    initialize: function(){}
});
teams = new BTeams;

BTeam = Backbone.Model.extend({
    urlRoot: '/api/team',
    defaults: {
    },
    initialize: function(){}
});
team = new BTeam;

BApplications = Backbone.Model.extend({
    url: function(){
        return '/api/applications' + '' +
            '?q=' + $('.application-searchBox').val() +
            '&sort=' + $('.application-sort').attr('sortBy')
    }
})
applications = new BApplications;

BJobs = Backbone.Model.extend({
    urlRoot: '/api/forms'
})
jobs = new BJobs;

BBilling = Backbone.Model.extend({
    urlRoot: '/api/billing'
})
billing = new BBilling;