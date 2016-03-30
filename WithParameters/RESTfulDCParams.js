/*
*
*   DC RUM Restful Helper Logic
*
*   This code performs the logic for the DC RUM Restul Helper
*
*   For questions, please email brett.barrett@dynatrace.com
*
*   Version: 2.0.4
*/

/*
*   Begin Variables
*/

// Debug mode
var debug = false;

// Information about the connection type (http/https), CAS, and RESTful path
var connection, serverName, path = '';

// Create a dictionary for saving DC RUM internal names
var dictionary = {}, resolutions = {}, timePeriods = {};

// Options the user could select
var appOptions = dataViewOptions = resolutionOptions = dimensionOptions = metricOptions = [];

// Options the user has selected
var dimensionsList = {};
var metricsList = {};
var metricFilters = {};
var dimFilters = {};
var postParams = {};

//  application is now referenced as datasource to avoid confusion
var application, dataview, resolution, dimension, metric;

// Parameters Cont.
var dataSourceId, sort, sortDir, sortParam, topFilter, timePeriod, numberOfPeriods, dimFilter, metricFilter;

// Counters
var dimensionCount = metricCount = dimFiltersCount = metricFiltersCount = -1;

//  The order of the DC RUM Queried Parameters Dropdowns
var viewOrder = ["default", "datasource", "dataview", "resolution", "dimension", "metric"];

//  Text to be output to the user in the console
var userOutput = "";

// The attribute used to make http requests
var http;

// Variables for timing information
var start, now, time;

/*
*   Begin Logic
*/

var loaded = 0;
window.onload = function() {
  if(!loaded){
    getServerNameAndPath();
    addDimensionQuery();
    addMetricQuery();
    addDimensionFilterLine();
    addMetricFilterLine();
    setTimePeriods();
    addDictionaryDefinitions();

    setDefaultSelectors(1);
    updateQueriedParameters("default");

    setHelpAnchors();
    loadJSONOptions();

    loaded++;
  }
}

function loadJSONOptions(){
  //document.getElementById("getJSONScript").onclick = function(){alert('hi');}
  for(var i=0; i<5; i++){
    dim.options[i+1] = new Option(i);
  }
  for(var i=1; i<6; i++){
    met.options[i] = new Option(i);
  }
  
  dim.addEventListener('change', function(){verifyCol("dim");},false);
  met.addEventListener('change', function(){verifyCol("met");},false);

  dim.style.backgroundColor = "lightblue";
  met.style.backgroundColor = "lightgreen";
}

//  desc: Toggles the help div on and off.
//        Returns the URI to the original version after clicking a help option
function help(){
  if(document.getElementById("helpDiv").style.display == "block"){
    document.getElementById("helpDiv").style.display = "none";
    window.history.pushState("", "", path);
  }
  else{
    document.getElementById("helpDiv").style.display = "block";
  }
}

//  desc: Parses the URL for the path of the RESTful and the CAS host name
function getServerNameAndPath(){
  var tmp = window.location.href, splits = [];
  tmp = tmp.split("//");

  connection = tmp[0]+"//";

  splits = tmp[1].split("/");

  serverName = splits[0];
  document.getElementById("serverName").value = serverName;

  for(var i=1; i<splits.length; i++){
    path += '/'+splits[i];
  }
}

//  desc: Adds a Dimension select option to the DC RUM Queried Parameters
//        If dimensionCount==0, creates original, otherwise duplicates original and creates new
function addDimensionQuery(){
  dimensionCount++;
  var selector;

  if(dimensionCount == 0){
    selector = "<select id='dimension' onchange='updateFilters();'><option value='DEF'>Select a Dimension</option></select>";
    document.getElementById("dimensionSelectors").innerHTML += selector;
  }
  else{
    selector = document.getElementById("dimension").cloneNode(true);
    selector.id += dimensionCount + "";
    document.getElementById("dimensionSelectors").appendChild(selector);
  }
}

//  desc: Removes a Dimension line if there are more than one
function removeDimensionQuery(){
  if(dimensionCount>0){
    document.getElementById("dimension"+dimensionCount).remove();
    dimensionCount--;
  } else {
    alert("nothing to remove!");
  }
  updateFilters();
}

//  desc: Adds a Metric select option to the DC RUM Queried Parameters
//        If metricCount==0, creates original, otherwise duplicates original and creates new
function addMetricQuery(){
  metricCount++;
  var selector;

  if(metricCount == 0){
    selector = "<select id='metric' onchange='updateFilters();'><option value='DEF'>Select a Metric</option></select>";
    document.getElementById("metricSelectors").innerHTML += selector;
  }
  else{
    selector = document.getElementById("metric").cloneNode(true);
    selector.id += metricCount + "";
    document.getElementById("metricSelectors").appendChild(selector);
  }
}

//  desc: Removes a Metric line if there are more than one
function removeMetricQuery(){
  if(metricCount>0){
    document.getElementById("metric"+metricCount).remove();
    metricCount--;
  } else {
    alert("nothing to remove!");
  }
  updateFilters();
}

