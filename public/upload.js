$(document).ready(function() {

  $('#drop-target').uploadOnDrag({
    "action": '',
    "single": false,
    "method": 'POST',
    "params": {},

    "before": function(options){},
    "progress": function() {},
    "allcomplete": function() {}
  });
});
