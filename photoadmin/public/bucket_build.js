(function(root, $) {

  var Builder = root.Builder = (root.Builder || {});

  var resizeImage = function($img) {
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
  }

  Builder.setup = function() {
    var $images = $('#image-list ul');
    var $form = $('#build-form');
    var $output = $('#build-output iframe').contents().find('body');

    $images.find('img').each(function() {
      var $img = $(this);
      if ($img[0].complete)
        resizeImage($img);
      else
        $img.on('load', function() {
          resizeImage($img);
        });
    });

    $form.on("submit", function(event) {
      event.preventDefault();
      var serialized = {tiles: serializeImages($images)};
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
      nudgeBorder($(this).parents('li'), {x: $control.data('x'), y: $control.data('y')})
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
        if ($input.attr('type') === 'checkbox') {
          if ($input.prop('checked') === true)
            obj[$input.prop('name')] = true;
        } else {
          if ($input.val() !== "")
            obj[$input.prop('name')] = $input.val();
        }
      });
      if (obj['show'] === true) {
        delete obj['show'];
        serialized.push(obj);
      }
    });
    return serialized;
  }

  var nudgeBorder = function($thisVal, offset) {
    var $border = $thisVal.find('.border');
    var $inputX = $thisVal.find('input[name=dimX]');
    var $inputY = $thisVal.find('input[name=dimY]');
    var $offsetX = $thisVal.find('input[name=offsetX]');
    var $offsetY = $thisVal.find('input[name=offsetY]');
    var offsetX = parseInt(offset.x || 0);
    var offsetY = parseInt(offset.y || 0);

    $inputX.val(parseInt($inputX.val()) + offsetX);
    $inputY.val(parseInt($inputY.val()) + offsetY);

    var pctX = "" + 100 * $inputX.val() / $border.width();
    var pctY = "" + 100 * $inputY.val() / $border.height();

    $offsetX.val(pctX.slice(0,6));
    $offsetY.val(pctY.slice(0,6));

    shiftBorder($border, $inputX.val(), $inputY.val());
  }

  var shiftBorder = function($border, offsetX, offsetY) {
    $border.css('left', offsetX * -1);
    $border.css('top', offsetY * -1);
  }

  Builder.matchBorderToInputValues = function($images) {
    $images.each(function() {
      var offsetX = parseInt($(this).find('input[name=dimX]').val());
      var offsetY = parseInt($(this).find('input[name=dimY]').val());
      shiftBorder($(this).find('.border'), offsetX, offsetY);
    });
  }

}(this, jQuery));