//  desc: Adds a dimension filter select option
//        If dimFiltersCount==0, creates original, otherwise duplicates original and creates new
function addDimensionFilterLine(){
  dimFiltersCount++;
  var selector, textArea;

  if(dimFiltersCount == 0){
    selector = "<select id='selectDimFilter'><option value='DEF'>Select a Dimension</option></select>";
    document.getElementById("dimFiltersDiv").innerHTML += selector;
    textArea = "<textarea id='textAreaDimFilter'></textarea>";
    document.getElementById("dimFiltersDiv").innerHTML += textArea;
  }
  else{
    selector = document.getElementById("selectDimFilter").cloneNode(true);
    selector.id += dimFiltersCount + "";
    document.getElementById("dimFiltersDiv").appendChild(selector);

    textArea = document.getElementById("textAreaDimFilter").cloneNode(true);
    textArea.id += dimFiltersCount + "";
    document.getElementById("dimFiltersDiv").appendChild(textArea);
  }
}

//  desc: Removes a dimension filter line if there are more than one
function removeDimensionFilterLine(){
  if(dimFiltersCount>0){
    document.getElementById("selectDimFilter"+dimFiltersCount).remove();
    document.getElementById("textAreaDimFilter"+dimFiltersCount).remove();
    dimFiltersCount--;
  } else {
    document.getElementById("selectDimFilter").selectedIndex = 0;
    document.getElementById("textAreaDimFilter").value = "";
  }
}

//  desc: Adds a Metric filter select option
//        If metricFiltersCount==0, creates original, otherwise duplicates original and creates new
function addMetricFilterLine(){
  metricFiltersCount++;
  var selector, textArea, options;

  if(metricFiltersCount == 0){
    // Builds the metric selector
    selector = "<select id='selectMetricFilter' style='float: left;'><option value='DEF'>Select a Metric</option></select>";
    document.getElementById("metricFiltersDiv").innerHTML += selector;

    // Builds the operator selector
    selector = "<select id='selectMetricFilterOperator' style='width: 8%; float: left;'><option value='='>=</option></select>";
    document.getElementById("metricFiltersDiv").innerHTML += selector;

    options = ["!=","<","<=",">",">="];
    giveOptions("selectMetricFilterOperator",options,1);

    // Builds the filter value text area
    textArea = "<textarea id='textAreaMetricFilter' style='float: left;'></textarea>";
    document.getElementById("metricFiltersDiv").innerHTML += textArea;
  }
  else{
    selector = document.getElementById("selectMetricFilter").cloneNode(true);
    selector.id += metricFiltersCount + "";
    document.getElementById("metricFiltersDiv").appendChild(selector);

    selector = document.getElementById("selectMetricFilterOperator").cloneNode(true);
    selector.id += metricFiltersCount + "";
    document.getElementById("metricFiltersDiv").appendChild(selector);

    textArea = document.getElementById("textAreaMetricFilter").cloneNode(true);
    textArea.id += metricFiltersCount + "";
    document.getElementById("metricFiltersDiv").appendChild(textArea);
  }
}

//  desc: Removes a Metric filter line if there are more than one
function removeMetricFilterLine(){
  if(metricFiltersCount>0){
    document.getElementById("selectMetricFilter"+metricFiltersCount).remove();
    document.getElementById("selectMetricFilterOperator"+metricFiltersCount).remove();
    document.getElementById("textAreaMetricFilter"+metricFiltersCount).remove();
    metricFiltersCount--;
  } else {
    document.getElementById("selectMetricFilter").selectedIndex = 0;
    document.getElementById("selectMetricFilterOperator").selectedIndex = 0;
    document.getElementById("textAreaMetricFilter").value = "";
  }
}

//  desc: Original Query DC RUM method
//  caller: Who initiated the method (from viewOrder[])
function updateQueriedParameters(caller){
  getSelectedVars();

  var params = "", index = viewOrder.indexOf(caller);

  if(caller!="resolution") setDefaultSelectors(index+1);
  disableFollowingSelectors(index+2);

  switch(caller){
    case "default":
      params = "getApplications";
      updateQuerySelectors(index+1, appOptions = getPossibleParams(params,caller));
      break;
    case "datasource":
      params = "getDataViews?appId="+application;
      updateQuerySelectors(index+1, dataViewOptions = getPossibleParams(params,caller));
      break;
    case "dataview":
      params = "getResolutions?appId="+application+"&viewId="+dataview;
      updateQuerySelectors(index+1, resolutionOptions = getPossibleParams(params,caller));
      break;
    case "resolution":
      index++;
      params = "getDimensions?appId="+application+"&viewId="+dataview+"&resolution="+resolution;
      updateQuerySelectors(index, dimensionOptions = getPossibleParams(params,caller));

      params = "getMetrics?appId="+application+"&viewId="+dataview+"&resolution="+resolution;
      updateQuerySelectors(index+1, metricOptions = getPossibleParams(params,"metric"));
      break;
    default:
      alert("no case found");
  }
}

