$(document).ready(function() {
  var listTemplate = Handlebars.compile($('#list-template').text());

  var $selector = $('#bucket-selector');
  var $images = $('#image-list ul');
  var $build = $('#builder');
  var $button = $('#build-button');
  var $output = $('#build-output iframe').contents().find('body');

  var sizeImages = function(images) {
    $(images).each(function() {
      var $img = $(this);
      $img.on('load', function() {
        var height = $img.height();
        var width = $img.width();
        if (height / width > 1) {
          $img.addClass('tall')
          $img.parent().find('input[name=dim]').val('tall');
        } else {
          $img.addClass('wide')
          $img.parent().find('input[name=dim]').val('wide');
        }
      });
    });
  }

  var getImagesFromBucket = function(bucket) {
    var $imgLi = $('#image-list');
    $.ajax({
      url: '/api/bucket/'+bucket,
      dataType: 'json',
      beforeSend: function() {
        $images.empty();
        $imgLi.addClass('working');
        $selector.prop('disabled', true);
      },
      success: function(data) {
        populateImageList(data);
        $build.addClass('show');
      },
      complete: function() {
        $imgLi.removeClass('working');
        $selector.prop('disabled', false);
      }
    });
  }

  var populateImageList = function(images) {
    _.each(images, function(image) {
      $images.append(listTemplate({"path": image}));
    });
    // This has issues if it executes before the images are loaded
    sizeImages($images.find('img'));
  }

  var serializeImages = function($ul) {
    var serialized = [];
    var $li = $ul.find('li');
    $li.each(function() {
      var $inputs = $(this).find('input');
      var obj = {};
      $inputs.each(function() {
        if ($(this).val() !== "")
        obj[$(this).prop('name')] = $(this).val();
      });
      serialized.push(obj);
    });
    return serialized;
  }

  $selector.on('change', function() {
    var bucket = $selector.val();
    if (bucket !== "") {
      getImagesFromBucket(bucket);
    } else {
      $images.empty();
      $build.removeClass('show');
    }
  });

  $button.on("click", function() {
    $(this).prop('disabled', true).text("Building...");
    var $pre = $('<pre>').text(
      JSON.stringify(
        serializeImages($images),
        null,
        "  "
      )
    );
    $output.empty();
    $output.append($pre);
    $(this).prop('disabled', false).text("Build JSON!");
  }); // end $button.on

  $images.on('click', '.controls', function() {
    var $control = $(this);
    var $border = $(this).parent();
    shiftBorder($border, {x: $control.data('x'), y: $control.data('y')})
  });

  var shiftBorder = function($border, offset) {
    var $inputX = $border.parent().find('input[name=dimX]');
    var $inputY = $border.parent().find('input[name=dimY]');
    var offsetX = (offset.x || 0);
    var offsetY = (offset.y || 0);

    $border.css('left', offsetX + parseInt($border.css('left')));
    $border.css('top', offsetY + parseInt($border.css('top')));
    $inputX.val(offsetX + parseInt($inputX.val()));
    $inputY.val(offsetY + parseInt($inputY.val()));
  }

});
