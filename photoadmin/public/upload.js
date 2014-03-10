$(document).ready(function() {
  var $dropScreen = $('#drop-screen');
  var $dropTarget = $('#drop-target');
  var $thumbsList = $('#thumbs-list');
  var bucket = $dropTarget.data('bucket');

  var closeUploader = function($uploader) {
    $uploader.hide();
    $uploader.find('.file-list').empty();
  }

  var _fileTemplate = Handlebars.compile($('#file-template').text());
  var _tileTemplate = Handlebars.compile($('#tile-template').text());

  var completionCallbacks = (function() {
    var successes = [];
    var errors = [];

    var beforeAll = function(files) {
      successes = [];
      errors = [];
      _.each(files, function(file) {
        var li = _fileTemplate(file);
        $dropTarget.find('.file-list').append(li);
      });
    }
    var onComplete = function(response, xhr) {
      response = JSON.parse(response);
      var statusCode = xhr.status;
      $status = $dropTarget.find('li[data-name="'+response.filename+'"] .status');
      if (statusCode === 200) {
        $status.addClass('success').text('Uploaded successfully.');
        successes.push({name: response.filename, src: response.src})
      } else {
        $status.addClass('error').text(response.error);
        errors.push({name: response.filename, message: response.error});
      }
    }
    var onAllComplete = function() {
      console.log('all done!')
      if (errors.length === 0)
        closeUploader($dropScreen);
      _.each(successes, function(file) {
        $thumbsList.prepend(_tileTemplate(file));
      });
    }

    return {
      before: beforeAll,
      complete: onComplete,
      allComplete: onAllComplete
    }
  })();

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

  $dropTarget.uploadOnDrag({
    action: '/api/buckets/'+bucket,
    single: true,
    method: 'POST',
    params: {},

    before: completionCallbacks.before,
    progress: function(){},
    complete: completionCallbacks.complete,
    error: function(e) {
      console.error(e);
    },
    allcomplete: completionCallbacks.allComplete
  });

});
