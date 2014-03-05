$(document).ready(function() {
  var $images = $('#image-list ul');
  var $form = $('#build-form');
  var $output = $('#build-output iframe').contents().find('body');
  var currentBucket = $('#bucket-name').text();

  $images.find('img').each(function() {
    var $img = $(this);
    var height = $img.height();
    var width = $img.width();
    if (height / width === 1) {
      $img.addClass('tall');
      $img.parent().find('.controls').hide();
      $img.parent().find('input[name=dim]').val('tall');
    } else if (height / width > 1) {
      $img.addClass('tall');
      $img.parent().find('.horizontal').hide();
      $img.parent().find('input[name=dim]').val('tall');
    } else {
      $img.addClass('wide');
      $img.parent().find('.vertical').hide();
      $img.parent().find('input[name=dim]').val('wide');
    }
  });

  var serializeImages = function($ul) {
    var serialized = [];
    var $li = $ul.find('li');
    $li.each(function() {
      var $inputs = $(this).find('input');
      var obj = {};
      $inputs.each(function() {
        var $input = $(this);
        if ($input.val() !== "")
          obj[$input.prop('name')] = $input.val();
        else if ($input.prop('checked') === true)
          obj[$input.prop('name')] = true;
      });
      if (obj['skip'] !== true)
        serialized.push(obj);
    });
    return serialized;
  }

  $form.on("submit", function(event) {
    event.preventDefault();
    var serialized = serializeImages($images);
    _.each(serialized, function(img) {
      if (img.large !== true) {
        img.dimX = img.dimX / 2;
        img.dimY = img.dimY / 2;
      }
    });
    var generatedJSON = JSON.stringify(serialized, null, "  ");
    var $pre = $('<pre>').text(generatedJSON);
    $output.empty();
    $output.append($pre);
    $('#build-output').removeClass('off');

    $.ajax({
      url: $(this).attr('action'),
      dataType: 'json',
      type: 'POST',
      data: {
        json: generatedJSON
      },
      success: function(data) {
        $('#saved-url').text(data.url).attr('href', "/test/?src="+data.url);
      }
    })
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

    $border.css('left', parseInt($border.css('left')) + offsetX);
    $border.css('top', parseInt($border.css('top')) + offsetY);
    $inputX.val(parseInt($inputX.val()) - offsetX);
    $inputY.val(parseInt($inputY.val()) - offsetY);
  }

});
