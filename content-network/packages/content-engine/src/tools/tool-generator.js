/**
 * Converte un tool-config in una pagina HTML standalone interattiva.
 * Gestisce tutti i tipi: calculator, wizard.
 * Output types: currency-hero, currency, number-hero, number, range-hero, wizard-result.
 */

/**
 * Returns only the <style> + <main> + <script> body content for embedding
 * inside a full-site layout (renderBase + renderHeader + renderFooter).
 *
 * @param {object} config  - entry from TOOL_CONFIGS
 * @param {object} site    - { name, url, color, niche, adsenseId }
 * @returns {string}       - body content (no <html>/<head>)
 */
export function generateToolBody(config, site = {}) {
  const {
    title, headline, description, seoDescription, type,
    ctaText, inputs, formula, outputs, disclaimer
  } = config;

  const siteUrl   = site.url   || '';
  const color     = site.color || '#c0392b';
  const colorDark = darkenColor(color);
  const adsenseId = site.adsenseId || '';

  const inputsHTML = inputs.map(renderInput).join('\n');
  const formulaJSON = JSON.stringify(formula.trim());
  const outputsJSON = JSON.stringify(outputs);
  const isWizard = type === 'wizard';

  function adDiv() {
    if (!adsenseId) return '';
    return `<div class="ad ad-inline" style="text-align:center;margin:28px 0;min-height:280px"><ins class="adsbygoogle" style="display:block" data-ad-client="${adsenseId}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>`;
  }

  return `<style>
    :root{--tool-color:${color};--tool-color-dark:${colorDark};--tool-color-bg:color-mix(in srgb,${color} 10%,#fff);--tool-color-border:color-mix(in srgb,${color} 30%,#fff)}
    .tool-page{max-width:760px;margin:0 auto;padding:28px 16px 60px}
    .tool-breadcrumb{font-size:13px;color:#999;margin-bottom:20px}
    .tool-breadcrumb a{color:#999;text-decoration:none}.tool-breadcrumb a:hover{text-decoration:underline}
    .tool-hero{text-align:center;margin-bottom:28px}
    .tool-hero h1{font-size:clamp(22px,4vw,30px);color:#1a1a1a;margin-bottom:12px}
    .tool-hero p{font-size:16px;color:#555;max-width:580px;margin:0 auto;line-height:1.7}
    .tool-intro{background:#f8f8f8;border-left:4px solid var(--tool-color);border-radius:0 8px 8px 0;padding:18px 20px;margin-bottom:28px;font-size:15px;color:#333;line-height:1.75}
    .tool-intro p{margin:0 0 10px}.tool-intro p:last-child{margin:0}
    .tool-card{background:#fff;border:1px solid #e8e8e8;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.07);overflow:hidden;margin-bottom:28px}
    .tool-card-header{background:var(--tool-color);color:#fff;padding:18px 28px;display:flex;align-items:center;gap:12px}
    .tool-card-header h2{font-size:16px;font-weight:700;margin:0}
    .tool-body{padding:28px}
    .input-group{margin-bottom:22px}
    .input-group>label{display:block;font-size:14px;font-weight:600;color:#333;margin-bottom:8px}
    .input-hint{font-size:12px;color:#777;margin-top:5px}
    .tool-select,.tool-number{width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:6px;font-size:15px;color:#1a1a1a;background:#fafafa;transition:border-color .2s;box-sizing:border-box}
    .tool-select:focus,.tool-number:focus{outline:none;border-color:var(--tool-color);background:#fff}
    .radio-group{display:flex;flex-wrap:wrap;gap:8px}
    .radio-option{position:relative}
    .radio-option input[type="radio"]{position:absolute;opacity:0;width:0;height:0}
    .radio-option label{display:flex;flex-direction:column;align-items:center;padding:9px 16px;border:1.5px solid #ddd;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;color:#444;background:#fafafa;transition:all .15s;margin:0;white-space:nowrap}
    .radio-option label .radio-hint{font-size:11px;color:#888;font-weight:400;margin-top:2px}
    .radio-option input[type="radio"]:checked+label{border-color:var(--tool-color);background:var(--tool-color-bg);color:var(--tool-color-dark)}
    .radio-option label:hover{border-color:var(--tool-color);background:#fff}
    .tool-cta{width:100%;padding:14px;background:var(--tool-color);color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;transition:background .2s,transform .1s;margin-top:8px}
    .tool-cta:hover{background:var(--tool-color-dark)}.tool-cta:active{transform:scale(.98)}
    .tool-results{display:none;margin-top:28px;padding-top:28px;border-top:2px solid #f0f0f0}
    .tool-results.visible{display:block}
    .result-hero{text-align:center;background:var(--tool-color-bg);border:2px solid var(--tool-color-border);border-radius:10px;padding:28px 20px;margin-bottom:24px}
    .result-hero-label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#777;margin-bottom:8px}
    .result-hero-value{font-size:clamp(32px,8vw,52px);font-weight:900;color:var(--tool-color);line-height:1}
    .result-hero-unit{font-size:15px;color:#888;margin-top:8px}
    .result-range-sub{display:flex;justify-content:center;gap:20px;margin-top:12px;flex-wrap:wrap;font-size:14px;color:#666}
    .result-range-sub span{white-space:nowrap}.result-range-sub .range-mid{font-weight:700;color:var(--tool-color)}
    .result-bar-container{margin-bottom:24px}
    .result-bar-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:14px}
    .result-bar-label{width:140px;flex-shrink:0;color:#444;font-weight:500}
    .result-bar-track{flex:1;height:8px;background:#eee;border-radius:4px;overflow:hidden}
    .result-bar-fill{height:100%;background:var(--tool-color);border-radius:4px;transition:width .6s ease;width:0}
    .result-bar-value{width:80px;text-align:right;font-weight:600;color:#1a1a1a;white-space:nowrap}
    .result-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-bottom:20px}
    .result-item{background:#f9f9f9;border:1px solid #efefef;border-radius:8px;padding:14px 12px;text-align:center}
    .result-item-label{font-size:12px;color:#777;margin-bottom:4px}
    .result-item-value{font-size:18px;font-weight:700;color:#1a1a1a}
    .result-item-unit{font-size:11px;color:#999;margin-top:2px}
    .result-insight{background:var(--tool-color-bg);border:1.5px solid var(--tool-color-border);border-left:4px solid var(--tool-color);border-radius:8px;padding:14px 18px;margin-bottom:20px;font-size:14px;color:#333;line-height:1.65}
    .result-insight strong{color:var(--tool-color-dark)}
    .result-comparison{display:flex;gap:12px;margin-bottom:20px}
    .result-comparison-col{flex:1;background:#f9f9f9;border:1px solid #e8e8e8;border-radius:8px;padding:14px;text-align:center}
    .result-comparison-col.yours{background:var(--tool-color-bg);border-color:var(--tool-color-border)}
    .result-comparison-label{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#888;margin-bottom:6px}
    .result-comparison-value{font-size:22px;font-weight:800;color:#1a1a1a}
    .result-comparison-col.yours .result-comparison-value{color:var(--tool-color-dark)}
    .wizard-restart-note{background:#fff9e6;border:1px solid #f4d166;border-radius:6px;padding:10px 16px;font-size:14px;color:#7d6000;margin-bottom:16px}
    .wizard-result-card{background:#f0f7ff;border:1.5px solid #b8d8f8;border-left:5px solid #2980b9;border-radius:8px;padding:20px 24px;margin-bottom:20px}
    .wizard-cause{font-size:14px;color:#555;margin-bottom:16px}.wizard-cause strong{color:#2980b9}
    .wizard-steps{list-style:none;padding:0;margin:0;counter-reset:step-counter}
    .wizard-steps li{counter-increment:step-counter;display:flex;gap:12px;margin-bottom:12px;font-size:14px;line-height:1.6}
    .wizard-steps li::before{content:counter(step-counter);flex-shrink:0;width:24px;height:24px;background:#2980b9;color:#fff;border-radius:50%;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}
    .tool-disclaimer{margin-top:20px;padding:14px 16px;background:#f9f9f9;border-left:3px solid #ddd;border-radius:4px;font-size:12px;color:#888;line-height:1.6}
    .tool-related{margin-top:40px}.tool-related h3{font-size:18px;margin-bottom:16px;color:#1a1a1a}
    @media(max-width:540px){.tool-body{padding:20px 16px}.result-grid{grid-template-columns:1fr 1fr}.result-bar-label{width:90px;font-size:12px}.result-bar-value{width:60px;font-size:13px}}
  </style>
  <main class="site-main">
    <div class="wrap">
      <div class="tool-page">

        <nav class="tool-breadcrumb">
          <a href="/">Home</a> ›
          <a href="/tools/">Tools</a> ›
          <span style="color:#555">${escHtml(title)}</span>
        </nav>

        ${adDiv()}

        <div class="tool-hero">
          <h1>${escHtml(headline)}</h1>
          <p>${escHtml(description)}</p>
        </div>

        <div class="tool-intro">
          <p>Use this free ${escHtml(title.toLowerCase())} to get an instant, personalized estimate. Simply fill in the fields below and click the button — results appear immediately, no sign-up required.</p>
          <p>All estimates are based on current industry averages and are intended as a planning guide. For an exact quote, consult a licensed professional in your area.</p>
        </div>

        <div class="tool-card">
          <div class="tool-card-header">
            ${isWizard
              ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
              : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'
            }
            <h2>${escHtml(title)}</h2>
          </div>
          <div class="tool-body">
            <form id="tool-form" onsubmit="runTool(event)">
              ${inputsHTML}
              <button type="submit" class="tool-cta">${escHtml(ctaText)} &rarr;</button>
            </form>
            <div class="tool-results" id="tool-results">
              <div id="results-dynamic"></div>
              <p class="tool-disclaimer">${escHtml(disclaimer)}</p>
            </div>
          </div>
        </div>

        ${adDiv()}

        <div class="tool-related">
          <h3>Related Articles</h3>
          <div id="related-articles"></div>
        </div>

      </div>
    </div>
  </main>

  <script>
    var OUTPUTS = ${outputsJSON};
    var FORMULA = ${formulaJSON};
    var IS_WIZARD = ${isWizard};

    function getInputs(){var d={};document.querySelectorAll('#tool-form select,#tool-form input[type="number"]').forEach(function(e){d[e.name]=e.value});document.querySelectorAll('#tool-form input[type="radio"]:checked').forEach(function(e){d[e.name]=e.value});return d;}
    function runTool(e){e.preventDefault();var i=getInputs();var r;try{r=new Function('inputs',FORMULA)(i);}catch(err){console.error('Tool formula error:',err);alert('Calculation error. Please check your inputs.');return;}renderResults(r);var p=document.getElementById('tool-results');p.classList.add('visible');p.scrollIntoView({behavior:'smooth',block:'nearest'});}
    function fmtCurrency(n){return'$'+Math.round(n).toLocaleString('en-US');}
    function fmtNumber(n,u){var s=Math.round(n).toLocaleString('en-US');return u?s+' '+u:s;}
    function renderResults(result){var c=document.getElementById('results-dynamic');c.innerHTML='';if(IS_WIZARD){renderWizard(result,c);return;}var heroOut=null,gridOuts=[],barOuts=[],insightOut=null,comparisonOut=null;OUTPUTS.forEach(function(o){if(o.type==='insight'){insightOut=o;}else if(o.type==='comparison'){comparisonOut=o;}else if(o.type.indexOf('hero')!==-1){heroOut=o;}else if(o.percent){barOuts.push(o);}else{gridOuts.push(o);}});if(heroOut){var hd=document.createElement('div');hd.className='result-hero';if(heroOut.type==='range-hero'){hd.innerHTML='<div class="result-hero-label">'+heroOut.label+'</div><div class="result-hero-value">'+fmtCurrency(result.totalMid)+'</div><div class="result-hero-unit">estimated mid-range cost</div><div class="result-range-sub"><span>Low: <strong>'+fmtCurrency(result.totalLow)+'</strong></span><span class="range-mid">Typical: '+fmtCurrency(result.totalMid)+'</span><span>High: <strong>'+fmtCurrency(result.totalHigh)+'</strong></span></div>';}else if(heroOut.type==='currency-hero'){hd.innerHTML='<div class="result-hero-label">'+heroOut.label+'</div><div class="result-hero-value">'+fmtCurrency(result[heroOut.id])+'</div><div class="result-hero-unit">'+(heroOut.unit||'estimated total')+'</div>';}else if(heroOut.type==='number-hero'){hd.innerHTML='<div class="result-hero-label">'+heroOut.label+'</div><div class="result-hero-value">'+fmtNumber(result[heroOut.id])+'</div><div class="result-hero-unit">'+(heroOut.unit||'')+'</div>';}c.appendChild(hd);}if(barOuts.length){var total=heroOut?(result[heroOut.id]||1):1;if(heroOut&&heroOut.type==='range-hero')total=result.totalMid||1;var bd=document.createElement('div');bd.className='result-bar-container';barOuts.forEach(function(o){var val=result[o.id]||0;var pct=Math.min(100,Math.round(val/total*100));var fmt=o.type==='currency'?fmtCurrency(val):fmtNumber(val,o.unit);var row=document.createElement('div');row.className='result-bar-row';row.innerHTML='<span class="result-bar-label">'+o.label+'</span><div class="result-bar-track"><div class="result-bar-fill" style="width:'+pct+'%"></div></div><span class="result-bar-value">'+fmt+'</span>';bd.appendChild(row);});c.appendChild(bd);}if(gridOuts.length){var gd=document.createElement('div');gd.className='result-grid';gridOuts.forEach(function(o){var val=result[o.id]||0;var fmt=o.type==='currency'?fmtCurrency(val):fmtNumber(val,o.unit);var item=document.createElement('div');item.className='result-item';item.innerHTML='<div class="result-item-label">'+o.label+'</div><div class="result-item-value">'+fmt+'</div>'+(o.unit&&o.type!=='currency'?'<div class="result-item-unit">'+o.unit+'</div>':'');gd.appendChild(item);});c.appendChild(gd);}if(insightOut&&result[insightOut.id]){var id2=document.createElement('div');id2.className='result-insight';id2.innerHTML='💡 <strong>Expert Insight:</strong> '+result[insightOut.id];c.appendChild(id2);}if(comparisonOut&&result[comparisonOut.id]){var cmp=result[comparisonOut.id];var cd=document.createElement('div');cd.className='result-comparison';cd.innerHTML='<div class="result-comparison-col yours"><div class="result-comparison-label">Your Estimate</div><div class="result-comparison-value">'+cmp.yours+'</div></div><div class="result-comparison-col"><div class="result-comparison-label">US Average</div><div class="result-comparison-value">'+cmp.average+'</div></div>';c.appendChild(cd);}}
    function renderWizard(result,c){if(result.restartNote){var n=document.createElement('div');n.className='wizard-restart-note';n.textContent=result.restartNote;c.appendChild(n);}var card=document.createElement('div');card.className='wizard-result-card';var cause=document.createElement('div');cause.className='wizard-cause';cause.innerHTML='<strong>Most likely cause:</strong> '+(result.cause||'');card.appendChild(cause);var steps=document.createElement('ul');steps.className='wizard-steps';(result.steps||[]).forEach(function(step){var li=document.createElement('li');li.textContent=step;steps.appendChild(li);});card.appendChild(steps);c.appendChild(card);}
    function initConditionalFields(){document.querySelectorAll('[data-show-when-input]').forEach(function(group){var wi=group.dataset.showWhenInput;var wv=group.dataset.showWhenValue;function update(){var r=document.querySelectorAll('[name="'+wi+'"]:checked');var s=document.querySelectorAll('[name="'+wi+'"]');var cur='';if(r.length)cur=r[0].value;else if(s.length)cur=s[0].value;group.style.display=(cur===wv)?'':'none';}document.querySelectorAll('[name="'+wi+'"]').forEach(function(el){el.addEventListener('change',update);});update();});}
    function loadRelatedArticles(){fetch('/api/articles.json').then(function(r){return r.json();}).then(function(articles){var el=document.getElementById('related-articles');var items=articles.slice(0,4);if(!items.length)return;el.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;';items.forEach(function(a){var link=document.createElement('a');link.href='/'+a.slug+'/';link.style.cssText='display:block;text-decoration:none;border:1px solid #eee;border-radius:8px;overflow:hidden;transition:box-shadow .2s;';link.onmouseover=function(){this.style.boxShadow='0 4px 16px rgba(0,0,0,.1)';};link.onmouseout=function(){this.style.boxShadow='';};if(a.image){var img=document.createElement('img');img.src=a.image;img.alt=a.title;img.loading='lazy';img.style.cssText='width:100%;height:120px;object-fit:cover;display:block;';img.onerror=function(){this.style.display='none';};link.appendChild(img);}var td=document.createElement('div');td.style.cssText='padding:12px 14px;';var p=document.createElement('p');p.style.cssText='font-size:13px;font-weight:600;color:#1a1a1a;margin:0;line-height:1.4;';p.textContent=a.title;td.appendChild(p);link.appendChild(td);el.appendChild(link);});}).catch(function(){});}
    initConditionalFields();
    loadRelatedArticles();
  </script>`;
}