//  desc: Queried Parameters - Queries DC RUM for possible parameters
//  params: The parameters to supply for the http request
//  caller: Who initiated the method
function getPossibleParams(params,caller){
  params = typeof params !== 'undefined' ? params : "";
  var url = connection+serverName+"/rest/dmiquery/"+params;

  document.getElementById("currQuery").innerHTML = url;

  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", url, false );

  try{
    xmlHttp.send( null );
  }
  catch(e){
    if(e.name == 'NetworkError'){
      alert("There was an error connecting to the CAS. Verify the server name.");
      userOutput += "<font color='red'>Couldn't connect to CAS "+serverName+".</font><br>"; output();
    }
  }

  response = xmlHttp.responseText;

  // Metric and Application callers need special parsing
  if(caller!="metric" && caller!="datasource"){
    var results = JSON.parse(response).results+'';
    results = results.split(",");
  } else {
    results = sanitizeResults(response,caller);
  }
  return processResults(results,caller);
}

//  desc: Toggles the timer and busy screen
//  option: Whether to start or stop
function busy(option){
  if(option == "start"){
    start = Date.now();
    document.getElementById("busy").style.display = "block";
  }
  else{
    now = Date.now();
    document.getElementById("busy").style.display = "none";
  }
  time = now-start;
}

//  desc: Cleans the results from the CAS
//  results: What the CAS returned
//  caller: Who initiated the call
//  return: Processed results
function sanitizeResults(results,caller){
  var tmp = "", objects, splits, retVal = "", cnt = 0, array = [];

  tmp = results.substring(results.indexOf("[[")+2);
  objects = tmp.split("],[");

  for(var i=0; i<objects.length; i++){
    splits = objects[i].split("\",\"");
    array[cnt] = splits[0].substring(1);

    caller=="datasource" ? array[cnt+1] = splits[1].substring(0,splits[1].length-1) : array[cnt+1] = splits[1];

    cnt = cnt+2;
  }

  // Fix for "]] at end
  if(caller=="datasource"){
    array[cnt-1] = array[cnt-1].substring(0,array[cnt-1].length-3);
  }

  return array;
}

//  desc: Queried Parameters - Sets the user-chosen variables
function getSelectedVars(){
  application = dictionary[document.getElementById("datasource").value];
  dataview = dictionary[document.getElementById("dataview").value];
  resolution = resolutions[document.getElementById("resolution").value];

  getSelectedDimensions();
  getSelectedMetrics();
}

//  desc: Updates DimFilter, MetrFilter, and Sort based on user-chosen options
function updateFilters(){
  getSelectedDimensions();
  getSelectedMetrics();

  if(defined(dimension) && defined(metric)) {
    updateDimensionFilters();
    updateMetricFilters();

    updateSortParam();
  }
}

//  desc: Clears the old dimension filters and builds the new list
function updateDimensionFilters(){
  var combinedList = [];
  combinedList.push(document.getElementById("dimension").value);

  for(var i=1; i<dimensionCount+1; i++){
    if(defined(document.getElementById("dimension"+i).value)) combinedList.push(document.getElementById("dimension"+i).value);
  }

  combinedList = combinedList.sort();

  // For the first Dimension Filter
  for(var i=1; i<combinedList.length; i++){
    document.getElementById("selectDimFilter").options[i]=null;
  }

  for(var i=1; i<combinedList.length+1; i++){
    document.getElementById("selectDimFilter").options[i]=new Option(combinedList[i-1]);
    document.getElementById("selectDimFilter").selectedIndex = 0;
  }

  // For subsequent Filters
  for(var j=1; j<dimFiltersCount+1; j++){
    // For the first Dimension Filter
    for(var i=1; i<combinedList.length; i++){
      document.getElementById("selectDimFilter"+j).options[i]=null;
    }

    for(var i=1; i<combinedList.length+1; i++){
      document.getElementById("selectDimFilter"+j).options[i]=new Option(combinedList[i-1]);
      document.getElementById("selectDimFilter"+j).selectedIndex = 0;
    }
  }
}

//  desc: Clears the old metric filters and builds the new list
function updateMetricFilters(){
  var combinedList = [], selected = "", object;
  combinedList.push(document.getElementById("metric").value);

  for(var i=1; i<metricCount+1; i++){
    if(defined(document.getElementById("metric"+i).value)) combinedList.push(document.getElementById("metric"+i).value);
  }

  combinedList = combinedList.sort();

  // The first filter
  object = document.getElementById("selectMetricFilter");
  selected = object.value;

  for(var i=1; i<combinedList.length; i++){
    object.options[i]=null;
  }

  for(var i=1; i<combinedList.length+1; i++){
    object.options[i]=new Option(combinedList[i-1]);
    object.selectedIndex = 0;
  }

  for(var i=0; i<object.options.length; i++){
    if(object.options[i].value == selected){
      object.value = selected;
      i=10000;
    }
  }

  // For subsequent Filters
  for(var j=1; j<metricFiltersCount+1; j++){
    object = document.getElementById("selectMetricFilter"+j);
    selected = object.value;

    for(var i=1; i<combinedList.length; i++){
      object.options[i]=null;
    }

    for(var i=1; i<combinedList.length+1; i++){
      object.options[i]=new Option(combinedList[i-1]);
      object.selectedIndex = 0;
    }

    for(var i=0; i<object.options.length; i++){
      if(object.options[i].value == selected){
        object.value = selected;
        i=10000;
      }
    }
  }
}

