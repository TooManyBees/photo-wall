(function(root, $) {

  var PW = root.LabsPhotoWall = (root.LabsPhotoWall || {});
  PW.loaded = true;

  var fillerRatio = function() {
    if (PW.important.length === 0) return 0;
    return  PW.filler.length / PW.important.length;
  }

  var rand = (function() {
    // Random function remembers previous returned value
    // so it won't return the same value twice.
    var lastValue = {};
    var memoRand = function(n) {
      return Math.ceil(Math.random() * n);
    }
    return function(n) {
      if (n < 1) return undefined;
      else if (n === 1) return 1;

      var newValue = memoRand(n);
      while (lastValue[n] == newValue) {
        newValue = memoRand(n);
      }
      lastValue[n] = newValue;
      return newValue;
    }
  })();

  var randomColor = function() {
    switch (rand(5)) {
    case 1:
      return "c1";
    case 2:
      return "c2";
    case 3:
      return "c3";
    case 4:
      return "c4";
    case 5:
      return "c5";
    }
  }

  var renderSingleCell = function(arr) {
    if (arr.length === 0)
      return null;
    var el = arr.splice(0,1);
    var $cell = $('<div class="cell">');
    if (el[0] !== undefined) {
      var e = el[0];
      e.color = randomColor();
      $cell.append(PW.tileTemplate(e));
    }
    return $cell;
  }

  var renderDoubleCell = function(arr) {
    if (arr.length === 0)
      return null;
    var els = arr.splice(0,2);
    var $cell = $('<div class="cell">');
    while (els.length > 0) {
      var e = els.splice(0,1)[0];
      e.color = randomColor();
      $cell.append(PW.tileTemplate(e));
    }
    return $cell;
  }

  var placeOnlyLargePhotos = function($ss, tiles) {
    $ss.append(renderSingleCell(tiles.important));
    $ss.append(renderSingleCell(tiles.important));
  }

  var placeOnlySmallPhotos = function($ss, tiles) {
    if (tiles.filler.length >= 8) {
      var i = 0;
      for (i=0; i < 4; i++) {
        $ss.append(renderDoubleCell(tiles.filler));
      }
    } else {
      while (tiles.filler.length > 0) {
        $ss.append(renderSingleCell(tiles.filler));
      }
    }
  }
  var placeMixOfPhotos = function($ss, tiles) {
    switch (rand(3)) {
      case 1:
        $ss.append(renderSingleCell(tiles.important));
        $ss.append(renderDoubleCell(tiles.filler));
        $ss.append(renderDoubleCell(tiles.filler));
        break;
      case 2:
        $ss.append(renderDoubleCell(tiles.filler));
        $ss.append(renderSingleCell(tiles.important));
        $ss.append(renderDoubleCell(tiles.filler));
        break;
      case 3:
        $ss.append(renderDoubleCell(tiles.filler));
        $ss.append(renderDoubleCell(tiles.filler));
        $ss.append(renderSingleCell(tiles.important));
        break;
    }
  }

  var setupLightboxHandlers = function($ss) {
    $ss.on('click', '.tile>a', function(event) {
      event.preventDefault();
      var $a = $(event.currentTarget);
      var $imgSrc = $(event.currentTarget).siblings('img').attr('src');
      var $lightBoxContainer = $(PW.lightboxTemplate({
        src: $imgSrc,
        lightboxSrc: ($a.data('lightboxSrc') || $imgSrc),
        url: $a.data('url'),
        caption: $a.data('caption'),
        credit: $a.data('credit')
      }));
      $ss.append($lightBoxContainer);
      adjustLightBoxCoords($lightBoxContainer.find('#lightbox-image'));
    });
    $ss.on('click', '#lightbox-film', function() {
      $('#photowall-lightbox').remove();
    });
  }

  var adjustLightBoxCoords = function($div) {
    var margin = 40;

    var wWidth = window.innerWidth;
    var wHeight = window.innerHeight;
    $div.find('img').css('max-height', wHeight - margin * 2);
    $div.find('img').css('max-width', wWidth - margin * 2);
    var iWidth = $div.find('img').width();
    var iHeight = $div.find('img').height();
    $div.css('left', (wWidth - iWidth) / 2);
    $div.css('top', (wHeight - iHeight) / 2);
  }

  PW.build = function($ss, layout) {
    $.ajax({
      url: layout.tileTemplate,
      dataType: 'html',
      success: function(data) {
        PW.tileTemplate = Handlebars.compile(data);
        PW.populateGrid($ss, layout.tiles);
      }
    })
    $.ajax({
      url: layout.lightboxTemplate,
      dataType: 'html',
      success: function(data) {
        PW.lightboxTemplate = Handlebars.compile(data);
        PW.populateGrid($ss, layout.tiles);
      }
    })
  }

  PW.populateGrid = function($ss, tiles) {
    if (PW.lightboxTemplate && PW.tileTemplate) {
      var processed = preprocess(tiles);
      $ss.addClass('ready');
      if (processed.filler && processed.important)
        while (processed.important.length > 0 && processed.filler.length >= 4) placeMixOfPhotos($ss, processed);
      if (processed.important)
        while (processed.important.length > 0) placeOnlyLargePhotos($ss, processed);
      if (processed.filler)
        while (processed.filler.length > 0) placeOnlySmallPhotos($ss, processed);
    }
  }

  var preprocess = function(tiles) {
    _.each(tiles, function(el) {
      if (el.caption) {
        var split = el.caption.split(' ');
        if (split.length > 10)
          el.snippet = split.slice(0, 10).join(" ") + "...";
        else
          el.snippet = el.caption
      }
      if (el.large !== true) {
        el.dimX = el.dimX / 2;
        el.dimY = el.dimY / 2;
      }
      // cached the lightbox preview
      // TODO: move this to a scroll handler on the page, to only fetch
      // visible lb pics
      if (el.lightboxSrc) {
        var prefetched = new Image();
        prefetched.src = el.lightboxSrc;
      }
    });
    var _pictures = _.groupBy(tiles, function(el) {
      return (el.large === true) ? 'large' : 'small';
    });

    _pictures.large || (_pictures.large = []);
    _pictures.small || (_pictures.small = []);

    var sorted = {
      important: _pictures.large.sort(function(first, second) {
        return parseInt(first.importance) < parseInt(second.importance);
      }),
      filler: _pictures.small.sort(function(first, second) {
        return parseInt(first.importance) < parseInt(second.importance);
      })
    }
    return sorted;
  }

}(this, jQuery));