/**
 * @param {object} config  - entry from TOOL_CONFIGS
 * @param {object} site    - { name, url, color, niche }
 * @returns {string}       - complete HTML string (standalone page, legacy)
 */
export function generateToolPage(config, site = {}) {
  const {
    title, headline, description, seoDescription, type,
    ctaText, inputs, formula, outputs, disclaimer
  } = config;

  const siteName  = site.name  || 'The Daily Pulse';
  const siteUrl   = site.url   || '';
  const color     = site.color || '#c0392b';
  const colorDark = darkenColor(color);

  const inputsHTML = inputs.map(renderInput).join('\n');

  // Safely embed formula as a JSON string — avoids all backtick/quote escaping issues
  const formulaJSON = JSON.stringify(formula.trim());

  // Build the outputs config as JSON for client-side rendering
  const outputsJSON = JSON.stringify(outputs);

  const isWizard = type === 'wizard';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)} | ${escHtml(siteName)}</title>
  <meta name="description" content="${escHtml(seoDescription || description)}" />
  <link rel="canonical" href="${escHtml(siteUrl)}/tools/${config.slug}/" />
  <meta property="og:title" content="${escHtml(title)}" />
  <meta property="og:description" content="${escHtml(description)}" />
  <meta property="og:type" content="website" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&family=Open+Sans:wght@400;500;600&display=swap" />
  <link rel="stylesheet" href="/styles/pulse.css" />

  <style>
    :root {
      --tool-color: ${color};
      --tool-color-dark: ${colorDark};
      --tool-color-bg: color-mix(in srgb, ${color} 10%, #fff);
      --tool-color-border: color-mix(in srgb, ${color} 30%, #fff);
    }

    .tool-page { max-width: 760px; margin: 40px auto; padding: 0 16px 60px; }

    .tool-hero { text-align: center; margin-bottom: 36px; }
    .tool-hero h1 {
      font-family: 'Merriweather', Georgia, serif;
      font-size: clamp(22px, 4vw, 30px);
      color: #1a1a1a; margin-bottom: 12px;
    }
    .tool-hero p { font-size: 16px; color: #555; max-width: 580px; margin: 0 auto; line-height: 1.7; }

    .tool-card {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,.07);
      overflow: hidden;
    }

    .tool-card-header {
      background: var(--tool-color);
      color: #fff;
      padding: 18px 28px;
      display: flex; align-items: center; gap: 12px;
    }
    .tool-card-header h2 {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 16px; font-weight: 700; margin: 0;
    }

    .tool-body { padding: 28px; }

    .input-group { margin-bottom: 22px; }
    .input-group > label {
      display: block; font-size: 14px; font-weight: 600;
      color: #333; margin-bottom: 8px;
    }
    .input-hint { font-size: 12px; color: #777; margin-top: 5px; }

    .tool-select, .tool-number {
      width: 100%; padding: 10px 14px;
      border: 1.5px solid #ddd; border-radius: 6px;
      font-size: 15px; font-family: 'Open Sans', sans-serif;
      color: #1a1a1a; background: #fafafa;
      transition: border-color .2s; box-sizing: border-box;
    }
    .tool-select:focus, .tool-number:focus {
      outline: none; border-color: var(--tool-color); background: #fff;
    }

    .radio-group { display: flex; flex-wrap: wrap; gap: 8px; }
    .radio-option { position: relative; }
    .radio-option input[type="radio"] { position: absolute; opacity: 0; width: 0; height: 0; }
    .radio-option label {
      display: flex; flex-direction: column; align-items: center;
      padding: 9px 16px;
      border: 1.5px solid #ddd; border-radius: 6px;
      cursor: pointer; font-size: 14px; font-weight: 500;
      color: #444; background: #fafafa;
      transition: all .15s; margin: 0; white-space: nowrap;
    }
    .radio-option label .radio-hint {
      font-size: 11px; color: #888; font-weight: 400; margin-top: 2px;
    }
    .radio-option input[type="radio"]:checked + label {
      border-color: var(--tool-color);
      background: var(--tool-color-bg);
      color: var(--tool-color-dark);
    }
    .radio-option label:hover { border-color: var(--tool-color); background: #fff; }

    .tool-cta {
      width: 100%; padding: 14px;
      background: var(--tool-color); color: #fff;
      border: none; border-radius: 8px;
      font-size: 16px; font-weight: 700;
      font-family: 'Open Sans', sans-serif;
      cursor: pointer; transition: background .2s, transform .1s;
      margin-top: 8px;
    }
    .tool-cta:hover  { background: var(--tool-color-dark); }
    .tool-cta:active { transform: scale(.98); }

    /* Results */
    .tool-results { display: none; margin-top: 28px; padding-top: 28px; border-top: 2px solid #f0f0f0; }
    .tool-results.visible { display: block; }

    .result-hero {
      text-align: center;
      background: var(--tool-color-bg);
      border: 2px solid var(--tool-color-border);
      border-radius: 10px; padding: 28px 20px; margin-bottom: 24px;
    }
    .result-hero-label {
      font-size: 12px; font-weight: 600; text-transform: uppercase;
      letter-spacing: .06em; color: #777; margin-bottom: 8px;
    }
    .result-hero-value {
      font-family: 'Merriweather', Georgia, serif;
      font-size: clamp(32px, 8vw, 52px);
      font-weight: 900; color: var(--tool-color); line-height: 1;
    }
    .result-hero-unit { font-size: 15px; color: #888; margin-top: 8px; }
    .result-range-sub {
      display: flex; justify-content: center; gap: 20px;
      margin-top: 12px; flex-wrap: wrap;
      font-size: 14px; color: #666;
    }
    .result-range-sub span { white-space: nowrap; }
    .result-range-sub .range-mid { font-weight: 700; color: var(--tool-color); }

    .result-bar-container { margin-bottom: 24px; }
    .result-bar-row {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 10px; font-size: 14px;
    }
    .result-bar-label { width: 140px; flex-shrink: 0; color: #444; font-weight: 500; }
    .result-bar-track {
      flex: 1; height: 8px; background: #eee; border-radius: 4px; overflow: hidden;
    }
    .result-bar-fill {
      height: 100%; background: var(--tool-color);
      border-radius: 4px; transition: width .6s ease;
      width: 0;
    }
    .result-bar-value { width: 80px; text-align: right; font-weight: 600; color: #1a1a1a; white-space: nowrap; }

    .result-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 12px; margin-bottom: 20px;
    }
    .result-item {
      background: #f9f9f9; border: 1px solid #efefef;
      border-radius: 8px; padding: 14px 12px; text-align: center;
    }
    .result-item-label { font-size: 12px; color: #777; margin-bottom: 4px; }
    .result-item-value { font-size: 18px; font-weight: 700; color: #1a1a1a; }
    .result-item-unit { font-size: 11px; color: #999; margin-top: 2px; }

    /* Wizard */
    .wizard-restart-note {
      background: #fff9e6; border: 1px solid #f4d166;
      border-radius: 6px; padding: 10px 16px;
      font-size: 14px; color: #7d6000; margin-bottom: 16px;
    }
    .wizard-result-card {
      background: #f0f7ff; border: 1.5px solid #b8d8f8;
      border-left: 5px solid #2980b9;
      border-radius: 8px; padding: 20px 24px; margin-bottom: 20px;
    }
    .wizard-cause { font-size: 14px; color: #555; margin-bottom: 16px; }
    .wizard-cause strong { color: #2980b9; }
    .wizard-steps { list-style: none; padding: 0; margin: 0; counter-reset: step-counter; }
    .wizard-steps li {
      counter-increment: step-counter;
      display: flex; gap: 12px; margin-bottom: 12px;
      font-size: 14px; line-height: 1.6;
    }
    .wizard-steps li::before {
      content: counter(step-counter);
      flex-shrink: 0; width: 24px; height: 24px;
      background: #2980b9; color: #fff; border-radius: 50%;
      font-size: 12px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      margin-top: 1px;
    }

    .tool-disclaimer {
      margin-top: 20px; padding: 14px 16px;
      background: #f9f9f9; border-left: 3px solid #ddd;
      border-radius: 4px; font-size: 12px; color: #888; line-height: 1.6;
    }

    .tool-related { margin-top: 40px; }
    .tool-related h3 {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 18px; margin-bottom: 16px; color: #1a1a1a;
    }

    @media (max-width: 540px) {
      .tool-body { padding: 20px 16px; }
      .result-grid { grid-template-columns: 1fr 1fr; }
      .result-bar-label { width: 90px; font-size: 12px; }
      .result-bar-value { width: 60px; font-size: 13px; }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="header-main">
      <div class="container">
        <a href="/" class="site-logo">
          <span class="logo-the">The</span>
          <span class="logo-name">${escHtml(siteName.replace(/^The\s+/, ''))}</span>
        </a>
      </div>
    </div>
    <nav class="header-nav-main">
      <div class="container">
        <ul class="nav-list">
          <li><a href="/">Home</a></li>
          <li><a href="/tools/${config.slug}/" style="font-weight:700;color:${color}">Free Calculator</a></li>
        </ul>
      </div>
    </nav>
  </header>

  <main class="site-main">
    <div class="container">
      <div class="tool-page">

        <nav style="font-size:13px;color:#999;margin-bottom:20px;">
          <a href="/" style="color:#999;">Home</a> ›
          <a href="/tools/" style="color:#999;">Tools</a> ›
          <span style="color:#555;">${escHtml(title)}</span>
        </nav>

        <div class="tool-hero">
          <h1>${escHtml(headline)}</h1>
          <p>${escHtml(description)}</p>
        </div>

        <div class="tool-card">
          <div class="tool-card-header">
            ${isWizard
              ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
              : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'
            }
            <h2>${escHtml(title)}</h2>
          </div>

          <div class="tool-body">
            <form id="tool-form" onsubmit="runTool(event)">
              ${inputsHTML}
              <button type="submit" class="tool-cta">${escHtml(ctaText)} →</button>
            </form>

            <div class="tool-results" id="tool-results">
              <div id="results-dynamic"></div>
              <p class="tool-disclaimer">${escHtml(disclaimer)}</p>
            </div>
          </div>
        </div>

        <div class="tool-related">
          <h3>Related Articles</h3>
          <div id="related-articles"></div>
        </div>

      </div>
    </div>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} ${escHtml(siteName)}. All rights reserved.</p>
        <p class="footer-disclaimer">Content is for informational purposes only. Always consult a professional.</p>
      </div>
    </div>
  </footer>

  <script>
    var OUTPUTS = ${outputsJSON};
    var FORMULA = ${formulaJSON};
    var IS_WIZARD = ${isWizard};

    /* ── Collect form values ─────────────────────────────────── */
    function getInputs() {
      var data = {};
      document.querySelectorAll('#tool-form select, #tool-form input[type="number"]').forEach(function(el) {
        data[el.name] = el.value;
      });
      document.querySelectorAll('#tool-form input[type="radio"]:checked').forEach(function(el) {
        data[el.name] = el.value;
      });
      return data;
    }

    /* ── Run tool ────────────────────────────────────────────── */
    function runTool(e) {
      e.preventDefault();
      var inputs = getInputs();
      var result;
      try {
        result = new Function('inputs', FORMULA)(inputs);
      } catch(err) {
        console.error('Tool formula error:', err);
        alert('Calculation error. Please check your inputs.');
        return;
      }
      renderResults(result);
      var panel = document.getElementById('tool-results');
      panel.classList.add('visible');
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /* ── Formatting helpers ──────────────────────────────────── */
    function fmtCurrency(n) {
      return '$' + Math.round(n).toLocaleString('en-US');
    }
    function fmtNumber(n, unit) {
      var s = Math.round(n).toLocaleString('en-US');
      return unit ? s + ' ' + unit : s;
    }

    /* ── Render results ──────────────────────────────────────── */
    function renderResults(result) {
      var container = document.getElementById('results-dynamic');
      container.innerHTML = '';

      if (IS_WIZARD) {
        renderWizard(result, container);
        return;
      }

      // Find hero output
      var heroOut = null;
      var gridOuts = [];
      var barOuts = [];

      OUTPUTS.forEach(function(o) {
        if (o.type.indexOf('hero') !== -1) {
          heroOut = o;
        } else if (o.percent) {
          barOuts.push(o);
        } else {
          gridOuts.push(o);
        }
      });

      // Hero
      if (heroOut) {
        var heroDiv = document.createElement('div');
        heroDiv.className = 'result-hero';

        if (heroOut.type === 'range-hero') {
          heroDiv.innerHTML =
            '<div class="result-hero-label">' + heroOut.label + '</div>' +
            '<div class="result-hero-value">' + fmtCurrency(result.totalMid) + '</div>' +
            '<div class="result-hero-unit">estimated mid-range cost</div>' +
            '<div class="result-range-sub">' +
              '<span>Low: <strong>' + fmtCurrency(result.totalLow) + '</strong></span>' +
              '<span class="range-mid">Typical: ' + fmtCurrency(result.totalMid) + '</span>' +
              '<span>High: <strong>' + fmtCurrency(result.totalHigh) + '</strong></span>' +
            '</div>';
        } else if (heroOut.type === 'currency-hero') {
          var unitLabel = heroOut.unit || 'estimated total';
          heroDiv.innerHTML =
            '<div class="result-hero-label">' + heroOut.label + '</div>' +
            '<div class="result-hero-value">' + fmtCurrency(result[heroOut.id]) + '</div>' +
            '<div class="result-hero-unit">' + unitLabel + '</div>';
        } else if (heroOut.type === 'number-hero') {
          heroDiv.innerHTML =
            '<div class="result-hero-label">' + heroOut.label + '</div>' +
            '<div class="result-hero-value">' + fmtNumber(result[heroOut.id]) + '</div>' +
            '<div class="result-hero-unit">' + (heroOut.unit || '') + '</div>';
        }
        container.appendChild(heroDiv);
      }

      // Bar chart (outputs with percent:true)
      if (barOuts.length) {
        var total = heroOut ? (result[heroOut.id] || 1) : 1;
        // For range-hero use totalMid as the base
        if (heroOut && heroOut.type === 'range-hero') total = result.totalMid || 1;

        var barDiv = document.createElement('div');
        barDiv.className = 'result-bar-container';
        barOuts.forEach(function(o) {
          var val = result[o.id] || 0;
          var pct = Math.min(100, Math.round(val / total * 100));
          var formatted = o.type === 'currency' ? fmtCurrency(val) : fmtNumber(val, o.unit);
          var row = document.createElement('div');
          row.className = 'result-bar-row';
          row.innerHTML =
            '<span class="result-bar-label">' + o.label + '</span>' +
            '<div class="result-bar-track"><div class="result-bar-fill" style="width:' + pct + '%"></div></div>' +
            '<span class="result-bar-value">' + formatted + '</span>';
          barDiv.appendChild(row);
        });
        container.appendChild(barDiv);
      }

      // Plain grid (outputs without percent and without hero)
      if (gridOuts.length) {
        var gridDiv = document.createElement('div');
        gridDiv.className = 'result-grid';
        gridOuts.forEach(function(o) {
          var val = result[o.id] || 0;
          var formatted = o.type === 'currency' ? fmtCurrency(val) : fmtNumber(val, o.unit);
          var item = document.createElement('div');
          item.className = 'result-item';
          item.innerHTML =
            '<div class="result-item-label">' + o.label + '</div>' +
            '<div class="result-item-value">' + formatted + '</div>' +
            (o.unit && o.type !== 'currency' ? '<div class="result-item-unit">' + o.unit + '</div>' : '');
          gridDiv.appendChild(item);
        });
        container.appendChild(gridDiv);
      }
    }

    /* ── Wizard result rendering ─────────────────────────────── */
    function renderWizard(result, container) {
      if (result.restartNote) {
        var noteEl = document.createElement('div');
        noteEl.className = 'wizard-restart-note';
        noteEl.textContent = result.restartNote;
        container.appendChild(noteEl);
      }

      var card = document.createElement('div');
      card.className = 'wizard-result-card';

      var cause = document.createElement('div');
      cause.className = 'wizard-cause';
      cause.innerHTML = '<strong>Most likely cause:</strong> ' + (result.cause || '');
      card.appendChild(cause);

      var steps = document.createElement('ul');
      steps.className = 'wizard-steps';
      (result.steps || []).forEach(function(step) {
        var li = document.createElement('li');
        li.textContent = step;
        steps.appendChild(li);
      });
      card.appendChild(steps);
      container.appendChild(card);
    }

    /* ── showWhen conditional fields ─────────────────────────── */
    function initConditionalFields() {
      document.querySelectorAll('[data-show-when-input]').forEach(function(group) {
        var watchInput = group.dataset.showWhenInput;
        var watchValue = group.dataset.showWhenValue;

        function update() {
          var radios = document.querySelectorAll('[name="' + watchInput + '"]:checked');
          var selects = document.querySelectorAll('[name="' + watchInput + '"]');
          var current = '';
          if (radios.length) current = radios[0].value;
          else if (selects.length) current = selects[0].value;
          group.style.display = (current === watchValue) ? '' : 'none';
        }

        document.querySelectorAll('[name="' + watchInput + '"]').forEach(function(el) {
          el.addEventListener('change', update);
        });
        update();
      });
    }

    /* ── Related articles ────────────────────────────────────── */
    function loadRelatedArticles() {
      fetch('/articles.json').then(function(r) { return r.json(); }).then(function(articles) {
        var el = document.getElementById('related-articles');
        var items = articles.slice(0, 4);
        if (!items.length) return;
        el.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;';
        items.forEach(function(a) {
          var link = document.createElement('a');
          link.href = '/' + a.slug;
          link.style.cssText = 'display:block;text-decoration:none;border:1px solid #eee;border-radius:8px;overflow:hidden;transition:box-shadow .2s;';
          link.onmouseover = function() { this.style.boxShadow = '0 4px 16px rgba(0,0,0,.1)'; };
          link.onmouseout  = function() { this.style.boxShadow = ''; };
          if (a.image || a.slug) {
            var img = document.createElement('img');
            img.src = '/images/' + a.slug + '.jpg';
            img.alt = a.title;
            img.loading = 'lazy';
            img.style.cssText = 'width:100%;height:120px;object-fit:cover;display:block;';
            img.onerror = function() { this.style.display = 'none'; };
            link.appendChild(img);
          }
          var textDiv = document.createElement('div');
          textDiv.style.cssText = 'padding:12px 14px;';
          var p = document.createElement('p');
          p.style.cssText = 'font-size:13px;font-weight:600;color:#1a1a1a;margin:0;line-height:1.4;';
          p.textContent = a.title;
          textDiv.appendChild(p);
          link.appendChild(textDiv);
          el.appendChild(link);
        });
      }).catch(function() {});
    }

    initConditionalFields();
    loadRelatedArticles();
  </script>
</body>
</html>`;
}

/* ── Helper: darken a hex color ──────────────────────────────────── */
function darkenColor(hex) {
  const c = hex.replace('#', '');
  if (c.length !== 6) return hex;
  const r = Math.max(0, parseInt(c.slice(0, 2), 16) - 30);
  const g = Math.max(0, parseInt(c.slice(2, 4), 16) - 30);
  const b = Math.max(0, parseInt(c.slice(4, 6), 16) - 30);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/* ── Helper: HTML escape ─────────────────────────────────────────── */
function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Render an input field ───────────────────────────────────────── */
function renderInput(input) {
  const { id, label, type, options, placeholder, min, max, hint } = input;

  let fieldHTML = '';

  if (type === 'select') {
    const opts = options.map(o =>
      `<option value="${escHtml(o.value)}">${escHtml(o.label)}</option>`
    ).join('');
    fieldHTML = `<select class="tool-select" name="${id}" id="inp-${id}">${opts}</select>`;

  } else if (type === 'number') {
    const defVal = input.default !== undefined ? input.default : '';
    fieldHTML = `<input class="tool-number" type="number" name="${id}" id="inp-${id}" placeholder="${escHtml(placeholder || '')}" min="${min ?? ''}" max="${max ?? ''}" value="${defVal}" />`;

  } else if (type === 'radio') {
    const radios = options.map(o => {
      const checked = o.value === (input.default ?? options[0]?.value) ? 'checked' : '';
      const hintHTML = o.hint ? `<span class="radio-hint">${escHtml(o.hint)}</span>` : '';
      return `<div class="radio-option">
          <input type="radio" name="${id}" id="inp-${id}-${o.value}" value="${escHtml(o.value)}" ${checked} />
          <label for="inp-${id}-${o.value}">${escHtml(o.label)}${hintHTML}</label>
        </div>`;
    }).join('');
    fieldHTML = `<div class="radio-group">${radios}</div>`;
  }

  const hintHTML = hint ? `<p class="input-hint">${escHtml(hint)}</p>` : '';

  const showWhenAttr = input.showWhen
    ? `data-show-when-input="${input.showWhen.input}" data-show-when-value="${input.showWhen.value}"`
    : '';

  return `<div class="input-group" id="grp-${id}" ${showWhenAttr}>
      <label for="inp-${id}">${escHtml(label)}</label>
      ${fieldHTML}${hintHTML}
    </div>`;
}