//  desc: Clears the old sort options and builds the new list
function updateSortParam(){
  userOutput = "Updated sort parameters, dimension filters, and metrics filters.<br>";

  var combinedList = [];

  combinedList.push(document.getElementById("dimension").value);
  combinedList.push(document.getElementById("metric").value);

  for(var i=1; i<dimensionCount+1; i++){
    if(defined(document.getElementById("dimension"+i).value)) combinedList.push(document.getElementById("dimension"+i).value);
  }

  for(var i=1; i<metricCount+1; i++){
    if(defined(document.getElementById("metric"+i).value)) combinedList.push(document.getElementById("metric"+i).value);
  }

  for(var i=1; i<combinedList.length; i++){
    document.getElementById("sortParam").options[i]=null;
  }

  combinedList = combinedList.sort();

  for(var i=1; i<combinedList.length+1; i++){
    document.getElementById("sortParam").options[i]=new Option(combinedList[i-1]);
    if(combinedList[i-1]=="Time"){
      document.getElementById("sortParam").selectedIndex = i;
      document.getElementById("sortDir").selectedIndex = 2;
      userOutput += "Changed sorting to newest Time first.<br>";
    }
  }
  output();
}

//  desc: Sets time period options instead of hard coding them
function setTimePeriods(){
  var options = ["p: 1 period (monitoring interval, dependent on the report server settings)"];

  options.push('d: 1 day');
  options.push("w: 1 week");
  options.push("m: 1 month");
  options.push("T: today (since midnight)");
  options.push("1P: last period");
  options.push("1H: last hour");
  options.push("1D: last day");
  options.push("7D: last 7 days");
  options.push("30D: last 30 days");
  options.push("3MO: last 3 months");
  options.push("12MO: last 12 months");
  options.push("FW: the full week");
  options.push("FM: the full month");
  options.push("WTD: week to date");
  options.push("MTD: month to date");
  options.push("QTD: quarter to date");
  options.push("YTD: year to date");

  giveOptions("timePeriod",options,0);
}

//  desc: Selects all dimensions, even if there is more than one line
function getSelectedDimensions(){
  dimension = dictionary[document.getElementById("dimension").value];

  for(var i=1; i<dimensionCount+1; i++){
    dimensionsList[i] = dictionary[document.getElementById("dimension"+i).value];
  }

  if(debug){
    var tmp = "Selected dimensions are: ";
    tmp += dimension;
    for(var i=1; i<dimensionCount+1; i++){
      tmp += dictionary[document.getElementById("dimension"+i).value] + " ";
    }
  }
}

//  desc: Selects all metrics, even if there is more than one line
function getSelectedMetrics(){
  metric = dictionary[document.getElementById("metric").value];

  for(var i=1; i<metricCount+1; i++){
    metricsList[i] = dictionary[document.getElementById("metric"+i).value];
  }

  if(debug){
    var tmp = "Selected metrics are: ";
    tmp += metric;
    for(var i=1; i<metricCount+1; i++){
      tmp += dictionary[document.getElementById("metric"+i).value];
    }
  }
}

// desc: Tests to ensure the user has selected a dimension and a metric
function testSelectedValues(){
  getSelectedVars();

  if(!defined(dimension) || !defined(metric)){
    alert("You must first select a dimension and metric");
  }
  else {
    getSampleData();
  }
}

//  desc: Gets the other user-entered variables
function getEnteredParams(){
  sortDir = document.getElementById("sortDir").value;
  sortParam = document.getElementById("sortParam").value;
  topFilter = document.getElementById("topFilter").value;
  timePeriod = timePeriods[document.getElementById("timePeriod").value];
  numberOfPeriods = document.getElementById("numberOfPeriods").value;

  // Custom work for specific parameters
  var paramSplit, output;

  dimFilter = metricFilter = "";
  dimFilter = buildDimensionFilter();
  metricFilters = buildMetricFilter();

  if(sortDir ==""){
    sort = "[]";
  } else {
    sort = "[['"+dictionary[sortParam]+"',"+sortDir+"]]";
  }

  if(topFilter == "") topFilter = 1000;
  if(timePeriod == "") timePeriod = "1P";
  if(numberOfPeriods == "") numberOfPeriods = 1;

  buildFormattedParameter("dimension");
  buildFormattedParameter("metric");
}

//  desc: builds the JSON dimension and metric params
//  type: Which parameter type needs to be built
function buildFormattedParameter(type){
  var tmp = "['";

  if(type == "dimension"){
    tmp += dictionary[document.getElementById("dimension").value];
    for(var i=1; i<dimensionCount+1; i++){
      tmp += "','" + dimensionsList[i];
    }
    dimension = tmp + "']";
  }

  if(type == "metric"){
    tmp += dictionary[document.getElementById("metric").value];
    for(var i=1; i<metricCount+1; i++){
      tmp += "','" + metricsList[i];
    }
    metric = tmp + "']";
  }
}

