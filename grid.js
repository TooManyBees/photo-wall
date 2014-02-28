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

var i = 0; // Index of Important pictures
var lenImportant = important.length;
var j = 0; // Index of Filler pictures
var lenFiller = filler.length;

var fillerRatio = function() {
  return  (lenFiller - j) / (lenImportant - i);
}

var rand = function() {
  return Math.ceil(Math.random() * 3);
}

var renderSingleCell = function(pic) {
  var $cell = $('<div class="cell">');
  $cell.append(tileTemplate(pic));
  return $cell;
}

var renderDoubleCell = function(pic1, pic2) {
  var $cell = $('<div class="cell">');
  $cell.append(tileTemplate(pic1));
  $cell.append(tileTemplate(pic2));
  return $cell;
}

// while (fillerRatio() > 4) {
var testItOut = function() {
  var $ss = $('#grid-container');
  switch (rand()) {
    case 1:
      $ss.append(renderSingleCell(important[0]));
      $ss.append(renderDoubleCell(filler[0], filler[1]));
      $ss.append(renderDoubleCell(filler[0], filler[1]));
      break;
    case 2:
      $ss.append(renderDoubleCell(filler[0], filler[1]));
      $ss.append(renderSingleCell(important[0]));
      $ss.append(renderDoubleCell(filler[0], filler[1]));
      break;
    case 3:
      $ss.append(renderDoubleCell(filler[0], filler[1]));
      $ss.append(renderDoubleCell(filler[0], filler[1]));
      $ss.append(renderSingleCell(important[0]));
      break;
    default:
      console.log("ffffuuuuuuuuu!!")
  }
}
