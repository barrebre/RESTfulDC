/*
*
*   DC RUM Restful Helper Logic
*
*   This code performs the logic for the DC RUM Restul Helper
*
*   For questions, please email brett.barrett@dynatrace.com
*
*   Version: 1.10
*/

/*
*   Begin Variables
*/

// Debug mode
var debug = false;

// Information about the CAS and RESTful version
var serverName, version;

// Create a dictionary for saving DC RUM internal names
var dictionary = {};

// Options the user could select
var appOptions = dataViewOptions = resolutionOptions = dimensionOptions = metricOptions = [];

// Options the user has selected
var dimensionsList = {};
var metricsList = {};
var metricFilters = {};
var dimFilters = {};
var postParams = {};
var application, dataview, resolution, dimension, metric;

// Parameters Cont.
var dataSourceId, sort, sortDir, sortParam, topFilter, timePeriod, numberOfPeriods, dimFilter, metricFilter;

// Counters
var dimensionCount = metricCount = dimFiltersCount = metricFiltersCount = -1;

//  The order of the DC RUM Queried Parameters Dropdowns
var viewOrder = ["default", "application", "dataview", "resolution", "dimension", "metric"];

//  Text to be output to the user in the console
var userOutput = "";

// The attribute used to make http requests
var http;

// Variables for timing information
var start, now, time;

/*
*   Begin Logic
*/

window.onload = function() {
  getServerNameAndVersion();
  addDimensionQuery();
  addMetricQuery();
  addDimensionFilterLine();
  addMetricFilterLine();
  setTimePeriods();

  setDefaultSelectors(1);
  updateQueriedParameters("default");

  setHelpAnchors();
}

//  desc: Toggles the help div on and off.
//        Returns the URI to the original version after clicking a help option
function help(){
  if(document.getElementById("helpDiv").style.display == "block"){
    document.getElementById("helpDiv").style.display = "none";
    window.history.pushState("", "", '/custom/'+version);
  }
  else{
    document.getElementById("helpDiv").style.display = "block";
  }
}

//  desc: Parses the URL to know what version of RESTful and the CAS host name
function getServerNameAndVersion(){
  var tmp = window.location.href, splits = [];
  tmp = tmp.substring(tmp.indexOf("//")+2);
  splits = tmp.split("/");

  serverName = splits[0];
  document.getElementById("serverName").value = serverName;

  version = splits[2];
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

  setDefaultSelectors(index+1);
  disableFollowingSelectors(index+2);

  switch(caller){
    case "default":
      params = "getApplications";
      updateQuerySelectors(index+1, appOptions = getPossibleParams(params,caller));
      break;
    case "application":
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
    case "dimension":
      // to be completed
      break;
    case "metric":
      // to be completed
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
  var url = "https://"+serverName+"/rest/dmiquery/"+params;

  document.getElementById("currQuery").innerHTML = url;

  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", url, false );

  try{
    xmlHttp.send( null );
  }
  catch(e){
    if(e.name == 'NetworkError'){
      alert("There was an error connecting to the CAS. Verify the server name.");
      userOutput = "Couldn't connect to CAS "+serverName+".<br>"; output();
    }
  }

  response = xmlHttp.responseText;

  // Metric and Application callers need special parsing
  if(caller!="metric" && caller!="application"){
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

    caller=="application" ? array[cnt+1] = splits[1].substring(0,splits[1].length-1) : array[cnt+1] = splits[1];

    cnt = cnt+2;
  }

  // Fix for "]] at end
  if(caller=="application"){
    array[cnt-1] = array[cnt-1].substring(0,array[cnt-1].length-3);
  }

  return array;
}

//  desc: Queried Parameters - Sets the user-chosen variables
function getSelectedVars(){
  application = dictionary[document.getElementById("application").value];
  dataview = dictionary[document.getElementById("dataview").value];
  resolution = dictionary[document.getElementById("resolution").value];

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
  var options = ["p","d","w","m","T","1P","1H","1D","7D","30D","3MO","12MO","FW","FM","WTD","MTD","QTD","YTD"];

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
  timePeriod = document.getElementById("timePeriod").value;
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
  console.log(dimFilters)
  dimFilters = {};
  console.log(dimFilters)
  var select = value = tmp = "";

  for(var i=3; i<document.getElementById("dimFiltersDiv").childNodes.length; i=i+2){
    console.log("found loop: "+i)
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
      dictionary[results[i]]=results[i];
      selectList.push(results[i]);
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
    // In case it's *an* application
    if(i==1){
      document.getElementById(viewOrder[i]).options[0]=new Option("Please select a DC RUM "+viewOrder[i]);
    } else {
      document.getElementById(viewOrder[i]).options[0]=new Option("Please select a "+viewOrder[i]);
    }
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
  var cnt, object;

  switch(viewOrder[index]){
    case "application":
      document.getElementById("userOutput").innerHTML = "";
      userOutput = "Connected to the CAS successfully.<br>";
      userOutput += "Please select a DC RUM Application.<br>";
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
        for(var j=1; j<results.length; j++){
          document.getElementById("dimension"+i).options[j] = null;
        }
        for(var j=0; j<results.length; j++){
          document.getElementById("dimension"+i).options[j+1] = new Option(results[j]);
        }
      }
    case "metric":
      for(var i=1; i<metricCount+1; i++){
        document.getElementById("metric"+i).disabled = false;
        for(var j=1; j<results.length; j++){
          document.getElementById("metric"+i).options[j] = null;
        }
        for(var j=0; j<results.length; j++){
          document.getElementById("metric"+i).options[j+1] = new Option(results[j]);
        }
      }
    default:
  }
  object = document.getElementById(viewOrder[index]);
  cnt = object.options.length;

  object.disabled = false;

  for(var i=1; cnt<results.length ? i<results.length : i<cnt; i++){
    object.options[i] = null;
  }

  for(var i=0; i<results.length; i++){
    object.options[i+1] = new Option(results[i]);
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

  var url = "https://"+serverName+"/rest/dmiquery/getDMIData3?"+param;

  userOutput = url+"<br>"; output();
  userOutput = "Fetching data from the CAS."; output();

  http.open("GET", url, true);

  http.onreadystatechange=function(){
    if (http.readyState==4 && http.status==200){
      busy("stop");

      var jsonResponse = JSON.parse(http.responseText);

      if(jsonResponse.rawData.length == 0){
        userOutput = "<br>The CAS returned an empty data set. ";
        userOutput += "Please verify your dimensions and metrics are valid and make sense. ";
        userOutput += "If those are valid, check your filters.<br>";
      } else {
        userOutput = "Fetched data in "+time+" ms.<br>";
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
      userOutput += "The CAS returned malformed data for "+tmp[0]+". It has been ommitted from the results table.<br>";
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

  userOutput = "User cancelled request after "+time+" ms.<br>"; output();
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

  //createTOC(links);
  var tmp = "<ol>";

  for(var i=0; i<links.length; i++){
    tmp += "<li><a href='#"+links[i]+"'>"+links[i]+"</a></li>";
  }

  tmp += "</ol>";

  document.getElementById("tableOfContents").innerHTML += tmp;
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

//  desc: Selects a body of text
//  element:
function selectText(element) {
  var doc = document;
  var text = element;
  var range, selection;

  if (doc.body.createTextRange) {
      range = document.body.createTextRange();
      range.moveToElementText(text);
      range.select();
  } else if (window.getSelection) {
      selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents(text);
      selection.removeAllRanges();
      selection.addRange(range);
  }
}