//  desc: Builds the JSON dimension filter
function buildDimensionFilter(){
  dimFilters = {};
  var select = value = tmp = "";

  for(var i=3; i<document.getElementById("dimFiltersDiv").childNodes.length; i=i+2){
    select = document.getElementById("dimFiltersDiv").childNodes[i].value;
    value = document.getElementById("dimFiltersDiv").childNodes[i+1].value;

    if(select != "DEF"){
      if(value != ""){
        dimFilters[select] = value;
      }
      else{
        alert("The "+select+" filter was not used because there was no value");
      }
    }
  }

  tmp = "[";
  for(var i=0; i<Object.keys(dimFilters).length; i++){
    tmp += "['";
    tmp += dictionary[Object.keys(dimFilters)[i]]+"','"; ////the metric
    tmp += dimFilters[Object.keys(dimFilters)[i]]+"',false],"; ////the value
  }

  // If tmp.length is 1, there were no filters, add a close bracket.
  // If tmp.length isn't 1, there was a filter, remove the tailing comma
  tmp.length == 1 ? tmp += "]" : tmp = tmp.substring(0,tmp.length-1)+"]";
  return tmp;
}

//  desc: Builds the JSON metric filter
//  return: The formatted JSON metric filter
function buildMetricFilter(){
  var select = operator = value = tmp = "";

  tmp = "[";

  for(var i=3; i<document.getElementById("metricFiltersDiv").childNodes.length; i=i+3){
    select = document.getElementById("metricFiltersDiv").childNodes[i].value;
    operator = document.getElementById("metricFiltersDiv").childNodes[i+1].value;
    value = document.getElementById("metricFiltersDiv").childNodes[i+2].value;

    if(select != "DEF"){
      if(value != ""){
        tmp += "['";
        tmp += dictionary[select]+"','"; ////the metric
        tmp += operator+"',"; ///the operator
        tmp += value+",1],"; ////the value
      }
      else{
        alert("The "+select+" filter was not used because there was no value");
      }
    }
  }

  tmp.length == 1 ? tmp += "]" : tmp = tmp.substring(0,tmp.length-1)+"]";
  return tmp;
}

//  desc: Adds the parameters into the cache dictionary
//  results: The results to be processed
//  caller: Who called the method
//  return: The sorted list options
function processResults(results,caller){
  var selectList = [];

  // dataview doesn't include results every other result
  if(caller == "dataview"){
    for(var i=0; i<results.length; i++){
      // Find which resolution entry has the value
      for(var j=0; j<Object.keys(resolutions).length; j++){
        if(resolutions[Object.keys(resolutions)[j]] == results[i])
          selectList.push(Object.keys(resolutions)[j]);
      }
    }
  }
  else if(caller == "metric"){
    for(var i=0; i<results.length; i=i+2){
      dictionary[results[i+1]]=results[i];
      selectList.push(results[i+1]);
    }
  }
  else {
    for(var i=0; i<results.length-1; i=i+2){
      if(results[i]=="" || results[i].charAt(0)==" "){
      } else {
        dictionary[results[i+1]]=results[i];
        selectList.push(results[i+1]);
      }
    }
  }

  return selectList.sort();
}

/*
*   Begin Appearance
*/

//  desc: Sets the default selectors
//  index: Which index of viewOrder to set the default selector
function setDefaultSelectors(index){
  for(var i=index; i<viewOrder.length; i++){
    document.getElementById(viewOrder[i]).options[0]=new Option("Please select a "+viewOrder[i]);
    document.getElementById(viewOrder[i]).selectedIndex = 0;
  }
}

//  desc: Disables selectors that shouldn't yet be clicked
//  index: The index of the first selector, onward, to be disabled
function disableFollowingSelectors(index){
  for(var i=index; i<viewOrder.length; i++){
    switch(viewOrder[i]){
      case "dimension":
        for(var j=1; j<dimensionCount+1; j++){
          document.getElementById("dimension"+j).disabled = true;
        }
      case "metric":
        for(var j=1; j<metricCount+1; j++){
          document.getElementById("metric"+j).disabled = true;
        }
      default:
        document.getElementById(viewOrder[i]).disabled = true;
    }
  }
}

