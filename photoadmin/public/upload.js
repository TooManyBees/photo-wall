$(document).ready(function() {
  var $dropScreen = $('#drop-screen');
  var $dropTarget = $('#drop-target');

  $('#click-to-upload').on('click', function() {
    $dropScreen.show();
  });

  $('#hide-upload').on('click', function() {
    $dropScreen.hide();
  });
  $dropScreen.on('click', function() {
    $dropScreen.hide();
  });
  $dropTarget.on('click', function(e) {
    e.originalEvent.stopPropagation();
  })

  var _fileTemplate = Handlebars.compile($('#file-template').text());
});
