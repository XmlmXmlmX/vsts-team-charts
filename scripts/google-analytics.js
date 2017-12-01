window.teamCharts = window.teamCharts || {};

teamCharts.googleAnalytics = {
  init: function (clientId) {

    // == NOTE ==
    // This code uses ES6 promises. If you want to use this code in a browser
    // that doesn't supporting promises natively, you'll have to include a polyfill.

    gapi.analytics.ready(function () {
      /**
       * Authorize the user immediately if the user has already granted access.
       * If no access has been created, render an authorize button inside the
       * element with the ID "embed-api-auth-container".
       */
      gapi.analytics.auth.authorize({
        container: 'embed-api-auth-container',
        clientid: clientId
      });

      /**
       * Create a new ActiveUsers instance to be rendered inside of an
       * element with the id "active-users-container" and poll for changes every
       * five seconds.
       */
      var activeUsers = new gapi.analytics.ext.ActiveUsers({
        container: 'active-users-container',
        pollingInterval: 5
      });

      /**
       * Add CSS animation to visually show the when users come and go.
       */
      activeUsers.once('success', function () {
        var element = this.container.firstChild;
        var timeout;

        this.on('change', function (data) {
          var element = this.container.firstChild;
          var animationClass = data.delta > 0 ? 'is-increasing' : 'is-decreasing';
          element.className += (' ' + animationClass);

          clearTimeout(timeout);
          timeout = setTimeout(function () {
            element.className =
              element.className.replace(/ is-(increasing|decreasing)/g, '');
          }, 3000);
        });
      });

      /**
       * Create a new ViewSelector2 instance to be rendered inside of an
       * element with the id "view-selector-container".
       */
      var viewSelector = new gapi.analytics.ext.ViewSelector2({
        container: 'view-selector-container',
      })
        .execute();

      /**
       * Update the activeUsers component, the Chartjs charts, and the dashboard
       * title whenever the user changes the view.
       */
      viewSelector.on('viewChange', function (data) {
        var title = document.getElementById('view-name');
        title.textContent = data.property.name + ' (' + data.view.name + ')';

        // Start tracking active users for this view.
        activeUsers.set(data).execute();

        // Render all the of charts for this view.
        renderWeekOverWeekChart(data.ids);
        renderYearOverYearChart(data.ids);
        renderTopBrowsersChart(data.ids);
        renderTopCountriesChart(data.ids);
      });

      function getWeekOverWeekData(ids, callback) {
        var now = moment();

        var thisWeek = query({
          'ids': ids,
          'dimensions': 'ga:date,ga:nthDay',
          'metrics': 'ga:sessions',
          'start-date': moment(now).subtract(1, 'day').day(0).format('YYYY-MM-DD'),
          'end-date': moment(now).format('YYYY-MM-DD')
        });

        var lastWeek = query({
          'ids': ids,
          'dimensions': 'ga:date,ga:nthDay',
          'metrics': 'ga:sessions',
          'start-date': moment(now).subtract(1, 'day').day(0).subtract(1, 'week')
            .format('YYYY-MM-DD'),
          'end-date': moment(now).subtract(1, 'day').day(6).subtract(1, 'week')
            .format('YYYY-MM-DD')
        });

        Promise.all([thisWeek, lastWeek]).then(function (results) {

          var data1 = results[0].rows.map(function (row) { return +row[2]; });
          var data2 = results[1].rows.map(function (row) { return +row[2]; });

          callback([data1, data2]);
        });
      }

      function getYearOverYearData(ids, callback) {
        var now = moment();

        var thisYear = query({
          'ids': ids,
          'dimensions': 'ga:month,ga:nthMonth',
          'metrics': 'ga:users',
          'start-date': moment(now).date(1).month(0).format('YYYY-MM-DD'),
          'end-date': moment(now).format('YYYY-MM-DD')
        });

        var lastYear = query({
          'ids': ids,
          'dimensions': 'ga:month,ga:nthMonth',
          'metrics': 'ga:users',
          'start-date': moment(now).subtract(1, 'year').date(1).month(0)
            .format('YYYY-MM-DD'),
          'end-date': moment(now).date(1).month(0).subtract(1, 'day')
            .format('YYYY-MM-DD')
        });

        Promise.all([thisYear, lastYear]).then(function (results) {
          var data1 = results[0].rows.map(function (row) { return +row[2]; });
          var data2 = results[1].rows.map(function (row) { return +row[2]; });
          var labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

          for (var i = 0, len = labels.length; i < len; i++) {
            if (data1[i] === undefined) data1[i] = null;
            if (data2[i] === undefined) data2[i] = null;
          }

          callback([data1, data2]);
        })
          .catch(function (err) {
            console.error(err.stack);
            callback(null);
          });
      }

      function getTopBrowsersData(ids, callback) {
        query({
          'ids': ids,
          'dimensions': 'ga:browser',
          'metrics': 'ga:pageviews',
          'sort': '-ga:pageviews',
          'max-results': 5
        })
          .then(function (response) {
            callback(response);
          });
      }

      function getTopCountriesData(ids, callback) {
        query({
          'ids': ids,
          'dimensions': 'ga:country',
          'metrics': 'ga:sessions',
          'sort': '-ga:sessions',
          'max-results': 5
        })
          .then(function (response) {
            callback(response);
          });
      }

      /**
       * Extend the Embed APIs `gapi.analytics.report.Data` component to
       * return a promise the is fulfilled with the value returned by the API.
       * @param {Object} params The request parameters.
       * @return {Promise} A promise.
       */
      function query(params) {
        return new Promise(function (resolve, reject) {
          var data = new gapi.analytics.report.Data({ query: params });
          data.once('success', function (response) { resolve(response); })
            .once('error', function (response) { reject(response); })
            .execute();
        });
      }
    });
  }
};