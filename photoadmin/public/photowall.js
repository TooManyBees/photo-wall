(function(root, $) {

  var PW = root.LabsPhotoWall = (root.LabsPhotoWall || {});
  PW.loaded = true;
  PW.templates = {};
  PW.stylesheets = {};

  PW.build = function(wall) {
    console.log("Fetching wall from "+wall.layout);
    $.getJSON(wall.layout, function(layout) {

      var stylesheetSrc = (layout.stylesheetSrc || PW.versionedUrl('photowall.css'));
      var tileTemplateSrc = (layout.tileTemplateSrc || PW.versionedUrl("template-photowall-tile.html"));
      var lightboxTemplateSrc = (layout.lightboxTemplateSrc || PW.versionedUrl("template-photowall-lightbox.html"));

      appendStylesheet(stylesheetSrc);

      if (PW.templates[tileTemplateSrc] === undefined) {
        console.log("Fetching template "+tileTemplateSrc);
        $.ajax({
          url: tileTemplateSrc,
          dataType: 'html',
          cache: true,
          success: function(data) {
            PW.templates[tileTemplateSrc] = Handlebars.compile(data);
            populateGrid(wall.element, layout.tiles, tileTemplateSrc);
          }
        });
      } else {
        console.log("Using cached template "+tileTemplateSrc);
        populateGrid(wall.element, layout.tiles, tileTemplateSrc);
      }

      if (PW.templates[lightboxTemplateSrc] === undefined) {
        console.log("Fetching template "+lightboxTemplateSrc);
        $.ajax({
          url: lightboxTemplateSrc,
          dataType: 'html',
          cache: true,
          success: function(data) {
            PW.templates[lightboxTemplateSrc] = Handlebars.compile(data);
            setupLightboxHandlers(wall.element, lightboxTemplateSrc);
          }
        });
      } else {
        console.log("Using cached template "+lightboxTemplateSrc);
        setupLightboxHandlers(wall.element, lightboxTemplateSrc);
      }
    }); // End $.getJSON()
  }

  var appendStylesheet = function(stylesheetSrc) {
    if (PW.stylesheets[stylesheetSrc] === undefined) {
      console.log("Appending stylesheet "+stylesheetSrc);
      PW.stylesheets[stylesheetSrc] = true;
      $('<link rel="stylesheet" type="text/css">')
        .attr('href', stylesheetSrc)
        .appendTo('head');
    } else {
      console.log("Reusing stylesheet "+stylesheetSrc);
    }
  }

  var populateGrid = function($ss, tiles, templateSrc) {
    if (templateSrc) {
      var processed = preprocess(tiles);
      $ss.addClass('ready'); // Removes the spinner animation

      // To keep layout intact, arranges large and small images appropriately based
      // on what images haven't been placed yet.
      if (processed.filler && processed.important)
        while (processed.important.length > 0 && processed.filler.length >= 4) placeMixOfPhotos($ss, processed, templateSrc);
      if (processed.important)
        while (processed.important.length > 0) placeOnlyLargePhotos($ss, processed, templateSrc);
      if (processed.filler)
        while (processed.filler.length > 0) placeOnlySmallPhotos($ss, processed, templateSrc);
    }
  }

  /*
   * Takes an array of objects, returns an object of two arrays:
   *   one for large images, another for small images, both sorted by importance
   */
  var preprocess = function(tiles) {
    var important_tiles = new Array();
    var filler_tiles = new Array();

    var i = 0;
    for (i; i < tiles.length; i++) {
      var el = tiles[i];
      if (el.caption) {
        var split = el.caption.split(' ');
        if (split.length > 10)
          el.snippet = split.slice(0, 10).join(" ") + "...";
        else
          el.snippet = el.caption
      }

      // cache the lightbox preview
      // TODO: move this to a scroll handler on the page
      if (el.useLightbox && el.lightboxSrc) {
        var prefetched = new Image();
        prefetched.src = el.lightboxSrc;
      }

      if (el.importance === undefined)
        el.importance = -Infinity;

      if (el.large === true){
        el.i = important_tiles.length;
        important_tiles.push(el);
      }
      else {
        el.i = filler_tiles.length;
        filler_tiles.push(el);
      }
    }

    return {
      important: important_tiles.sort(byImportance),
      filler: filler_tiles.sort(byImportance)
    };
  }

  /*
   * Functions for placing photos onto the grid
   */

  var renderSingleCell = function(arr, templateSrc) {
    if (arr.length === 0)
      return null;
    var el = arr.splice(0,1);
    var $cell = $('<div class="cell">');
    if (el[0] !== undefined) {
      var e = el[0];
      e.color = randomColor();
      $cell.append(PW.templates[templateSrc](e));
    }
    return $cell;
  }

  var renderDoubleCell = function(arr, templateSrc) {
    if (arr.length === 0)
      return null;
    var els = arr.splice(0,2);
    var $cell = $('<div class="cell">');
    while (els.length > 0) {
      var e = els.splice(0,1)[0];
      e.color = randomColor();
      $cell.append(PW.templates[templateSrc](e));
    }
    return $cell;
  }

  var placeOnlyLargePhotos = function($ss, tiles, templateSrc) {
    $ss.append(renderSingleCell(tiles.important, templateSrc));
    $ss.append(renderSingleCell(tiles.important, templateSrc));
  }

  var placeOnlySmallPhotos = function($ss, tiles, templateSrc) {
    if (tiles.filler.length >= 8) {
      var i = 0;
      for (i=0; i < 4; i++) {
        $ss.append(renderDoubleCell(tiles.filler, templateSrc));
      }
    } else {
      while (tiles.filler.length > 0) {
        $ss.append(renderSingleCell(tiles.filler, templateSrc));
      }
    }
  }

  var placeMixOfPhotos = function($ss, tiles, templateSrc) {
    switch (rand(3)) {
      case 1:
        $ss.append(renderSingleCell(tiles.important, templateSrc));
        $ss.append(renderDoubleCell(tiles.filler, templateSrc));
        $ss.append(renderDoubleCell(tiles.filler, templateSrc));
        break;
      case 2:
        $ss.append(renderDoubleCell(tiles.filler, templateSrc));
        $ss.append(renderSingleCell(tiles.important, templateSrc));
        $ss.append(renderDoubleCell(tiles.filler, templateSrc));
        break;
      case 3:
        $ss.append(renderDoubleCell(tiles.filler, templateSrc));
        $ss.append(renderDoubleCell(tiles.filler, templateSrc));
        $ss.append(renderSingleCell(tiles.important, templateSrc));
        break;
    }
  }

  var setupLightboxHandlers = function($ss, templateSrc) {
    $ss.on('click', '.lb', function(event) {
      event.preventDefault();
      var $a = $(event.currentTarget);
      var $imgSrc = $(event.currentTarget).siblings('img').attr('src');
      var $lightBoxContainer = $(PW.templates[templateSrc]({
        src: $imgSrc,
        lightboxSrc: ($a.data('lightboxSrc') || $imgSrc),
        url: $a.data('url'),
        caption: $a.data('caption'),
        credit: $a.data('credit')
      }));
      $ss.append($lightBoxContainer);
      adjustLightBoxCoords($lightBoxContainer.find('#lightbox-image'));
    });
    $ss.on('click', '#photowall-lightbox', function() {
      if ($(event.target).attr('href') !== undefined)
        event.stopPropagation
      $('#photowall-lightbox').remove();
    });
  }

  var adjustLightBoxCoords = function($div) {
    var margin = 20;
    var $img = $div.find('img');

    var wWidth = window.innerWidth;
    var wHeight = window.innerHeight;
    $img.css('max-height', wHeight - margin * 2);
    $img.css('max-width', wWidth - margin * 2);
    var iWidth = $img.width();
    var iHeight = $img.height();
    $div.css('left', (wWidth - iWidth) / 2);
    $div.css('top', (wHeight - iHeight) / 2);
  }

  /*
   * Helper functions follow
   */

  var byImportance = function(first, second) {
    // Sort first by importance. In case of a tie, sort by original order (saved as 'i')
    var diff = second.importance - first.importance;
    if (diff === 0 || isNaN(diff))
      return first.i - second.i;
    else
      return diff;
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
    // c1-5 are css class names
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

}(this, jQuery));
