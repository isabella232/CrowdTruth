
function unitsBarChartGraph(category, workerUpdateFunction, jobsUpdateFunction, annotationsUpdateFunction) {
    var unitsJobChart = "";
    var unitsWordCountChart = "";
    var selectedUnits = [];
    var projectCriteria = "";
    var matchCriteria = "";
    var specificInfo = {};
    var specificFields = { '#twrex-structured-sentence_tab':{ data : "words", info:['relation','sentence'],
        query : '&project[words]=content.properties.sentenceWordCount' +
        '&project[sentence]=content.sentence.formatted&project[relation]=content.relation.noPrefix' +
        '&project[id]=_id&push[id]=id&push[words]=words&push[sentence]=sentence&push[relation]=relation'},
                           '#fullvideo_tab':{ data : "keyframes", info:['title','description'],
        query : '&project[keyframes]=keyframes.count' +
       '&project[title]=content.metadata.title&project[description]=content.metadata.description' +
       '&project[id]=_id&push[id]=id&push[title]=title&push[description]=description&push[keyframes]=keyframes'}
    }

    var colors = ['#528B8B', '#00688B', '#2F4F4F', '#66CCCC' ,'#00CDCD', '#607B8B' ];

    var chartSeriesOptions = {
        'workers': {
            'spamWorkers': {'color': '#A80000', 'field': 'cache.workers.spamCount', 'name':'# of low quality workers', 'type': 'column'},
            'avgWorkers': {'color': '#A63800', 'field': '', 'name':'avg # of workers', 'type': 'spline', 'dashStyle':'shortdot'},
            'workers': {'color': '#BF6030', 'field': 'cache.workers.nonSpamCount', 'name':'# of workers', 'type': 'column'}},
        'annotations': {
            'spamAnnotations': {'color': '#60D4AE', 'field': 'cache.annotations.spamCount', 'name':'# of low quality annotations', 'type': 'column'},
            'annotations': {'color': '#207F60', 'field': 'cache.annotations.nonSpamCount', 'name':'# of annotations', 'type': 'column'},
            'avgAnnotations': {'color': '#00AA72', 'field': '', 'name':'avg # of annotations', 'type': 'spline', 'dashStyle':'shortdot'}},
        'batch': { 'batch': {'color': '#FF9E00', 'field': 'cache.batches.count', 'name':'# of batches', 'type': 'spline', 'dashStyle':'LongDash'}}
    }

    var chartGeneralOptions = {
        chart: {
            zoomType: 'x',
            alignTicks: false,
            spacingBottom: 70,
            renderTo: 'generalBarChart_div',
            marginBottom: 80,
			width: (($('.maincolumn').width() - 50)),
            height: 400,
            marginTop: 100
        },
        title: {
            text: 'Overview of units used in jobs'
        },
        legend:{
            y: 40
        },
        subtitle: {
            text: 'Select unis for more information'
        },
        xAxis: {

            events:{
                setExtremes :function (event) {
                    var graph = '';
                    if(this.chart.renderTo.id == 'generalBarChart_div' ) {
                        graph = unitsJobChart;
                    } else {
                        graph = unitsWordCountChart;
                    }
                    var min = 0;
                    if (event.min != undefined){
                        min = event.min;
                    }
                    var max = graph.series[0].data.length
                    if (event.max != undefined){
                        max = event.max;
                    }
                   // chart.yAxis[0].options.tickInterval
                    graph.xAxis[0].options.tickInterval = Math.ceil( (max-min)/20);
                }
            },
            labels: {
                formatter: function() {
                    var arrayUnit = this.value.split("/");
                    return arrayUnit[arrayUnit.length - 1];
                }
            }
        },
        tooltip: {
            useHTML : true,
            formatter: function() {
                var s = '<div style="white-space:normal;">Unit <b>'+ this.x +'</b><br/>';

                for ( var indexField in specificFields[category]['info']) {
                    var field = specificFields[category]['info'][indexField];
                    if (typeof specificInfo[this.x][field] === 'string') {
                        s +=  field + ' : <b>' + specificInfo[this.x][field] + '</b><br/>';
                    } else {
                        for(var indexInfo in specificInfo[this.x][field]) {
                            s +=  field + ' (' + indexInfo + ') : <b>' + specificInfo[this.x][field][indexInfo] + '</b><br/>';
                        }
                    }
                }

                s += '<table>';
                $.each(this.points, function(i, point) {
                    s += '<tr><td style="color: ' + point.series.color + ';text-align: left">' + point.series.name +':</td>'+
                        '<td style="text-align: right"><b>' + point.y.toFixed(2) + '</b> </td></tr>'
                });

                s += '</table></div>';

                return s;
            },
            shared: true
        },
        plotOptions: {
            series: {
                stacking: 'normal',
                //allowPointSelect: true,
                states: {

                    select: {
                        color: null,
                        borderWidth: 2,
                        borderColor:'Blue'
                    }
                },

                pointPadding: 0.01,
                borderWidth: 0.01,

                //cursor: 'pointer',
                point: {
                    events: {
                        click: function () {
                            var selectedGraph = unitsWordCountChart;
                            var unSelectedGraph = unitsJobChart;

                            if(this.series.chart.renderTo.id == 'generalBarChart_div' ) {
                                selectedGraph = unitsJobChart;
                                unSelectedGraph = unitsWordCountChart;
                            }

                            for (var iterSeries = 0; iterSeries < selectedGraph.series.length; iterSeries++) {
                                selectedGraph.series[iterSeries].data[this.x].select(null,true)
                            }

                            for (var iterData = 0; iterData < unSelectedGraph.series[0].data.length; iterData++) {
                                if(unSelectedGraph.series[0].data[iterData].category == this.category) {
                                    for (var iterSeries = 0; iterSeries < unSelectedGraph.series.length; iterSeries++) {
                                        unSelectedGraph.series[iterSeries].data[iterData].select(null,true);
                                    }
                                    break;
                                }
                            }

                            if($.inArray(this.category, selectedUnits) > -1) {
                                selectedUnits.splice( $.inArray(this.category, selectedUnits), 1 );
                            } else {
                                selectedUnits.push(this.category)
                            }
                            workerUpdateFunction.update(selectedUnits);
                            jobsUpdateFunction.update(selectedUnits);
                            annotationsUpdateFunction.update(selectedUnits);

                        }
                    }
                }
            }
        }
    };



    var computeBarChartProjectData = function(){

        projectCriteria = "";
        for (var key in chartSeriesOptions) {
            var yAxisSeries = chartSeriesOptions[key];
            for (var key in yAxisSeries) {
                if(yAxisSeries[key]['field']!= ""){
                    projectCriteria += "&project[" + key + "]=" + yAxisSeries[key]['field'];
                }
            }
        }

    }

    var getBarChartData = function(newMatchCriteria, sortCriteria){
        chartGeneralOptions.series = [];
        chartGeneralOptions.yAxis = [];
        if(sortCriteria == ""){
            sortCriteria = '&sort[created_at]=1';
        }
        if(newMatchCriteria == ""){
            newMatchCriteria = matchCriteria;
        }


        var url = '/api/analytics/unitgraph/?' + '&match[cache.jobs.count][>]=0' +
                    newMatchCriteria +
                    sortCriteria +
                    projectCriteria;

        $.getJSON(url, function(data) {

            chartGeneralOptions['xAxis']['categories'] = data["id"];


            //create the yAxis and series option fields
            chartGeneralOptions.yAxis = [];
            chartGeneralOptions.series = [];


            for (var key in chartSeriesOptions) {
                var yAxisSeriesGroup = chartSeriesOptions[key];
                var color = 'black';
                var max = 0;
                for (var series in yAxisSeriesGroup) {
                    var newSeries = {
                        name: yAxisSeriesGroup[series]['name'],
                        color: yAxisSeriesGroup[series]['color'],
                        yAxis: chartGeneralOptions.yAxis.length,
                        type: yAxisSeriesGroup[series]['type'],
                        data: data[series],
                        visible: false
                    }
                    if ("tooltip" in yAxisSeriesGroup[series]) {
                        newSeries['tooltip'] = yAxisSeriesGroup[series]['tooltip'];
                    }
                    if(yAxisSeriesGroup[series]['type'] == 'column') {
                        newSeries['stack'] =  key;
                        newSeries['visible'] = true;
                    } else {
                        newSeries['dashStyle'] =  yAxisSeriesGroup[series]['dashStyle'];
                    }
                    var newMax = Math.max.apply(Math, data[series]);
                    if(newMax > max) {
                        max = newMax;
                    }
                    chartGeneralOptions.series.push(newSeries);
                    color = yAxisSeriesGroup[series]['color'];

                }

                var yAxisSettings = {
                    gridLineWidth: 0,
                    labels: {
                        formatter: function () {
                            return this.value;
                        },
                        style: {
                            color: color
                        }
                    },
                    min: 0,
                    max: max,
                    title: {
                        text: key,
                        style: {
                            color: color
                        }
                    },
                    opposite: false
                };
                if(key == 'workers' || key =='jobs' || key == 'annotations')
                    yAxisSettings.opposite = true;
                chartGeneralOptions.yAxis.push(yAxisSettings);
            }

            chartGeneralOptions.xAxis.tickInterval = Math.ceil( data["id"].length/20);
            chartGeneralOptions.chart.renderTo = 'generalBarChart_div';
            chartGeneralOptions.title.text = 'Overview of units used in jobs';
            chartGeneralOptions.plotOptions.series.pointPadding = 0.01;
            chartGeneralOptions.plotOptions.series.borderWidth = 0.01;
            unitsJobChart = new Highcharts.Chart(chartGeneralOptions);
        });
    }

    var drawBarChart = function(matchStr,sortStr) {
        var url = '/api/analytics/jobtypes';
        //add the job type series to graph
        chartSeriesOptions['jobs']={};
        $.getJSON(url, function(data) {
            $.each(data, function (key,value) {

                chartSeriesOptions['jobs'][data[key]] = {'color': colors[key % colors.length],
                    'field': 'cache.jobs.' + data[key], 'name':data[key] + ' jobs', 'type': 'column'};
            });
            computeBarChartProjectData();
            getBarChartData(matchStr, sortStr);
        });
    }

    var drawSpecificBarChart = function(newMatchCriteria, sortCriteria){
        var newChartGeneralOptions = chartGeneralOptions;
        if(sortCriteria == ""){
            sortCriteria = '&sort[created_at]=1';
        }
        if(newMatchCriteria == ""){
            newMatchCriteria = matchCriteria;
        }
        //get the word count data
        var url = '/api/analytics/aggregate/?' +
            newMatchCriteria +
            sortCriteria +
            specificFields[category]['query'];

        $.getJSON(url, function(data) {

            if(data.length == 0)
                return;

            for (var indexData in data['id']) {
                var id = data['id'][indexData];
                specificInfo[id] = {};
                for ( var indexField in specificFields[category]['info']) {
                    var field = specificFields[category]['info'][indexField];
                    specificInfo[id][field] = data[field][indexData];
                }
            }

            newChartGeneralOptions['xAxis']['categories'] = data["id"];

            //create the yAxis and series option fields
            newChartGeneralOptions.yAxis = [];
            newChartGeneralOptions.series = [];
            var newSeries = {
                name: '# of ' + specificFields[category]['data'],
                color: '#6B8E23',
                yAxis: 0,
                type: 'column',
                data: data[specificFields[category]['data']],
                visible: true
            };
            newChartGeneralOptions.series.push(newSeries);

            var yAxisSettings = {
                gridLineWidth: 0,
                labels: {
                    formatter: function () {
                        return this.value;
                    },
                    style: {
                        color: '#6B8E23'
                    }
                },
                yAxis: {min: 0},
                title: {
                    text: '# of ' + specificFields[category]['data'],
                    style: {
                        color: '#6B8E23'
                    }
                },
                opposite: false
            };

            newChartGeneralOptions.yAxis.push(yAxisSettings);
            newChartGeneralOptions.xAxis.tickInterval = Math.ceil( data["id"].length/20);
            newChartGeneralOptions.chart.renderTo = 'specificBarChart_div';
            newChartGeneralOptions.title.text = 'Overview of media';
            newChartGeneralOptions.plotOptions.series.pointPadding = 0;
            newChartGeneralOptions.plotOptions.series.borderWidth = 0;

            unitsWordCountChart = new Highcharts.Chart(newChartGeneralOptions);
        });
    }

    this.createBarChart = function(matchStr){
        matchCriteria = 'match[documentType][]=twrex-structured-sentence';
        drawBarChart(matchStr,"");
        drawSpecificBarChart(matchStr,"");

    }


}