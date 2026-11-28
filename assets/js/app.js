(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
  }

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  /* ---------------------------------------------------------------- toasts */

  var toastHost = $('#toasts');

  function toast(title, message, type) {
    if (!toastHost) return;
    var el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' toast--error' : '');
    el.innerHTML = '<span class="toast__dot" aria-hidden="true"></span>' +
      '<span class="toast__text"><b></b><span></span></span>';
    el.querySelector('b').textContent = title;
    el.querySelector('.toast__text span').textContent = message || '';

    toastHost.appendChild(el);
    while (toastHost.children.length > 3) {
      toastHost.removeChild(toastHost.firstElementChild);
    }

    window.setTimeout(function () {
      el.classList.add('is-out');
      window.setTimeout(function () { el.remove(); }, 320);
    }, 4600);
  }

  /* ----------------------------------------------------------------- theme */

  var root = document.documentElement;
  var themeBtn = $('#themeBtn');

  function syncTheme() {
    var light = root.getAttribute('data-theme') === 'light';
    if (themeBtn) themeBtn.setAttribute('aria-pressed', String(light));
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? '#f3f7fb' : '#05070d');
  }

  syncTheme();

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('reveal_theme', next); } catch (e) { /* noop */ }
      syncTheme();
      toast(next === 'light' ? 'Светлая тема' : 'Тёмная тема', 'Интерфейс переключён.', 'ok');
    });
  }

  /* ------------------------------------------------------------ navigation */

  var burger = $('#burger');
  var mobileMenu = $('#mobileMenu');

  function closeMenu() {
    if (!burger || !mobileMenu) return;
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    mobileMenu.hidden = true;
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', function (event) {
      event.stopPropagation();
      var open = mobileMenu.hidden;
      mobileMenu.hidden = !open;
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });

    $$('a', mobileMenu).forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', function (event) {
      if (mobileMenu.hidden) return;
      if (mobileMenu.contains(event.target) || burger.contains(event.target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024) closeMenu();
    });

    window.addEventListener('scroll', function () {
      if (!mobileMenu.hidden) closeMenu();
    }, { passive: true });
  }

  /* -------------------------------------------------------- header + cursor */

  var island = $('.island');
  var spotlight = $('#spotlight');
  var pointer = { x: 0, y: 0, active: false, queued: false };

  function paintSpotlight() {
    pointer.queued = false;
    if (!spotlight) return;
    spotlight.style.transform = 'translate3d(' + pointer.x + 'px, ' + pointer.y + 'px, 0) translate(-50%, -50%)';
  }

  window.addEventListener('pointermove', function (event) {
    if (event.pointerType === 'touch' || !spotlight) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (!pointer.active) {
      pointer.active = true;
      spotlight.classList.add('is-on');
    }
    if (!pointer.queued) {
      pointer.queued = true;
      window.requestAnimationFrame(paintSpotlight);
    }
  }, { passive: true });

  function onScroll() {
    if (island) island.classList.toggle('is-scrolled', window.scrollY > 12);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------- reveal + count */

  var revealItems = $$('.reveal');

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach(function (item, index) {
      item.style.transitionDelay = (index % 3) * 60 + 'ms';
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-in'); });
  }

  function formatNumber(value) {
    return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  var counters = $$('[data-count]');

  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1500;
    var start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatNumber(target * eased) + suffix;
      if (progress < 1) window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------------------------------------------------------- comparison */

  var compareFrame = $('#compareFrame');
  var compareHandle = $('#compareHandle');

  if (compareFrame && compareHandle) {
    var comparePos = 52;
    var compareDragging = false;

    function paintCompare(value) {
      comparePos = Math.min(100, Math.max(0, value));
      compareFrame.style.setProperty('--pos', comparePos + '%');
      compareHandle.setAttribute('aria-valuenow', String(Math.round(comparePos)));
      compareHandle.setAttribute('aria-valuetext', Math.round(comparePos) + '%');
    }

    function compareFromEvent(event) {
      var rect = compareFrame.getBoundingClientRect();
      paintCompare(((event.clientX - rect.left) / rect.width) * 100);
    }

    compareFrame.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      compareDragging = true;
      try { compareFrame.setPointerCapture(event.pointerId); } catch (e) { /* synthetic pointer */ }
      compareFromEvent(event);
    });

    compareFrame.addEventListener('pointermove', function (event) {
      if (!compareDragging) return;
      compareFromEvent(event);
    });

    compareFrame.addEventListener('pointerup', function () { compareDragging = false; });
    compareFrame.addEventListener('pointercancel', function () { compareDragging = false; });

    compareFrame.addEventListener('dblclick', function () {
      paintCompare(50);
    });

    compareHandle.addEventListener('keydown', function (event) {
      var step = event.shiftKey ? 10 : 2;
      var key = event.key;

      if (key === 'ArrowLeft' || key === 'ArrowDown') {
        event.preventDefault();
        paintCompare(comparePos - step);
      } else if (key === 'ArrowRight' || key === 'ArrowUp') {
        event.preventDefault();
        paintCompare(comparePos + step);
      } else if (key === 'Home') {
        event.preventDefault();
        paintCompare(0);
      } else if (key === 'End') {
        event.preventDefault();
        paintCompare(100);
      }
    });

    paintCompare(comparePos);
  }

  /* ------------------------------------------------------- github releases */

  var REL = window.REVEAL_RELEASE || {};

  var release = {
    version: REL.fallbackVersion || '1.5.2',
    size: REL.fallbackSize || '137 МБ',
    url: '',
    notes: ''
  };

  function formatSize(bytes) {
    if (!bytes) return '';
    var mb = bytes / 1048576;
    return (mb >= 100 ? Math.round(mb) : Math.round(mb * 10) / 10) + ' МБ';
  }

  function applyRelease() {
    $$('[data-release-version]').forEach(function (el) {
      el.textContent = (el.getAttribute('data-release-version') === 'v' ? 'v' : '') + release.version;
    });

    $$('[data-release-size]').forEach(function (el) {
      el.textContent = release.size;
    });

    var changelog = $('#changelogLink');
    if (changelog && release.url) {
      changelog.setAttribute('data-toast', release.notes
        ? 'Changelog v' + release.version + ': ' + release.notes
        : 'Changelog v' + release.version + ': обновление лаунчера.');
    }
  }

  (function syncRelease() {
    if (!REL.owner || !REL.repo) {
      applyRelease();
      return;
    }

    function commit(data) {
      if (data.version) release.version = data.version;
      if (data.size) release.size = data.size;
      release.url = data.url || '';
      release.notes = data.notes || '';
      applyRelease();
    }

    var saved = load('reveal_release', null);
    if (saved && saved.data) commit(saved.data);

    var fresh = saved && saved.at && Date.now() - saved.at < 300000;
    if (fresh) return;

    fetch('https://api.github.com/repos/' + REL.owner + '/' + REL.repo + '/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' }
    })
      .then(function (response) {
        if (!response.ok) throw new Error('GitHub ' + response.status);
        return response.json();
      })
      .then(function (data) {
        var version = String(data.tag_name || data.name || '').replace(/^[vV]/, '').trim();
        if (!version) throw new Error('Нет тега');

        var pattern = REL.assetPattern || /\.exe$/i;
        var assets = data.assets || [];
        var installer = assets.filter(function (asset) { return pattern.test(asset.name); })[0] || assets[0] || null;

        var payload = {
          version: version,
          size: installer && installer.size ? formatSize(installer.size) : release.size,
          url: installer ? installer.browser_download_url : (data.html_url || ''),
          notes: String(data.body || '').split('\n')[0].replace(/^#+\s*/, '').slice(0, 100)
        };

        commit(payload);
        store('reveal_release', { at: Date.now(), data: payload });
      })
      .catch(function () { applyRelease(); });
  })();

  /* -------------------------------------------------------------- download */

  var mirrorBtn = $('#mirrorBtn');
  if (mirrorBtn) {
    mirrorBtn.addEventListener('click', function () {
      if (REL.mirrorUrl) window.location.href = REL.mirrorUrl;
    });
  }

  var downloadBtn = $('#downloadBtn');
  var progress = $('#dlProgress');
  var progressBar = progress ? progress.querySelector('.progress__bar i') : null;
  var progressText = progress ? progress.querySelector('.progress__text') : null;
  var downloading = false;

  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      if (downloading) return;
      downloading = true;

      var percent = 0;
      if (progress) progress.hidden = false;
      if (progressText) progressText.textContent = 'Подготовка установщика…';

      var tick = window.setInterval(function () {
        percent = Math.min(percent + Math.random() * 24 + 7, 100);
        if (progressBar) progressBar.style.width = percent + '%';
        if (progressText) progressText.textContent = 'Скачивание ' + Math.round(percent) + '% · ' + release.size;

        if (percent >= 100) {
          window.clearInterval(tick);
          if (progressText) progressText.textContent = 'Готово · ' + release.size;
          toast('Установщик готов', 'Reveal Launcher v' + release.version + ' · ' + release.size + '.');
          if (release.url) window.location.href = release.url;
          window.setTimeout(function () {
            if (progress) progress.hidden = true;
            if (progressBar) progressBar.style.width = '0';
            downloading = false;
          }, 2400);
        }
      }, 300);
    });
  }

  /* --------------------------------------------------------------- configs */

  var configTexts = {};

  function legacyCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();

    var copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (e) {
      copied = false;
    }

    area.remove();
    return copied;
  }

  function copyText(text) {
    if (legacyCopy(text)) return Promise.resolve();

    if (navigator.clipboard && window.isSecureContext) {
      return Promise.race([
        navigator.clipboard.writeText(text),
        new Promise(function (resolve, reject) {
          window.setTimeout(function () { reject(new Error('copy timeout')); }, 1500);
        })
      ]);
    }

    return Promise.reject(new Error('copy blocked'));
  }

  function prefetchConfig(url) {
    if (configTexts[url]) return;

    fetch(url, { cache: 'force-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text();
      })
      .then(function (text) { configTexts[url] = text; })
      .catch(function () { /* retried on click */ });
  }

  $$('[data-config-copy]').forEach(function (button) {
    var label = button.getAttribute('data-config-name') || 'Конфиг';
    var url = button.getAttribute('data-config-copy');

    prefetchConfig(url);

    button.addEventListener('click', function () {
      function done() {
        button.classList.add('is-done');
        toast('Скопировано', label + ' — JSON в буфере обмена.');
        window.setTimeout(function () { button.classList.remove('is-done'); }, 1800);
      }

      function fail() {
        toast('Не вышло скопировать', 'Скачайте файл кнопкой рядом.', 'error');
      }

      var cached = configTexts[url];

      if (typeof cached === 'string') {
        copyText(cached).then(done).catch(fail);
        return;
      }

      fetch(url, { cache: 'no-cache' })
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.text();
        })
        .then(function (text) {
          configTexts[url] = text;
          return copyText(text);
        })
        .then(done)
        .catch(fail);
    });
  });

  $$('[data-config-download]').forEach(function (link) {
    link.addEventListener('click', function () {
      toast('Конфиг скачивается', (link.getAttribute('data-config-name') || 'Конфиг') + ' · .json');
    });
  });

  /* -------------------------------------------------------------- lightbox */

  var lightbox = $('#lightbox');
  var lightboxImg = $('#lightboxImg');
  var lightboxCaption = $('#lightboxCaption');
  var lightboxClose = $('#lightboxClose');

  if (lightbox && lightboxImg && typeof lightbox.showModal === 'function') {
    $$('[data-shot]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        var img = link.querySelector('img');
        event.preventDefault();
        lightboxImg.src = link.getAttribute('href');
        lightboxImg.alt = img ? img.alt : '';
        if (lightboxCaption) lightboxCaption.textContent = link.getAttribute('data-shot-caption') || '';
        lightbox.showModal();
      });
    });

    if (lightboxClose) {
      lightboxClose.addEventListener('click', function () {
        if (lightbox.open) lightbox.close();
      });
    }

    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox && lightbox.open) lightbox.close();
    });

    lightbox.addEventListener('close', function () {
      lightboxImg.removeAttribute('src');
    });
  }

  /* ------------------------------------------------------------- misc links */

  $$('[data-toast]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      toast('Информация', link.getAttribute('data-toast'));
    });
  });

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  /* -------------------------------------------------------------------- faq */

  var faqItems = $$('.faq__item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ------------------------------------------------------- new year snowfall */

  (function () {
    var canvas = document.getElementById('snow');
    if (!canvas || !canvas.getContext) return;

    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) {
      canvas.remove();
      return;
    }

    var ctx = canvas.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    var flakes = [];
    var width = 0;
    var height = 0;
    var raf = 0;
    var last = 0;

    function flakeColor() {
      return root.getAttribute('data-theme') === 'light' ? '116, 154, 198' : '236, 245, 255';
    }

    var color = flakeColor();

    function makeFlake(spawnAnywhere) {
      return {
        x: Math.random() * width,
        y: spawnAnywhere ? Math.random() * height : -12 - Math.random() * 50,
        r: 0.6 + Math.random() * 1.7,
        vy: 0.22 + Math.random() * 0.65,
        vx: -0.14 + Math.random() * 0.28,
        drift: 0.18 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.22 + Math.random() * 0.6
      };
    }

    function seed() {
      var count = Math.min(130, Math.max(36, Math.round((width * height) / 15000)));
      flakes = [];
      for (var i = 0; i < count; i++) flakes.push(makeFlake(true));
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * DPR);
      canvas.height = Math.round(height * DPR);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      seed();
    }

    function frame(now) {
      raf = window.requestAnimationFrame(frame);
      if (!last) last = now;
      var delta = Math.min(now - last, 40) / 16.667;
      last = now;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(' + color + ', ';

      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.y += f.vy * delta;
        f.x += (f.vx + Math.sin(now * 0.0006 + f.phase) * f.drift) * delta;

        if (f.y > height + 12) {
          f.y = -12;
          f.x = Math.random() * width;
        }
        if (f.x < -14) f.x = width + 14;
        if (f.x > width + 14) f.x = -14;

        ctx.globalAlpha = f.alpha;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    function start() {
      if (!raf) {
        last = 0;
        raf = window.requestAnimationFrame(frame);
      }
    }

    function stop() {
      if (raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    resize();
    start();

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });

    if (motion.addEventListener) {
      motion.addEventListener('change', function (event) {
        if (!event.matches) return;
        stop();
        canvas.remove();
      });
    }

    if (window.MutationObserver) {
      new MutationObserver(function () {
        color = flakeColor();
      }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    }
  })();

})();
