(function(root) {

  var PW = root.LabsPhotoWall = (root.LabsPhotoWall || {});

  var fillerRatio = function() {
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

  PW.renderSingleCell = function(arr) {
    var el = arr.splice(0,1);
    var $cell = $('<div class="cell">');
    if (el[0] !== undefined) {
      var e = el[0];
      e.color = randomColor();
      $cell.append(PW.tileTemplate(e));
    }
    return $cell;
  }

  PW.renderDoubleCell = function(arr) {
    var els = arr.splice(0,2);
    var $cell = $('<div class="cell">');
    while (els.length > 0) {
      var e = els.splice(0,1)[0];
      e.color = randomColor();
      $cell.append(PW.tileTemplate(e));
    }
    return $cell;
  }

  var placeOnlyLargePhotos = function() {
    PW.$ss.append(PW.renderSingleCell(PW.important));
    PW.$ss.append(PW.renderSingleCell(PW.important));
  }

  var placeOnlySmallPhotos = function() {
    if (PW.filler.length >= 8) {
      var i = 0;
      for (i=0; i < 4; i++) {
        PW.$ss.append(PW.renderDoubleCell(PW.filler));
      }
    } else {
      while (PW.filler.length > 0) {
        PW.$ss.append(PW.renderSingleCell(PW.filler));
      }
    }
  }
  var placeMixOfPhotos = function() {
    switch (rand(3)) {
      case 1:
        PW.$ss.append(PW.renderSingleCell(PW.important));
        PW.$ss.append(PW.renderDoubleCell(PW.filler));
        PW.$ss.append(PW.renderDoubleCell(PW.filler));
        break;
      case 2:
        PW.$ss.append(PW.renderDoubleCell(PW.filler));
        PW.$ss.append(PW.renderSingleCell(PW.important));
        PW.$ss.append(PW.renderDoubleCell(PW.filler));
        break;
      case 3:
        PW.$ss.append(PW.renderDoubleCell(PW.filler));
        PW.$ss.append(PW.renderDoubleCell(PW.filler));
        PW.$ss.append(PW.renderSingleCell(PW.important));
        break;
    }
  }

  PW.populateGrid = function() {
    while (fillerRatio() > 4) placeOnlyLargePhotos();
    while (PW.important.length > 0) placeMixOfPhotos();
    while (PW.filler.length > 0) placeOnlySmallPhotos();
  }

  PW.initialize = function(options) {
    console.log('Fetching wall from '+ options.json);
    $.getJSON(options.json, function(json) {
      PW.$ss = options.$section;
      PW.tileTemplate = Handlebars.compile(options.$template.html());
      var _pictures = _.groupBy(json, function(el) {
        return (el.importance > 0) ? 'large' : 'small';
      });

      PW.important = _pictures.large.sort(function(first, second) {
        return parseInt(first.importance) < parseInt(second.importance);
      });
      PW.filler = _pictures.small;

      PW.populateGrid();
    });
  }

}(this));
