
//		**********Do Not Delete*****
//		command to export in WGS84 format
// in chrome (won<t work in IE
// built using : https://www12.statcan.gc.ca/census-recensement/2011/geo/bound-limit/bound-limit-2016-eng.cfm
// Census divisions digital
// Provinces/territories Cartographic Boundary File
// -proj wgs84 -o format=geojson precision=0.01  csd_01.json
//		**********Do Not Delete*****
//



function init() {

    d3.queue()
        .defer(d3.csv, 'data/csd_breakdown.csv')
        .defer(d3.json, 'data/csd_001.json')
        .defer(d3.csv, 'data/advertisements.csv')
        .defer(d3.csv, 'data/LMI_INFO.csv')
        .defer(d3.csv, 'data/LMI_PS_NOC_INFO.csv')
        .defer(d3.csv, 'data/COMMUTE_INFO.csv')
        .await(makeMap);//only function name is needed
}

