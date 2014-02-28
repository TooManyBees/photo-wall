var tileTemplate = Handlebars.compile($('#template-tile').html());

var kittehs = $.parseJSON($('#pictures').text());

var important = _.filter(kittehs, function(kitteh) {
  return kitteh.importance > 0;
}).sort(function(firstKitteh, secondKitteh) {
  return firstKitteh.importance < secondKitteh.importance;
})

var filler = _.filter(kittehs, function(kitteh) {
  return kitteh.importance === undefined;
})

var fillerRatio = function() {
  return  filler.length / important.length;
}

var rand = function() {
  return Math.ceil(Math.random() * 3);
}

var renderSingleCell = function(arr) {
  var el = arr.splice(0,1);
  var $cell = $('<div class="cell">');
  $cell.append(tileTemplate(el[0]));
  return $cell;
}

var renderDoubleCell = function(arr) {
  var els = arr.splice(0,2);
  var $cell = $('<div class="cell">');
  $cell.append(tileTemplate(els[0]))
  $cell.append(tileTemplate(els[1]))
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
  switch (rand()) {
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
    default:
      console.log("ffffuuuuuuuuu!!")
  }
}
