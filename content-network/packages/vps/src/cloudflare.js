/**
 * Cloudflare API integration
 * - Aggiunge domini come zone
 * - Crea record DNS (A record per @ e www)
 * - Configura SSL, HTTPS redirect, minification
 * - Purge cache dopo pubblicazione articoli
 *
 * Richiede: CLOUDFLARE_API_TOKEN nel .env
 */

const CF_API = 'https://api.cloudflare.com/client/v4';

function getToken() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN not set in .env');
  return token;
}

function headers() {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  };
}

async function cfFetch(path, method = 'GET', body = null) {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${CF_API}${path}`, opts);
  const data = await res.json();
  if (!data.success) {
    const errs = data.errors?.map(e => e.message).join(', ') || 'Unknown error';
    throw new Error(`Cloudflare API error: ${errs}`);
  }
  return data.result;
}

/* ── Zone (domain) management ────────────────────────────────── */

/**
 * Aggiunge un dominio a Cloudflare come zona.
 * Se la zona esiste già, restituisce quella esistente.
 * @returns {object} zone — { id, name, name_servers }
 */
export async function addZone(domain) {
  // Check if zone already exists
  const existing = await cfFetch(`/zones?name=${domain}`);
  if (existing.length > 0) {
    console.log(`  ℹ️  Zone already exists on Cloudflare: ${domain}`);
    return existing[0];
  }

  const zone = await cfFetch('/zones', 'POST', {
    name: domain,
    jump_start: false, // non importare DNS esistente — lo gestiamo noi
  });

  console.log(`  ✅ Zone created: ${domain}`);
  return zone;
}

/**
 * Ottieni l'ID zona per un dominio.
 */
export async function getZoneId(domain) {
  const zones = await cfFetch(`/zones?name=${domain}`);
  if (!zones.length) throw new Error(`Zone not found for domain: ${domain}`);
  return zones[0].id;
}

/* ── DNS records ──────────────────────────────────────────────── */

/**
 * Crea record A per @ e www puntando al server IP.
 * Proxied = true → traffico passa per Cloudflare (CDN + DDoS + SSL).
 */
export async function createDnsRecords(zoneId, domain, serverIp) {
  const existing = await cfFetch(`/zones/${zoneId}/dns_records?type=A`);
  const existingNames = new Set(existing.map(r => r.name));

  const records = [
    { type: 'A', name: domain,        content: serverIp, proxied: true, ttl: 1 },
    { type: 'A', name: `www.${domain}`, content: serverIp, proxied: true, ttl: 1 },
  ];

  for (const record of records) {
    if (existingNames.has(record.name)) {
      console.log(`  ℹ️  DNS record already exists: ${record.name}`);
      continue;
    }
    await cfFetch(`/zones/${zoneId}/dns_records`, 'POST', record);
    console.log(`  ✅ DNS A record: ${record.name} → ${serverIp} (proxied)`);
  }
}

/* ── Zone settings ────────────────────────────────────────────── */

async function setSetting(zoneId, setting, value) {
  await cfFetch(`/zones/${zoneId}/settings/${setting}`, 'PATCH', { value });
}

/**
 * Configura tutte le impostazioni ottimali per SEO e performance.
 */
export async function configureZoneSettings(zoneId) {
  const settings = [
    // SSL: Full (strict) — usa il cert Let's Encrypt sul server
    ['ssl', 'full'],
    // Forza HTTPS su tutto
    ['always_use_https', 'on'],
    // HTTP/2
    ['http2', 'on'],
    // HTTP/3 (QUIC) — più veloce su mobile
    ['http3', 'on'],
    // Minifica HTML, CSS, JS automaticamente
    ['minify', { html: 'on', css: 'on', js: 'on' }],
    // Compressione Brotli (migliore di gzip)
    ['brotli', 'on'],
    // Early Hints — preload resources prima del HTML
    ['early_hints', 'on'],
    // Browser cache TTL 4 ore (asset già cachati 1 anno in nginx)
    ['browser_cache_ttl', 14400],
    // Rocket Loader: off (può rompere AdSense)
    ['rocket_loader', 'off'],
    // Bot Fight Mode: on (protegge AdSense da click invalidi)
    ['bot_fight_mode', 'on'],
  ];

  for (const [setting, value] of settings) {
    try {
      await setSetting(zoneId, setting, value);
    } catch (err) {
      // Alcune impostazioni non sono disponibili su tutti i piani — non bloccante
      console.warn(`  ⚠️  Could not set ${setting}: ${err.message}`);
    }
  }

  console.log(`  ✅ Zone settings configured`);
}

/* ── Cache purge ──────────────────────────────────────────────── */

/**
 * Purge cache completo — da chiamare dopo pubblicazione nuovi articoli.
 */
export async function purgeCache(domain) {
  const zoneId = await getZoneId(domain);
  await cfFetch(`/zones/${zoneId}/purge_cache`, 'POST', { purge_everything: true });
  console.log(`  ✅ Cache purged: ${domain}`);
}

/**
 * Purge cache di URL specifici (più efficiente per aggiornamenti singoli).
 */
export async function purgeUrls(domain, urls) {
  const zoneId = await getZoneId(domain);
  // Cloudflare accetta max 30 URL per richiesta
  for (let i = 0; i < urls.length; i += 30) {
    await cfFetch(`/zones/${zoneId}/purge_cache`, 'POST', {
      files: urls.slice(i, i + 30)
    });
  }
  console.log(`  ✅ Purged ${urls.length} URLs: ${domain}`);
}

/* ── Email Routing ────────────────────────────────────────────── */

/**
 * Abilita Cloudflare Email Routing e imposta una regola catch-all
 * che inoltra *@domain a forwardTo.
 * CF aggiunge automaticamente i record MX necessari.
 *
 * Gmail mostrerà "To: editor@domain.com" (o contact@, ads@, ecc.)
 * nel campo To: così sai sempre da quale sito proviene l'email.
 */
export async function setupEmailRouting(zoneId, forwardTo) {
  // 1. Abilita Email Routing sulla zona (idempotente)
  try {
    await cfFetch(`/zones/${zoneId}/email/routing/enable`, 'POST');
    console.log(`  ✅ Email Routing enabled`);
  } catch (err) {
    if (err.message.toLowerCase().includes('already enabled') ||
        err.message.toLowerCase().includes('already exists')) {
      console.log(`  ℹ️  Email Routing already enabled`);
    } else {
      throw err;
    }
  }

  // 2. Aggiungi forwardTo come indirizzo di destinazione verificato
  //    (CF richiede che l'indirizzo sia "verified" prima di poterlo usare)
  try {
    await cfFetch(`/accounts/${await _getAccountId()}/email/routing/addresses`, 'POST', {
      email: forwardTo,
    });
    console.log(`  ✅ Destination address registered: ${forwardTo}`);
  } catch (err) {
    if (err.message.toLowerCase().includes('already exists') ||
        err.message.toLowerCase().includes('duplicate')) {
      // già registrato — ok
    } else {
      console.warn(`  ⚠️  Could not register destination address: ${err.message}`);
    }
  }

  // 3. Imposta regola catch-all → forward a destinazione
  await cfFetch(`/zones/${zoneId}/email/routing/rules/catch_all`, 'PUT', {
    actions: [{ type: 'forward', value: [forwardTo] }],
    enabled: true,
    matchers: [{ type: 'all' }],
    name: 'catch-all forward',
  });

  console.log(`  ✅ Email routing: *@domain → ${forwardTo}`);
}

/** Recupera l'account ID Cloudflare (necessario per registrare indirizzi email). */
async function _getAccountId() {
  const accounts = await cfFetch('/accounts');
  if (!accounts?.length) throw new Error('No Cloudflare accounts found');
  return accounts[0].id;
}

/* ── Full setup (chiamato da site-spawner) ────────────────────── */

/**
 * Setup completo Cloudflare per un nuovo dominio.
 * @returns {{ nameservers: string[], zoneId: string }} — nameservers da impostare sul registrar
 */
export async function setupDomain(domain, serverIp) {
  console.log(`☁️  Setting up Cloudflare for ${domain}...`);

  const zone = await addZone(domain);
  await createDnsRecords(zone.id, domain, serverIp);
  await configureZoneSettings(zone.id);

  // Email routing — catch-all → vireonmediaadv@gmail.com (o override da env)
  const forwardTo = process.env.FORWARD_EMAIL || 'vireonmediaadv@gmail.com';
  try {
    await setupEmailRouting(zone.id, forwardTo);
  } catch (err) {
    console.warn(`  ⚠️  Email routing setup failed (non-blocking): ${err.message}`);
  }

  const nameservers = zone.name_servers || [];
  if (nameservers.length) {
    console.log(`\n  📋 Set these nameservers at your registrar:`);
    nameservers.forEach(ns => console.log(`     ${ns}`));
  }

  return { nameservers, zoneId: zone.id };
}
