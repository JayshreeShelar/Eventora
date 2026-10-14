/* EVENTORA — enquiry form: validates, then opens WhatsApp with the enquiry ready to send */
(function () {
  'use strict';

  var form = document.getElementById('enquiry-form');
  if (!form) return;

  var status = document.getElementById('form-status');
  var dateInput = form.elements['eventDate'];
  var messageInput = form.elements['message'];
  var counter = document.getElementById('message-count');
  var MAX_MESSAGE = 1000;

  function pad(n) { return String(n).padStart(2, '0'); }
  function todayString() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  // Block past dates in the date picker as well as in validation
  dateInput.setAttribute('min', todayString());

  // Preselect event type from ?type=wedding|corporate|celebration
  var preset = new URLSearchParams(window.location.search).get('type');
  if (preset && form.elements['eventType']) {
    var option = form.elements['eventType'].querySelector('option[value="' + preset + '"]');
    if (option) form.elements['eventType'].value = preset;
  }

  var rules = {
    fullName: function (v) {
      if (!v) return 'Please enter your full name.';
      if (v.length < 2) return 'Your name should be at least 2 characters.';
      return '';
    },
    email: function (v) {
      if (!v) return 'Please enter your email address.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email address, for example name@example.com.';
      return '';
    },
    phone: function (v) {
      if (!v) return 'Please enter your phone number.';
      if (!/^\+?[0-9\s\-().]+$/.test(v)) return 'Use digits only, with an optional + at the start.';
      var digits = v.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) return 'Phone numbers should have between 7 and 15 digits.';
      return '';
    },
    eventType: function (v) { return v ? '' : 'Please choose an event type.'; },
    eventDate: function (v) {
      if (!v) return 'Please choose your preferred event date.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'Enter the date in a valid format.';
      if (v < todayString()) return 'The event date cannot be in the past. Choose today or a later date.';
      return '';
    },
    guests: function (v) {
      if (!v) return '';
      var n = Number(v);
      if (!Number.isInteger(n) || n < 1) return 'Enter a whole number of guests, 1 or more.';
      if (n > 100000) return 'Enter a realistic guest count.';
      return '';
    },
    location: function (v) { return v ? '' : 'Please tell us where the event will take place.'; },
    message: function (v) { return v.length > MAX_MESSAGE ? 'Please keep your message under ' + MAX_MESSAGE + ' characters.' : ''; }
  };

  function setError(name, text) {
    var field = form.elements[name];
    var wrap = field.closest('.field');
    var error = document.getElementById(name + '-error');
    wrap.classList.toggle('has-error', Boolean(text));
    field.setAttribute('aria-invalid', text ? 'true' : 'false');
    error.textContent = text;
  }

  function validateField(name) {
    var value = form.elements[name].value.trim();
    var text = rules[name](value);
    setError(name, text);
    return !text;
  }

  Object.keys(rules).forEach(function (name) {
    var field = form.elements[name];
    field.addEventListener('blur', function () { validateField(name); });
    field.addEventListener('input', function () {
      if (field.closest('.field').classList.contains('has-error')) validateField(name);
    });
    field.addEventListener('change', function () { validateField(name); });
  });

  messageInput.addEventListener('input', function () {
    counter.textContent = messageInput.value.length + ' / ' + MAX_MESSAGE;
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    status.className = 'form-status';
    var firstInvalid = null;

    Object.keys(rules).forEach(function (name) {
      if (!validateField(name) && !firstInvalid) firstInvalid = form.elements[name];
    });

    if (firstInvalid) {
      status.className = 'form-status is-visible demo-banner';
      status.setAttribute('role', 'alert');
      status.innerHTML = '<strong>Please fix the highlighted fields.</strong>';
      firstInvalid.focus();
      return;
    }

    var v = function (n) { return form.elements[n].value.trim(); };
    var typeLabel = form.elements['eventType'].options[form.elements['eventType'].selectedIndex].text;
    var budgetLabel = form.elements['budget'].value ? form.elements['budget'].options[form.elements['budget'].selectedIndex].text : 'Not specified';
    var text = 'New Eventora enquiry\n' +
      'Name: ' + v('fullName') + '\nPhone: ' + v('phone') + '\nEmail: ' + v('email') + '\n' +
      'Event: ' + typeLabel + '\nDate: ' + v('eventDate') + '\nGuests: ' + (v('guests') || 'Not specified') + '\n' +
      'Budget: ' + budgetLabel + '\nLocation: ' + v('location') + '\nMessage: ' + (v('message') || '-');
    window.open('https://wa.me/918830532500?text=' + encodeURIComponent(text), '_blank', 'noopener');
    status.className = 'form-status is-visible demo-banner';
    status.setAttribute('role', 'status');
    status.innerHTML = '<strong>Thank you!</strong> WhatsApp is opening with your enquiry. Press send to reach us, or call +91 88305 32500.';
    form.reset();
    counter.textContent = '0 / ' + MAX_MESSAGE;
    Object.keys(rules).forEach(function (name) { setError(name, ''); });
    status.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
