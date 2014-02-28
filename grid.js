var tileTemplate = Handlebars.compile($('#template-tile').html());

var kittehs = $.parseJSON($('#pictures').text());

var _arrays = _.partition(kittehs, function(kitteh) {
  return kitteh.importance > 0;
});

var important = _arrays[0], filler = _arrays[1];
important.sort(function(firstKitteh, secondKitteh) {
  return firstKitteh.importance < secondKitteh.importance;
});

var fillerRatio = function() {
  return  filler.length / important.length;
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
  var el = arr.splice(0,1);
  var $cell = $('<div class="cell">');
  if (el[0] !== undefined) {
    var e = el[0];
    e.color = randomColor();
    $cell.append(tileTemplate(e));
  }
  return $cell;
}

var renderDoubleCell = function(arr) {
  var els = arr.splice(0,2);
  var $cell = $('<div class="cell">');
  while (els.length > 0) {
    var e = els.splice(0,1)[0];
    e.color = randomColor();
    $cell.append(tileTemplate(e));
  }
  return $cell;
}

var placeOnlyLargePhotos = function() {
  var $ss = $('#grid-container');
  $ss.append(renderSingleCell(important));
  $ss.append(renderSingleCell(important));
}

var placeOnlySmallPhotos = function() {
  var $ss = $('#grid-container');
  if (filler.length >= 8) {
    var i = 0;
    for (i=0; i < 4; i++) {
      $ss.append(renderDoubleCell(filler));
    }
  } else {
    while (filler.length > 0) {
      $ss.append(renderSingleCell(filler));
    }
  }
}
var placeMixOfPhotos = function() {
  var $ss = $('#grid-container');
  switch (rand(3)) {
    case 1:
      $ss.append(renderSingleCell(important));
      $ss.append(renderDoubleCell(filler));
      $ss.append(renderDoubleCell(filler));
      break;
    case 2:
      $ss.append(renderDoubleCell(filler));
      $ss.append(renderSingleCell(important));
      $ss.append(renderDoubleCell(filler));
      break;
    case 3:
      $ss.append(renderDoubleCell(filler));
      $ss.append(renderDoubleCell(filler));
      $ss.append(renderSingleCell(important));
      break;
  }
}

var populateGrid = function() {
  while (fillerRatio() > 4) placeOnlyLargePhotos();
  while (important.length > 0) placeMixOfPhotos();
  while (filler.length > 0) placeOnlySmallPhotos();
}
