$(document).ready(function() {
  var $dropScreen = $('#drop-screen');
  var $dropTarget = $('#drop-target');
  var bucket = $dropTarget.data('bucket');

  $('#click-to-upload').on('click', function() {
    $dropScreen.show();
  });

  $('#hide-upload').on('click', function() {
    closeUploader($dropScreen);
  });
  $dropScreen.on('click', function() {
    $dropScreen.hide();
  });
  $dropTarget.on('click', function(e) {
    e.stopPropagation();
  });

  var _fileTemplate = Handlebars.compile($('#file-template').text());

  $dropTarget.uploadOnDrag({
    action: '/api/buckets/'+bucket,
    single: true,
    method: 'POST',
    params: {},

    before: function(files) {
      _.each(files, function(file) {
        var $li = $('<li class="file-name">')
          .text(file.name)
          .attr('data-name', file.name)
          .append('<span class="status">');
        $dropTarget.find('.file-list').append($li);
      });
    },
    progress: function(){},
    complete: function(response, xhr) {
      response = JSON.parse(response);

      var statusCode = xhr.status;

      $status = $dropTarget.find('li[data-name="'+response.filename+'"] .status');
      if (statusCode === 200) {
        $status.addClass('success').text('Uploaded successfully.');
      } else {
        $status.addClass('error').text(response.error);
      }
    },
    error: function(e) {
      console.log("ERROR!");
      console.log(e);
    },
    allcomplete: function(){
      // closeUploader($dropScreen);
      // populate the image grid with newly uploaded pics
    }
  });

  var closeUploader = function($uploader) {
    $uploader.hide();
    $uploader.find('.file-list').empty();
  }

});
