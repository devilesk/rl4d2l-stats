/*!
 * chartjs-plugin-colorschemes v0.4.0
 * https://nagix.github.io/chartjs-plugin-colorschemes
 * (c) 2019 Akihiko Kusanagi
 * Released under the MIT license
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('chart.js'))
        : typeof define === 'function' && define.amd ? define(['chart.js'], factory)
            : (global = global || self, global.ChartColorSchemes = factory(global.Chart));
}(this, (Chart) => {
    Chart = Chart && Chart.hasOwnProperty('default') ? Chart.default : Chart;

    // eslint-disable-next-line one-var
    const Paired12 = ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'];

    const brewer = /* #__PURE__ */Object.freeze({ Paired12 });

    // eslint-disable-next-line one-var
    const colorschemes = { brewer };

    const helpers = Chart.helpers;

    // Element models are always reset when hovering in Chart.js 2.7.2 or earlier
    const hoverReset = Chart.DatasetController.prototype.removeHoverStyle.length === 2;

    const EXPANDO_KEY = '$colorschemes';

    Chart.defaults.global.plugins.colorschemes = {
        scheme: 'brewer.Paired12',
        fillAlpha: 0.5,
        reverse: false,
        override: false,
    };

    function getScheme(scheme) {
        let colorschemes; let matches; let arr; let
            category;

        if (helpers.isArray(scheme)) {
            return scheme;
        }
        if (typeof scheme === 'string') {
            colorschemes = Chart.colorschemes || {};

            // For backward compatibility
            matches = scheme.match(/^(brewer\.\w+)([1-3])-(\d+)$/);
            if (matches) {
                scheme = matches[1] + ['One', 'Two', 'Three'][matches[2] - 1] + matches[3];
            }
            else if (scheme === 'office.Office2007-2010-6') {
                scheme = 'office.OfficeClassic6';
            }

            arr = scheme.split('.');
            category = colorschemes[arr[0]];
            if (category) {
                return category[arr[1]];
            }
        }
    }

    const ColorSchemesPlugin = {
        id: 'colorschemes',

        beforeUpdate(chart, options) {
            let scheme = getScheme(options.scheme);
            const fillAlpha = options.fillAlpha;
            const reverse = options.reverse;
            const override = options.override;
            const custom = options.custom;
            let schemeClone; let customResult; let length; let colorIndex; let
                color;

            if (scheme) {
                if (typeof custom === 'function') {
                    // clone the original scheme
                    schemeClone = scheme.slice();

                    // Execute own custom color function
                    customResult = custom(schemeClone);

                    // check if we really received a filled array; otherwise we keep and use the original scheme
                    if (helpers.isArray(customResult) && customResult.length) {
                        scheme = customResult;
                    }
                    else if (helpers.isArray(schemeClone) && schemeClone.length) {
                        scheme = schemeClone;
                    }
                }

                length = scheme.length;

                // Set scheme colors
                chart.config.data.datasets.forEach((dataset, datasetIndex) => {
                    colorIndex = datasetIndex % length;
                    color = scheme[reverse ? length - colorIndex - 1 : colorIndex];

                    // Object to store which color option is set
                    dataset[EXPANDO_KEY] = {};

                    switch (dataset.type || chart.config.type) {
                    // For line, radar and scatter chart, borderColor and backgroundColor (50% transparent) are set
                    case 'line':
                    case 'radar':
                    case 'scatter':
                        if (typeof dataset.backgroundColor === 'undefined' || override) {
                            dataset[EXPANDO_KEY].backgroundColor = dataset.backgroundColor;
                            dataset.backgroundColor = helpers.color(color).alpha(fillAlpha).rgbString();
                        }
                        if (typeof dataset.borderColor === 'undefined' || override) {
                            dataset[EXPANDO_KEY].borderColor = dataset.borderColor;
                            dataset.borderColor = color;
                        }
                        if (typeof dataset.pointBackgroundColor === 'undefined' || override) {
                            dataset[EXPANDO_KEY].pointBackgroundColor = dataset.pointBackgroundColor;
                            dataset.pointBackgroundColor = helpers.color(color).alpha(fillAlpha).rgbString();
                        }
                        if (typeof dataset.pointBorderColor === 'undefined' || override) {
                            dataset[EXPANDO_KEY].pointBorderColor = dataset.pointBorderColor;
                            dataset.pointBorderColor = color;
                        }
                        break;
                        // For doughnut and pie chart, backgroundColor is set to an array of colors
                    case 'doughnut':
                    case 'pie':
                    case 'polarArea':
                        if (typeof dataset.backgroundColor === 'undefined' || override) {
                            dataset[EXPANDO_KEY].backgroundColor = dataset.backgroundColor;
                            dataset.backgroundColor = dataset.data.map((data, dataIndex) => {
                                colorIndex = dataIndex % length;
                                return scheme[reverse ? length - colorIndex - 1 : colorIndex];
                            });
                        }
                        break;
                        // For the other chart, only backgroundColor is set
                    default:
                        if (typeof dataset.backgroundColor === 'undefined' || override) {
                            dataset[EXPANDO_KEY].backgroundColor = dataset.backgroundColor;
                            dataset.backgroundColor = color;
                        }
                        break;
                    }
                });
            }
        },

        /* afterUpdate: function(chart) {
		// Unset colors
		chart.config.data.datasets.forEach(function(dataset) {
			if (dataset[EXPANDO_KEY]) {
				if (dataset[EXPANDO_KEY].hasOwnProperty('backgroundColor')) {
					dataset.backgroundColor = dataset[EXPANDO_KEY].backgroundColor;
				}
				if (dataset[EXPANDO_KEY].hasOwnProperty('borderColor')) {
					dataset.borderColor = dataset[EXPANDO_KEY].borderColor;
				}
				if (dataset[EXPANDO_KEY].hasOwnProperty('pointBackgroundColor')) {
					dataset.pointBackgroundColor = dataset[EXPANDO_KEY].pointBackgroundColor;
				}
				if (dataset[EXPANDO_KEY].hasOwnProperty('pointBorderColor')) {
					dataset.pointBorderColor = dataset[EXPANDO_KEY].pointBorderColor;
				}
				delete dataset[EXPANDO_KEY];
			}
		});
	}, */

        beforeEvent(chart, event, options) {
            if (hoverReset) {
                this.beforeUpdate(chart, options);
            }
        },

        afterEvent(chart) {
            if (hoverReset) {
                this.afterUpdate(chart);
            }
        },
    };

    Chart.plugins.register(ColorSchemesPlugin);

    Chart.colorschemes = colorschemes;

    return ColorSchemesPlugin;
}));
