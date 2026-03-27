/**
 * Shared HTML/JS snippets usati da tutti i template
 * - Cookie consent banner (GDPR + AdSense compliant)
 * - Email subscribe form handler
 * - Native ads widget
 */

// ── Cookie Banner ────────────────────────────────────────────
export const COOKIE_BANNER_CSS = `
/* Cookie Banner */
#cookie-banner{position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#1a1a2e;color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;box-shadow:0 -4px 20px rgba(0,0,0,.3);transform:translateY(100%);transition:transform .3s ease}
#cookie-banner.show{transform:translateY(0)}
#cookie-banner p{font-size:13px;line-height:1.5;flex:1;min-width:200px;margin:0}
#cookie-banner a{color:#60a5fa;text-decoration:underline}
.cookie-btns{display:flex;gap:8px;flex-shrink:0}
.btn-accept{background:#c0392b;color:#fff;border:none;padding:9px 20px;border-radius:4px;cursor:pointer;font-weight:700;font-size:13px}
.btn-decline{background:transparent;color:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.2);padding:9px 16px;border-radius:4px;cursor:pointer;font-size:13px}
.btn-accept:hover{background:#a93226}
`;

export const COOKIE_BANNER_HTML = `
<div id="cookie-banner" role="dialog" aria-label="Cookie consent">
  <p>We use cookies to improve your experience and serve personalized ads. By clicking "Accept", you consent to our use of cookies. <a href="/privacy/">Privacy Policy</a></p>
  <div class="cookie-btns">
    <button class="btn-decline" onclick="cookieDecline()">Decline</button>
    <button class="btn-accept" onclick="cookieAccept()">Accept All</button>
  </div>
</div>
`;

export const COOKIE_BANNER_JS = `
// Cookie consent
(function(){
  var consent = localStorage.getItem('cookie_consent');
  if(!consent){
    setTimeout(function(){
      var b = document.getElementById('cookie-banner');
      if(b) b.classList.add('show');
    }, 1200);
  } else if(consent === 'accepted'){
    loadAds();
  }
})();

function cookieAccept(){
  localStorage.setItem('cookie_consent','accepted');
  var b = document.getElementById('cookie-banner');
  if(b){ b.classList.remove('show'); setTimeout(function(){ b.remove(); }, 300); }
  loadAds();
}

function cookieDecline(){
  localStorage.setItem('cookie_consent','declined');
  var b = document.getElementById('cookie-banner');
  if(b){ b.classList.remove('show'); setTimeout(function(){ b.remove(); }, 300); }
}

function loadAds(){
  // Carica AdSense solo dopo consenso
  if(window.__adsLoaded) return;
  window.__adsLoaded = true;
  var s = document.createElement('script');
  s.async = true;
  var aid = document.documentElement.dataset.adsense || '';
  if(!aid) return;
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + aid;
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
  s.onload = function(){
    document.querySelectorAll('.adsbygoogle').forEach(function(el){
      try{ (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e){}
    });
  };
}
`;

// ── Email Subscribe JS ────────────────────────────────────────
export const EMAIL_FORM_JS = `
// Email subscribe forms
document.querySelectorAll('.nl-form').forEach(function(form){
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var input = form.querySelector('input[type=email]');
    var btn = form.querySelector('button');
    if(!input || !input.value) return;
    btn.disabled = true;
    btn.textContent = 'Subscribing...';
    fetch('/api/subscribe', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email: input.value, site: location.hostname })
    })
    .then(function(r){ return r.json(); })
    .then(function(){
      btn.textContent = 'Subscribed!';
      input.value = '';
      btn.style.background = '#27ae60';
    })
    .catch(function(){
      btn.disabled = false;
      btn.textContent = 'Try again';
    });
  });
});
`;

