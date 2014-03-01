$(document).ready(function() {
  var listTemplate = Handlebars.compile($('#list-template').text());

  var getImagesFromBucket = function(bucket) {
    $.ajax({
      url: '/api/bucket/'+bucket,
      dataType: 'json',
      success: function(data, status) {
        populateImageList(data);
      }
    });
  }

  var populateImageList = function(images) {
    $ul = $('#image-list');
    $ul.empty();
    $ul.append('<p>Check photos as "Important" to make them appear large.</p>');
    _.each(images, function(image) {
      $ul.append(listTemplate({"path": image}));
    });
  }

  $('#bucket-selector').on('change', function() {
    var bucket = $(this).val();
    if (bucket !== "") getImagesFromBucket(bucket);
    else $('#image-list').empty();
  })
});
