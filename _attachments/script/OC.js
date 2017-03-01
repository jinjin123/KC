'use strict';
function ajaxN(url, method, data, then){
  var options = {
    contentType : 'application/json',
    url:url,
    method: method,
    data:JSON.stringify(data),
    dataType:"json",
    processData: false,
    cache: false,
    crossDomain: true,
    beforeSend: function (xhr) {
       xhr.setRequestHeader ("Authorization", "Basic " + btoa("admin" + ":" + "admin"));
    }
  };
  var verbose = options.verbose;
  delete options.verbose;
  $.ajax(options).done(function (data, textStatus, jqXHR) {
      if(verbose){
          console.log('--------success--------');
          console.log(data);
      }
      console.log("submitOCN success ++++++++++++++++++");
      console.log(data);
      console.log(textStatus);
      console.log(jqXHR);
      if(typeof(then) === 'function'){
          then(data, null);
      }
  }).fail(function (jqXHR, textStatus, errorThrown) {
      var err = ajaxError(jqXHR, textStatus, errorThrown, options);
      console.log("submitOCN failure ++++++++++++++++++");
      console.log(jqXHR);
      console.log(textStatus);
      console.log(errorThrown);
      if(verbose) {
          console.log('---------error---------');
          console.log(err);
      }
      if(typeof(then) === 'function') {
          if(jqXHR.status == 404){
            then(jqXHR,err);
          }else{
            then(null,err);
          }
          
      }
  });
}
function submitOCN(url, order, then){
  var data = O2N(order);
	//url = "http://newoc.sparkpad-dev.com:5000/custom/entity/commerce_order";
  ajaxN(url,"post", data, then);
}
function modifyOCN(url, order, then){
  var obj = getUpdateObj(order);
	//var url = "http://newoc.sparkpad-dev.com:5000/jsonapi/commerce_order/default/?_format=api_json&include=order_items&filter[order_number][value][]=1";
  url = checkUrl(url) + obj.data.id + "?_format=api_json";
  ajaxN(url, "patch", obj, then);
}
function checkUrl(url) {
  if(!url){ return "";}
  if(url.substr(-1, 1) != "/"){
    url += "/";
  }
  return url;
}