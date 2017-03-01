'use strict';
function getTimeCount(t){
	if(t == null || t == "") return null;
	return Math.floor((new Date(t)).getTime()/1000);
}
var statesN = {
    draft: "draft",
    fulfillment: "fulfilment",
    wait_for_buyer_to_pay: "wait_for_buyer_to_pay",
    buyer_has_paid: "buyer_has_paid",
    preparing: "preparing",
    ready: "ready",
    delivering: "delivering",
    completed: "completed",
    canceled:"canceled",
    returned: "returned"
};

var updateO2N = {
  orderid: "order_number",
  orderstatus: "state",
  Invoicetitle: "field_invoice_title",
  //mealstime: 
  deliverytime: "field_delivering_time",
  receivetime: "field_delivered",
  returntime: "completed",
  canceltime: "field_canceled",
  paytime: "field_payment_received"
};

function getStateO2N(s){
	var sNew = statesN.draft;
	switch(s){
		case 1:
			sNew = statesN.wait_for_buyer_to_pay;
			break;
		case 2:
			sNew = statesN.preparing;
			break;
		case 3:
			sNew = statesN.delivering;
			break;
		case 4:
			sNew = statesN.completed;
			break;
		case 5:
			sNew = stateN.canceled;
			break;
		default:
			break;
	}
	return sNew;
}
function O2N(o){
	var obj = {};
	var oInfo = o.orderInfo;
	var oPros = o.productList;
	obj.uuid = o.uuid
	obj.mail = "testrest@test.com";
	obj.field_crm_customer_id = o.field_crm_customer_id;
	obj.field_de_business_id = o.field_de_business_id; //43;
	obj.field_de_store_id = o.field_de_store_id;//oInfo.storeid;
	obj.field_mkt_discount_id = o.field_mkt_discount_id;//34;
	obj.field_discount = {
		number: oInfo.dicountamount,
		currency_code: "CNY"
	};
	obj.field_delivery_fee = {
		number: oInfo.freight,
		currency_code: "CNY"
	};
	obj.placed = getTimeCount(oInfo.addtime);
	obj.completed = getTimeCount(oInfo.receivetime);
	obj.field_canceled = getTimeCount(oInfo.canceltime);
	obj.field_delivering_time = getTimeCount(oInfo.deliverytime);
	obj.field_delivered = getTimeCount(oInfo.receivetime);
	obj.field_payment_received = getTimeCount(oInfo.paytime);
	obj.order_number = oInfo.orderid;
	obj.field_returned = getTimeCount(oInfo.receivetime);
	obj.state = getStateO2N(oInfo.orderstatus);
	obj.field_invoice_title = oInfo.invoicetitle;
	obj.field_order_source = oInfo.ordersource;//oInfo.orderplatformsource;
	obj.field_shipping_contact_number = oInfo.userphone;
	obj.order_items = [];
	var order_items = obj.order_items;
	//order_items.push()
	oPros.forEach(function(item, idx){
		order_items.push({
			title: item.productname,
			quantity: item.productnum,
			unit_price: {
				number: item.totalprice,
				currency_code: "CNY"
			}
		});
	});
	obj.field_shipping = {};
	var field_shipping = obj.field_shipping;
	field_shipping.langcode = "zh-hans";
	field_shipping.country_code = "CN";
	field_shipping.administrative_area = "Shanghai Shi";
	field_shipping.locality =  "Xuhui Qu";
  field_shipping.dependent_locality =  "";
  field_shipping.postal_code =  "200032";
  field_shipping.address_line1 = "9 Zhao Jia Bang Lu, Building 8, Room 701";
  field_shipping.address_line2 =  "";
  field_shipping.organization = "INsReady";
  field_shipping.given_name = oInfo.username;
  field_shipping.family_name = "Wang";
	return obj;
}

function getUpdateObj(order){
  if (!order.orderInfo) {
    order = order.order;
  }
  var d = {},
      f = ["orderid",
          "orderstatus",
          //"cancelorderoperator",
          //"deliveryway",
          //"ischange",
          //"Isneedinvoice",
          "Invoicetitle",
          //"mealstime",
          "deliverytime",
          "receivetime",
          "returntime",
          "canceltime",
          "paytime"];
    
  for (var i in f) {
      var k = f[i];
      var v = order.orderInfo[k];
      if(v !== undefined && v !== null) {
          if(v != null && v != ""){
            if(k == "deliverytime" || k == "receivetime" || k == "returntime" ||
              k == "canceltime" || k == "paytime"){
              v = getTimeCount(v);
            }
            if(k == "orderstatus"){
              v = getStateO2N(v);
              d[updateO2N[k]] = v;
            }
            
          }
              
      }
  }
  var obj = {
    data: {
      id: order.uuid,
      attributes: d
    }
  }
  return obj;
}