// desc: Updates the DC RUM Queried Parameters select options to represent new options
// index: Which index of viewOrder to update
// results: With which values to update
function updateQuerySelectors(index, results){
  var cnt, object, selectedVals = [];

  switch(viewOrder[index]){
    case "datasource":
      userOutput += "<font color='green'>Connected to the CAS successfully.</font><br>";
      userOutput += "Please select a Data Source.<br>";
      break;
    case "dataview":
      userOutput = "Please select a Dataview.<br>";
      break;
    case "resolution":
      userOutput = "Please select a Resolution.<br>";
      break;
    case "dimension":
      userOutput = "Please select a Dimension and a Metric.<br>";
      for(var i=1; i<dimensionCount+1; i++){
        document.getElementById("dimension"+i).disabled = false;
        selectedVals[i] = document.getElementById("dimension"+i).value;

        for(var j=1; j<results.length; j++){
          document.getElementById("dimension"+i).options[j] = null;
        }
        for(var j=0; j<results.length; j++){
          document.getElementById("dimension"+i).options[j+1] = new Option(results[j]);
          if(results[j] == selectedVals[i]) document.getElementById("dimension"+i).selectedIndex = j+1;
        }
      }
      break;
    case "metric":
      for(var i=1; i<metricCount+1; i++){
        document.getElementById("metric"+i).disabled = false;
        selectedVals[i] = document.getElementById("metric"+i).value;

        for(var j=1; j<results.length; j++){
          document.getElementById("metric"+i).options[j] = null;
        }
        for(var j=0; j<results.length; j++){
          document.getElementById("metric"+i).options[j+1] = new Option(results[j]);
          if(results[j] == selectedVals[i]) document.getElementById("metric"+i).selectedIndex = j+1;
        }
      }
      break;
    default:
  }

  object = document.getElementById(viewOrder[index]);
  selectedVals[0] = object.value;
  cnt = object.options.length;

  object.disabled = false;

  for(var i=1; cnt<results.length ? i<results.length : i<cnt; i++){
    object.options[i] = null;
  }

  for(var i=0; i<results.length; i++){
    object.options[i+1] = new Option(results[i]);
    if(results[i] == selectedVals[0]) object.selectedIndex = i+1;
  }

  if(viewOrder[index] != "metric") output();
}

//  desc: Prints text to the user in the userOutput div
function output(){
  var div = document.getElementById("userOutput");
  if(defined(userOutput)) div.innerHTML += userOutput + "<br>";
  div.scrollTop = div.scrollHeight;
  userOutput = "";
}

//  desc: Queries DC RUM for sample data based on selected options
function getSampleData(){
  getEnteredParams();
  buildPostParams();
  param = "";

  for(key in postParams){
    param += key + "=" + postParams[key] +"&";
  }
  param = param.substring(0,param.length-1);

  http = new XMLHttpRequest();

  var url = connection+serverName+"/rest/dmiquery/getDMIData3?"+param;

  userOutput = url+"<br>"; output();
  userOutput = "Fetching data from the CAS."; output();

  http.open("GET", url, true);

  http.onreadystatechange=function(){
    if (http.readyState==4 && http.status==200){
      busy("stop");

      var jsonResponse = JSON.parse(http.responseText);

      if(jsonResponse.rawData.length == 0){
        userOutput = "<br><font color='red'>The CAS returned an empty data set</font>. ";
        userOutput += "Please verify your dimensions and metrics are valid and make sense. ";
        userOutput += "If those are valid, check your filters.<br>";
      } else {
        userOutput = "<font color='green'>Fetched data in "+time+" ms.</font><br>";
      }
      output();
      buildResultsTable(jsonResponse);
    }
  }
  busy("start");
  http.send( null );
}

//  desc: Builds the parameters to be sent to the CAS
function buildPostParams(){
  // Queried Parameters
  postParams["appId"] = application;
  postParams["viewId"] = dataview;
  postParams["dimensionIds"] = dimension;
  postParams["metricIds"] = metric;
  postParams["resolution"] = resolution;

  // Parameters Cont.
  postParams["dimFilters"] = dimFilter;
  postParams["metricFilters"] = metricFilters;
  postParams["sort"] = sort;
  postParams["topFilter"] = topFilter;
  postParams["timePeriod"] = timePeriod;
  postParams["numberOfPeriods"] = numberOfPeriods;

  postParams["dataSourceId"] = "ALL_AGGR";
}

//  desc: Builds the sample output
function buildResultsTable(response){
  // Start the table
  var tblRow = "<table id='results'><tr>";
  var tmp = "", columns = 0;

  // Build the table headers
  for(key in response["columnHeaderName"]){
    columns++;
    tblRow += "<th>"+ response["columnHeaderName"][key];
    if(response["columnUnit"][key] != ""){
      tblRow += " (" + response["columnUnit"][key] + ")";
    }
    tblRow += "</th>";
  }
  tblRow += "</tr>"

  // Build out results rows
  for(key in response["formattedData"]){
    tblRow += "<tr>";

    tmp = (response["formattedData"][key]+"").split(",");

    // Skips anything after the first comma in the name
    // Better to send no data than bad data

    if(tmp.length>columns){
      userOutput += "The CAS returned malformed data for <font color='red'>"+tmp[0]+"</font>. It has been ommitted from the results table.<br>";
      //tblRow += "<td>" + tmp[0] + "</td>";
    } else {
      for(var i=0; i<columns; i++){
        tblRow += "<td>" + tmp[i] + "</td>";
      }
    }
    tblRow += "</tr>";
  }

  // Finish table
  tblRow += "</tr></table>";

  // Add to data sections
  document.getElementById("sampleDataOutput").innerHTML = tblRow;
  document.getElementById("largeDataContent").innerHTML = "<center>"+tblRow+"</center>";

  // If there was malformed data
  if(userOutput != "") output();
}

