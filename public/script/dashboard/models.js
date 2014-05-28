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
        var query = $('.application-searchBox').val();
        var job = $('.applications-filter-job :selected').attr('formID');
        var sort = $('.application-sort').attr('sortBy');

        return '/api/applications?' +
            (query ? 'q=' + query : '' ) +
            (job ? '&j=' + job : '' ) +
            (sort ? '&sort=' + sort : '' )
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