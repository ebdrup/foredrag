$('#videoImage').click(playVideo);
$('#playButton').click(playVideo);
$('#videoImage2').click(playVideo2);
$('#playButton2').click(playVideo2);
var playdone = false;
var playdone2 = false;

function playVideo() {
  if (playdone) {
    return;
  }
  $('#ytapiplayer2').append(
    '<iframe width="640" height="359" src="https://www.youtube.com/embed/pZ--Tkbop40?autoplay=1" ' +
      'frameborder="0" allowfullscreen></iframe>',
  );
  $('#videoImageContainer').fadeOut(1000);
  $('#playButtonContainer').fadeOut(1000);
  playdone = true;
}

function playVideo2() {
  if (playdone2) {
    return;
  }
  $('#ytapiplayer2-2').append(
    '<iframe width="640" height="359" src="https://www.youtube.com/embed/ULpFUq4kV4I?autoplay=1" ' +
      'frameborder="0" allowfullscreen></iframe>',
  );
  $('#videoImageContainer2').fadeOut(1000);
  $('#playButtonContainer2').fadeOut(1000);
  playdone2 = true;
}