//  desc: Cancels the CAS request if the request is taking longer than the user would like
function cancelRequest(){
  busy("stop");
  http.abort();
  http.onreadystatechange = null;

  userOutput = "<font color='red'>User cancelled request after "+time+" ms.</font><br>"; output();
}

//  desc: Used to update the server name
//  name: The value from the serverName textarea
function setServerName(name){
  serverName = name;
}

/*
*   Begin Helper Methods
*/

// desc: Correctly removes an element
Element.prototype.remove = function() {
  this.parentElement.removeChild(this);
}

//  desc: Returns true if the object is defined
//  object: The object to be checked
function defined(object){
  if(typeof object == 'undefined') return false;
  return true;
}

//  desc: Gives options to a selector
//  target: Which selector to give options
//  options: An array of the options to give
//  start: At which index to start (1 if a default value)
function giveOptions(target, options, start){
  var select = document.getElementById(target);

  for(var i=start; i<select.options.length; i++){
    select.options[i] = null;
  }

  for(var i=start; i<options.length+start; i++){
    select.options[i] = new Option(options[i-start]);
  }
}

//  desc: Creates the Help anchors in the help page
function setHelpAnchors(){
  var div = document.getElementById("helpDiv").childNodes[5];
  var links = [];
  for(var i=0; i<div.childNodes.length; i++){
    if(div.childNodes[i].nodeName == "H3"){
      div.childNodes[i].childNodes[0].name = div.childNodes[i].childNodes[0].outerText;
      links[links.length] = div.childNodes[i].childNodes[0].name;
    }
  }

  var tmp = "<ol>";

  for(var i=0; i<links.length; i++){
    tmp += "<li><a href='#"+links[i]+"'>"+links[i]+"</a></li>";
  }
  tmp += "</ol>";

  document.getElementById("tableOfContents").innerHTML += tmp;
}

//  desc: Sets the default dictionary terms
function addDictionaryDefinitions(){
  // Time period terms
  timePeriods["p: 1 period (monitoring interval, dependent on the report server settings)"] = "p";
  timePeriods["d: 1 day"] = "d";
  timePeriods["w: 1 week"] = "w";
  timePeriods["m: 1 month"] = "m";
  timePeriods["T: today (since midnight)"] = "T";
  timePeriods["1P: last period"] = "1P";
  timePeriods["1H: last hour"] = "1H";
  timePeriods["1D: last day"] = "1D";
  timePeriods["7D: last 7 days"] = "7D";
  timePeriods["30D: last 30 days"] = "30D";
  timePeriods["3MO: last 3 months"] = "3MO";
  timePeriods["12MO: last 12 months"] = "12MO";
  timePeriods["FW: the full week"] = "FW";
  timePeriods["FM: the full month"] = "FM";
  timePeriods["WTD: week to date"] = "WTD";
  timePeriods["MTD: month to date"] = "MTD";
  timePeriods["QTD: quarter to date"] = "QTD";
  timePeriods["YTD: year to date"] = "YTD";

  // Resolution terms
  resolutions["r: one period (monitoring interval, dependent on the report server settings)"] = "r"
  resolutions["1: one hour"] = "1";
  resolutions["6: six hours"] = "6";
  resolutions["d: one day"] = "d";
  resolutions["w: one week"] = "w";
  resolutions["m: one month"] = "m";
}

//  desc: Creates the Table of Contents
//  contents: What to make the TOC from
function createTOC(contents){
  var tmp = "<ol>";

  for(var i=0; i<contents.length; i++){
    tmp += "<li><a href='#"+contents[i]+"'>"+contents[i]+"</a></li>";
  }
  tmp += "</ol>";

  document.getElementById("tableOfContents").innerHTML += tmp;
}

//  desc: Toggles on or off the largeDataDiv
function enlargeSampleData(){
  if(document.getElementById("largeDataDiv").style.display == "block"){
    document.getElementById("largeDataDiv").style.display = "none";
  }
  else{
    document.getElementById("largeDataDiv").style.display = "block";
  }
}

//  desc: Copies the getSampleData URL, if one exists, from the userOutput div
function copyURL(){
  var node = document.getElementById('userOutput'), text;

  for(var i=node.childNodes.length-1; i>-1; i--){
    if(node.childNodes[i].nodeType == 3){
      if(node.childNodes[i].data.indexOf("http") > -1 ){
        text = node.childNodes[i];
        selectText(text);
        if(document.execCommand('copy')){
          userOutput = "<font color='green'>Successfully copied the request URL.</font><br>";
        } else {
          userOutput = "<font color='red'>Unsuccessfully copied the request URL.</font><br>";
        }

        output();
        return;
      }
    }
  }

  userOutput = "<font color='red'>Unsuccessfully copied the request URL.</font><br>"; output();
}

//  desc: Selects a body of text
//  element: What to be selected
function selectText(element) {
  var range, selection;

  if (document.body.createTextRange) {
      range = document.body.createTextRange();
      range.moveToElementText(element);
      range.select();
  } else if (window.getSelection) {
      selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
  }
}

