'use strict';
function getTimeCount(t){
	if(t == null || t == "") return null;
	return Math.floor((new Date(t)).getTime()/1000);
}

var OCStatesNum = {
  draft: 0,
  fulfillment: 1,
  wait_for_buyer_to_pay: 2,
  buyer_has_paid: 3,
  preparing: 4,
  ready: 5,
  delivering: 6,
  completed: 7,
  canceled: 8,
  returned: 9
};

function getNameByNum(s){
	if(typeof(s) === 'string'){
		for(var i in OCStatesNum){
			if(i == s){
				return i;
			}
		}
	}
	for(var i in OCStatesNum){
		if(OCStatesNum[i] == s){
			return i;
		}
	}
	return "draft";
}

function getNumByName(n){
	var partern = /^[0-9]+$/;
	if(partern.test(n)){
		return n
	}else{
		if(n < OCStatesNum.draft || n > OCStatesNum.returned){
			n = 0;
		}
		return OCStatesNum[n];
	}
}

//新的堂食，自助POS订单数据结构。
function getUpdateObjNew(order){
	var d = {},
			f = [
				"placed",
				"completed",
				"field_canceled",
				"field_delivering_time",
				"field_delivered",
				"field_payment_received",
				"field_returned",
				"state"
			];
	for (var i in f) {
    var k = f[i];
    var v = order[k];
    if(v !== undefined && v !== null && v != "") {
      if(k == "state"){
        v = getNameByNum(v);
      }
      d[k] = v;
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