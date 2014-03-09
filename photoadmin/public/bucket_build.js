(function(root, $) {

  var Builder = root.Builder = (root.Builder || {});

  Builder.setup = function() {
    var $images = $('#image-list ul');
    var $form = $('#build-form');
    var $output = $('#build-output iframe').contents().find('body');

    $images.find('img').each(function() {
      var $img = $(this);
      $img.on('load', function() {
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
    });

    $form.on("submit", function(event) {
      event.preventDefault();
      var serialized = serializeImages($images);
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
    });

    $images.on('click', '.controls', function() {
      var $control = $(this);
      var $border = $(this).parent();
      applyOffset($(this).parents('li'), {x: $control.data('x'), y: $control.data('y')})
    });
  }

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

  var applyOffset = function(thisVal, offset) {
    var $border = thisVal.find('.border');
    var $inputX = thisVal.find('input[name=dimX]');
    var $inputY = thisVal.find('input[name=dimY]');
    var offsetX = parseInt(offset.x || 0);
    var offsetY = parseInt(offset.y || 0);

    $inputX.val(parseInt($inputX.val()) + offsetX);
    $inputY.val(parseInt($inputY.val()) + offsetY);

    shiftBorder($border, offsetX, offsetY);
  }

  var shiftBorder = function($border, offsetX, offsetY) {
    $border.css('left', parseInt($border.css('left')) - offsetX);
    $border.css('top', parseInt($border.css('top')) - offsetY);
  }

  Builder.matchBorderToInputValues = function($li) {
    var offsetX = parseInt($li.find('input[name=dimX]').val());
    var offsetY = parseInt($li.find('input[name=dimY]').val());
    shiftBorder($li.find('.border'), offsetX, offsetY);
  }

}(this, jQuery));