//  desc: Resets the helper back to its default state
function reset(){
  // Resets the server name value
  getServerNameAndPath();

  // Removes added lines
  while (dimFiltersCount>0) removeDimensionFilterLine();
  while (metricFiltersCount>0) removeMetricFilterLine();
  while (dimensionCount>0) removeDimensionQuery();
  while (metricCount>0) removeMetricQuery();

  // Notifies the user
  document.getElementById("userOutput").innerHTML = '';
  userOutput = "Reset the RESTful Helper.<br>"; output();

  // Performs the onload query
  updateQueriedParameters('default');

  // Sets all other fields back to default
  document.getElementById('textAreaDimFilter').value = '';
  document.getElementById('textAreaMetricFilter').value = '';
  document.getElementById('selectMetricFilterOperator').selectedIndex = 0;
  document.getElementById('numberOfPeriods').value = 1;
  document.getElementById('timePeriod').selectedIndex = 0;
  document.getElementById("sampleDataOutput").innerHTML = '';
  document.getElementById("largeDataContent").innerHTML = '';
}

function verifyCol(caller){
  var val = document.getElementById(caller).value;
  
  if(caller == "dim"){
    if(val>dimensionCount){
      userOutput = "<font color='red'>The </font>";
      userOutput += "<font color='lightblue'>tag </font>";
      userOutput += "<font color='red'>column index you choose was too high. Try another.</font><br>"; output();
      document.getElementById(caller).selectedIndex = 0;
    }
  } else {
    if(val>metricCount+dimensionCount+1){
      userOutput = "<font color='red'>The </font>";
      userOutput += "<font color='lightgreen'>value </font>";
      userOutput += "<font color='red'>column index you choose was too high. Try another.</font><br>"; output();
      document.getElementById(caller).selectedIndex = 0;
    } else if(val <= dimensionCount) {
      userOutput = "<font color='red'>The </font>";
      userOutput += "<font color='lightgreen'>value </font>";
      userOutput += "<font color='red'>column index you choose was too low. Try another.</font><br>"; output();
      document.getElementById(caller).selectedIndex = 0;
    } else {
    }
  }

  if(!document.getElementById("sampleDataOutput").innerHTML.includes("tr")){
  } else {
    // Reset old cells
    var res = document.getElementById("results");
    if(caller == "dim"){
      dimNum = document.getElementById("dim").value;
      if(defined(res.childNodes[0].childNodes[0].childNodes[dimNum]))
        res.childNodes[0].childNodes[0].childNodes[dimNum].style.backgroundColor = "white"


      // Set new cells
      res.childNodes[0].childNodes[0].childNodes[dimNum].style.backgroundColor = "lightblue"
      
    } else {
      metNum = document.getElementById("met").value;
      if(defined(res.childNodes[0].childNodes[0].childNodes[metNum]))
        res.childNodes[0].childNodes[0].childNodes[metNum].style.backgroundColor = "white"
      

      // Set new cells
      res.childNodes[0].childNodes[0].childNodes[metNum].style.backgroundColor = "lightgreen"
      
    }
  }
}

// JSON - Builds the output
// There is old functionality in this method. Originally, I used a file that would read
// from a list of JSON objects to generate multiple requests and push the data to a 3rd
// party BI tool. If you need to do so, please use the RESTfulDCParams files
function buildJSON(){
  var tag = document.getElementById("dim").value;
  var met = document.getElementById("met").value;
  var ddName = document.getElementById("metricName").value;

  if(tag!="Tag" && met!="Value"){

    getEnteredParams();
    buildPostParams();

    var text = "{";
    text += '"appId": "' + postParams['appId'] + '",';
    text += '"viewId": "' + postParams['viewId'] + '",';
    text += '"dataSourceId": "' + postParams['dataSourceId'] + '",';
    text += '"dimensionIds": ' + postParams['dimensionIds'].split("'").join("\"") + ',';
    text += '"metricIds": ' + postParams['metricIds'].split("'").join("\"") + ',';
    text += '"dimFilters": ' + postParams['dimFilters'].split("'").join("\"") + ',';
    text += '"metricFilters": ' + postParams['metricFilters'].split("'").join("\"") + ',';
    text += '"sort": ' + postParams['sort'].split("'").join("\"") + ',';
    text += '"top": ' + postParams['topFilter'] + ',';
    text += '"resolution": "' + postParams['resolution'] + '",';
    text += '"timePeriod": "' + postParams['timePeriod'] + '",';
    text += '"numberOfPeriods": ' + postParams['numberOfPeriods'] + '}';
    
    text += '|||'+tag+'|||'+met+'|||'+ddName;

    document.getElementById("JSONOutput").innerHTML = text;
  } else {
    userOutput = "<font color='red'>You must first select a DC RUM Tag and Value</font><br>"; output();
  }
}

//  desc: Copies text
//  location: Which div to select
//  nodeNum: Which node to copy from the div
function clipboard(location, nodeNum){
  var text = document.getElementById(location).childNodes[nodeNum];

  defined(text) ? selectText(text) : alert("There is nothing to be copied");

  var successful = document.execCommand('copy');
  var msg = successful ? 'successful' : 'unsuccessful';

  userOutput = "Copy was "+msg+".<br>";
  output();
}