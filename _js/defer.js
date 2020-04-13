window.onload = function () {
  setTimeout(function () {
    load(document.getElementsByTagName('iframe'));
    load(document.getElementsByTagName('script'));
  }, 2000);

  function load(items) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].getAttribute('data-src')) {
        items[i].setAttribute('src', items[i].getAttribute('data-src'));
        items[i].className = items[i].className.replace('hide', '');
      }
    }
  }
};
