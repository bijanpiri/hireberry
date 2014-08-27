/**
 * Created by coybit on 5/17/14.
 */

var fetch = Backbone.Model.prototype.fetch;
Backbone.Model.prototype.fetch = function() {
    this.trigger('beforeFetch');
    return fetch.apply(this, arguments);
};

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
stat.on('beforeFetch', function() {
    $('.fetching-overview').show();
});


BCalendar = Backbone.Model.extend({
    urlRoot: '/api/calendar',
    defaults:{
        events: []
    },
    initialize: function(){}
});
calendar = new BCalendar;
calendar.on('beforeFetch', function() {
    $('.fetching-overview').show();
});


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
team.on('beforeFetch', function() {
    $('.fetching-team').show();
});


BApplications = Backbone.Model.extend({
    url: function(){
        var query = $('.application-searchBox').val();
        var job = $('.applications-filter-job :selected').attr('formID');
        var sort = $('.application-sort :selected').attr('name');

        return '/api/applications?' +
            (query ? 'q=' + query : '' ) +
            (job ? '&j=' + job : '' ) +
            (sort ? '&sort=' + sort : '' )
    }
})
applications = new BApplications;
applications.on('beforeFetch', function() {
    $('#candidatesCollection .candidate').remove();
    $('.fetching-applications').show();
});


BJobs = Backbone.Model.extend({
    urlRoot: '/api/forms'
})
jobs = new BJobs;
jobs.on('beforeFetch', function() {
    $('.fetching-jobs').show();
});


BBilling = Backbone.Model.extend({
    urlRoot: '/api/billing'
})
billing = new BBilling;
billing.on('beforeFetch', function() {
    $('.fetching-billing').show();
});