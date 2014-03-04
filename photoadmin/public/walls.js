$(document).ready(function() {

  _liTemplate = Handlebars.compile($('#list-template').text());

  $('.show-layouts').on('click', function(event) {
    event.preventDefault();
    $(this).parents('li').removeClass('collapsed');
  });

  $('.hide-layouts').on('click', function(event) {
    event.preventDefault();
    $(this).parents('li').addClass('collapsed');
  });

  $('#new-bucket').on('submit', function(event) {
    event.preventDefault();
    $input = $(this).find('input[name=bucket]');
    $status = $(this).find('.status');
    $.ajax({
      url: $(this).attr('action'),
      type: $(this).attr('method'),
      dataType: "json",
      data: {
        bucket: $input.val()
      },
      beforeSend: function(data) {
        $status.text("");
      },
      success: function(data) {
        $('#bucket-list').prepend(_liTemplate(data));
        $input.val("");
      },
      error: function(data) {
        $status.text(data.responseJSON.error);
      }
    })
  })

});
