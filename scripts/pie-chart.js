window.teamCharts = window.teamCharts || {};

teamCharts.pieChart = {
  init: function (container, options) {

    VSS.init({
      explicitNotifyLoaded: true,
      usePlatformStyles: true
    });

    VSS.require([
      "TFS/Dashboards/WidgetHelpers",
      "Charts/Services"
    ],
      function (WidgetHelpers, Services) {
        WidgetHelpers.IncludeWidgetStyles();
        VSS.register("PieChart", function () {
          return {
            load: function () {
              return Services.ChartsService.getService().then(function (chartService) {
                var $container = $(container);
                var chartOptions = options;

                chartService.createChart($container, chartOptions);

                return WidgetHelpers.WidgetStatusHelper.Success();
              });
            }
          }
        });

        VSS.notifyLoadSucceeded();
      });
  }
};