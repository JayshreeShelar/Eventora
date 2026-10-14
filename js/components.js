/* EVENTORA — loads the shared header and footer into every page.
   Uses fetch(), so open the site through a local server (VS Code Live Server),
   not directly via file://. */
(function () {
  'use strict';

  var COMPONENTS = [
    { id: 'header-placeholder', url: 'components/header.html', init: 'initHeader', label: 'header' },
    { id: 'footer-placeholder', url: 'components/footer.html', init: 'initFooter', label: 'footer' }
  ];

  function errorMarkup(component) {
    var onFile = window.location.protocol === 'file:';
    var reason = onFile
      ? 'This page is opened directly from your files (file://), which blocks loading shared components. Launch the site with VS Code Live Server (right-click index.html, then "Open with Live Server").'
      : 'The ' + component.label + ' could not be loaded from <code>' + component.url + '</code>. Check that the file exists and the site is served from the project root.';
    var nav = component.label === 'header'
      ? '<br><a href="index.html">Home</a> · <a href="weddings.html">Weddings</a> · <a href="corporate.html">Corporate</a> · <a href="celebrations.html">Celebrations</a> · <a href="portfolio.html">Portfolio</a> · <a href="about.html">About</a> · <a href="contact.html">Contact</a>'
      : '';
    return '<div class="component-error" role="alert">' + reason + nav + '</div>';
  }

  function load(component) {
    var host = document.getElementById(component.id);
    if (!host) return Promise.resolve();

    return fetch(component.url, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text();
      })
      .then(function (html) {
        host.innerHTML = html;
        if (window.Eventora && typeof window.Eventora[component.init] === 'function') {
          window.Eventora[component.init]();
        }
      })
      .catch(function (error) {
        console.error('[Eventora] Could not load ' + component.url + ':', error);
        host.innerHTML = errorMarkup(component);
      });
  }

  Promise.all(COMPONENTS.map(load)).then(function () {
    document.dispatchEvent(new CustomEvent('eventora:components-loaded'));
  });
})();
