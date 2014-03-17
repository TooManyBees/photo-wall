(function(root, $) {

  var defaultVersion = 3;
  var defaultSelector = ".photowall-container";
  var staticUrl = "https://photo-wall-static.s3.amazonaws.com/";

  var PW = root.LabsPhotoWall = (root.LabsPhotoWall || {});

  var versionedUrl = function(version, resource) {
    // TODO: remove this hack:
    return resource;

    var base = staticUrl + "v" + version + "/";
    if (resource !== undefined)
      return base + resource;
    else
      return base;
  }

  var searchSeeds = function(selector) {
    var $seeds = $(selector);
    var walls = [];
    $seeds.each(function() {
      var $seed = $(this);
      var layout = $seed.data('layout');
      var id = layout.substring(layout.lastIndexOf('/')+1).split('.json')[0];
      $seed.attr('id', id);
      $seed.append('<div class="spinner">');
      walls.push({
        id: id,
        element: $seed,
        layout: layout
      });
    });
    return walls;
  }

  PW.bootstrap = function(options) {
    loadDependencies();
    var version = (options.version || defaultVersion);
    var selector = (options.selector || defaultSelector);
    PW.walls = searchSeeds(selector);
    $.ajax({
      url: versionedUrl(version, "photowall.js"),
      dataType: 'script',
      cache: true,
      success: initialize
    });
  }

  var dependenciesLoaded = function() {
    if (window._ === undefined || _.VERSION === undefined) {
      return false;
    }
    if (window.Handlebars === undefined) {
      return false;
    }
    if (PW.loaded != true) {
      return false;
    }
    return true;
  }

  var initialize = function() {
    if (dependenciesLoaded()) {
      _.each(PW.walls, function(wall) {
        $.getJSON(wall.layout, function(layout) {
          var $ss = $('#'+wall.id);
          PW.build($ss, layout);
        });
      });
    }
  }

  var loadDependencies = function() {
    // assume that the page loads jQuery anyway
    if (window._ === undefined || _.VERSION === undefined) {
      $.ajax({
        url: 'http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.5.2/underscore-min.js',
        dataType: 'script',
        cache: true,
        success: initialize
      });
    }
    if (window.Handlebars === undefined) {
      $.ajax({
        url: 'http://cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.3.0/handlebars.min.js',
        dataType: 'script',
        cache: true,
        success: initialize
      });
    }
  }

}(this, jQuery));

$(document).one('ready', function() {
  LabsPhotoWall.bootstrap({version: 3})
});