// ── Native Ads Widget ─────────────────────────────────────────
export const NATIVE_ADS_CSS = `
/* Native Ads */
.native-ads{margin:32px 0;padding:20px;background:#f8f8f8;border:1px solid #e8e8e8;border-radius:4px}
.native-ads-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#999;margin-bottom:12px;display:block}
.native-ads-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;min-height:220px}
.native-card{background:#fff;border:1px solid #e8e8e8;border-radius:4px;overflow:hidden;cursor:pointer;transition:box-shadow .2s}
.native-card:hover{box-shadow:0 2px 8px rgba(0,0,0,.12)}
.native-card-img{width:100%;aspect-ratio:16/9;background:#e8e8e8;object-fit:cover}
.native-card-body{padding:10px}
.native-card-title{font-size:13px;font-weight:600;line-height:1.4;color:#1a1a1a;margin-bottom:4px}
.native-card-src{font-size:11px;color:#999}
/* Taboola/Outbrain placeholder */
.taboola-wrap{margin:32px 0}
`;

export const NATIVE_ADS_HTML = (siteUrl = '') => `
<div class="taboola-wrap">
  <!-- Taboola Feed — sostituisci con il tuo widget ID dopo approvazione -->
  <div id="taboola-below-article-thumbnails"></div>
  <script>
    window._taboola = window._taboola || [];
    _taboola.push({ article:'auto', url: '${siteUrl}' });
  </script>
</div>
<div class="native-ads" id="native-ads-block">
  <span class="native-ads-label">You May Also Like</span>
  <div class="native-ads-grid" id="native-ads-grid">
    <!-- Popolato via JS con articoli correlati come native content -->
  </div>
</div>
`;

// ── MGID Native Ads ───────────────────────────────────────────
export function getMgidLoader(siteId = '') {
  return siteId ? `<script src="https://jsc.mgid.com/site/${siteId}.js" async></script>` : '';
}

export function injectMgidInArticle(content, widgetId = '') {
  if (!widgetId) return content;
  const widget = `<div data-type="_mgwidget" data-widget-id="${widgetId}"></div>`;
  // Start counting </p> only AFTER the TOC nav (if present) to avoid inserting inside structural elements
  const navEnd = content.lastIndexOf('</nav>');
  const pivot  = navEnd >= 0 ? navEnd + 6 : 0;   // 6 = length of '</nav>'
  const before = content.slice(0, pivot);
  const after  = content.slice(pivot);
  let count = 0;
  const patched = after.replace(/<\/p>/gi, m => { count++; return count === 3 ? `${m}${widget}` : m; });
  return count >= 3 ? before + patched : content + widget;
}

export function getMgidSmartWidget(widgetId = '') {
  if (!widgetId) return '';
  // Wrapped so MutationObserver can add margin only after MGID injects content
  return `<div class="mgid-wrap"><div data-type="_mgwidget" data-widget-id="${widgetId}"></div></div><script>(function(w,q){w[q]=w[q]||[];w[q].push(["_mgc.load"])})(window,"_mgq");<\/script>`;
}

export const NATIVE_ADS_JS = `
// Native ads: popola con articoli correlati simulando formato native
fetch('/api/articles.json').then(function(r){ return r.json(); }).then(function(arts){
  var grid = document.getElementById('native-ads-grid');
  if(!grid || !arts.length) return;
  var shuffled = arts.sort(function(){ return Math.random()-.5; }).slice(0,4);
  grid.innerHTML = shuffled.map(function(a){
    var href = '/' + a.slug + '/';
    var src = a.image || ('/images/' + a.slug + '.jpg');
    return '<div class="native-card" data-href="' + href + '">'
      + '<img class="native-card-img" src="' + src + '" loading="lazy" decoding="async" width="200" height="113" alt="' + a.title + '">'
      + '<div class="native-card-body"><div class="native-card-title">' + a.title + '</div>'
      + '<div class="native-card-src">Related</div></div></div>';
  }).join('');
  grid.addEventListener('click', function(e) {
    var card = e.target.closest('[data-href]');
    if (card) location.href = card.getAttribute('data-href');
  });
  grid.querySelectorAll('img').forEach(function(img) {
    img.addEventListener('error', function() { this.style.display = 'none'; });
  });
}).catch(function(){});
`;
