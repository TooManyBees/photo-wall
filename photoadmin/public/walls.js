$(document).ready(function() {

  $('.show-layouts').on('click', function(event) {
    event.preventDefault();
    $(this).parents('li').removeClass('collapsed');
  });

  $('.hide-layouts').on('click', function(event) {
    event.preventDefault();
    $(this).parents('li').addClass('collapsed');
  });

});
