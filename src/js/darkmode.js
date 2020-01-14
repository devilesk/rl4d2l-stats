

$('.darkmode-toggle input').on('change',function(){
  $('body').toggleClass('darkmode');
  if($('body').hasClass('darkmode')){
    localStorage.setItem('Darkmode', true);
  }
  else{
    localStorage.removeItem('Darkmode');
  }
});

$(function() {
  if(localStorage.getItem('Darkmode')){
    $('body').toggleClass('darkmode');
    $('.darkmode-toggle input').attr('checked','checked')
  }
});
