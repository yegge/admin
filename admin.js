// Admin Panel JS (Supabase)
// Purpose: Provide a static admin UI that authenticates users and writes to Postgres via Supabase.
// Security model: Use anon key in the browser with RLS enabled. Authenticated users get insert/update permissions via policies.

let supabaseClient = null;
let session = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function toast(el, msg, ok = true) {
  el.textContent = msg;
  el.className = ok ? 'text-green-400' : 'text-red-400';
  setTimeout(() => { el.textContent = ''; }, 5000);
}

// Tabs
$$('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab-panel').forEach(p => p.classList.add('hidden'));
    $('#tab-' + btn.dataset.tab).classList.remove('hidden');
  });
});

// Connect
$('#connect').addEventListener('click', async () => {
  const url = $('#https://djxxhvpkhfvbwxbdvxnx.supabase.co').value.trim();
  const key = $('#eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeHhodnBraGZ2Ynd4YmR2eG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyOTU0MjksImV4cCI6MjA3Mjg3MTQyOX0.oLWmb4BuZi05hmvNDPQmUdw0jLdWLV92Bsu0OQhlXHY').value.trim();
  if (!url || !key) {
    $('#connect-status').textContent = 'Provide URL and anon key.';
    $('#connect-status').className = 'text-red-400';
    return;
  }
  supabaseClient = window.supabase.createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  // Load session if any
  const { data: { session: s } } = await supabaseClient.auth.getSession();
  session = s || null;
  updateAuthUI();
  $('#connect-status').textContent = 'Connected.';
  $('#connect-status').className = 'text-green-400';

  // Preload selects/lists
  await refreshAlbums();
  await refreshTracks();
});

// Auth: magic link
$('#magic').addEventListener('click', async () => {
  if (!supabaseClient) return;
  const email = $('#email').value.trim();
  if (!email) return;
  const { error } = await supabaseClient.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
  if (error) return alert(error.message);
  alert('Magic link sent. Check your email to finish sign-in.');
});

$('#signout').addEventListener('click', async () => {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  session = null;
  updateAuthUI();
});

function updateAuthUI() {
  if (session) {
    $('#signout').classList.remove('hidden');
    $('#magic').classList.add('hidden');
    $('#email').classList.add('hidden');
  } else {
    $('#signout').classList.add('hidden');
    $('#magic').classList.remove('hidden');
    $('#email').classList.remove('hidden');
  }
}

// Helpers
function mmssToSeconds(mmss) {
  if (!mmss) return 0;
  const m = mmss.split(':').map(Number);
  if (m.length !== 2 || Number.isNaN(m[0]) || Number.isNaN(m[1])) return 0;
  return (m[0] * 60) + m[1];
}

async function refreshAlbums() {
  if (!supabaseClient) return;
  // Editor view should see all albums; but if your RLS only exposes released/removed to anon,
  // either: (a) sign in as an editor, or (b) temporarily query albums_public_view here.
  const { data, error } = await supabaseClient.from('albums').select('*').order('release_date', { ascending: false });
  const list = $('#albums-list');
  const sel1 = $('#track-album');
  const sel2 = $('#credit-album');

  list.innerHTML = '';
  sel1.innerHTML = '';
  sel2.innerHTML = '';

  if (error) {
    list.innerHTML = `<div class="text-red-400 text-sm">${error.message}</div>`;
    return;
  }

  for (const a of data) {
    const div = document.createElement('div');
    div.className = 'p-3 rounded border border-slate-700 flex items-center justify-between';
    div.innerHTML = `
      <div>
        <div class="font-medium">${a.album_name}</div>
        <div class="text-sm text-slate-400">${a.album_artist} · ${a.album_type || ''} · ${a.release_date || ''}</div>
      </div>
      <button class="btn px-3 py-1 rounded">Edit</button>
    `;
    div.querySelector('button').addEventListener('click', () => prefillAlbumForm(a));
    list.appendChild(div);

    // Populate selects
    const opt1 = document.createElement('option');
    opt1.value = a.id;
    opt1.textContent = `${a.album_name} (${a.album_artist})`;
    sel1.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = a.id;
    opt2.textContent = `${a.album_name} (${a.album_artist})`;
    sel2.appendChild(opt2);
  }
}

async function refreshTracks() {
  if (!supabaseClient) return;
  const albumId = $('#track-album').value;
  const list = $('#tracks-list');
  list.innerHTML = '';

  if (!albumId) return;

  const { data, error } = await supabaseClient.from('tracks')
    .select('*').eq('album_id', albumId).order('track_no', { ascending: true });

  if (error) {
    list.innerHTML = `<div class="text-red-400 text-sm">${error.message}</div>`;
    return;
  }
  for (const t of data) {
    const div = document.createElement('div');
    div.className = 'p-3 rounded border border-slate-700';
    div.innerHTML = `<div class="font-medium">#${t.track_no} ${t.track_name}</div>
                     <div class="text-sm text-slate-400">ISRC: ${t.isrc || '—'} · Duration: ${t.duration_seconds}s</div>`;
    list.appendChild(div);
  }
}

function prefillAlbumForm(a) {
  const f = $('#album-form');
  f.album_name.value = a.album_name || '';
  f.album_type.value = a.album_type || '';
  f.album_artist.value = a.album_artist || 'Yegge';
  f.catalog_number.value = a.catalog_number || '';
  f.upc.value = a.upc || '';
  f.distributor_url.value = a.distributor_url || '';
  f.label_url.value = a.label_url || '';
  f.release_date.value = a.release_date || '';
  f.removal_date.value = a.removal_date || '';
  f.front_cover_url.value = a.front_cover_url || '';
  f.back_cover_url.value = a.back_cover_url || '';
  f.sleeve_url.value = a.sleeve_url || '';
  f.sticker_url.value = a.sticker_url || '';
  f.album_commentary.value = a.album_commentary || '';
  f.stream_apple_music_url.value = a.stream_apple_music_url || '';
  f.stream_spotify_url.value = a.stream_spotify_url || '';
  f.stream_youtube_music_url.value = a.stream_youtube_music_url || '';
  f.stream_itunes_url.value = a.stream_itunes_url || '';
  f.stream_amazon_music_url.value = a.stream_amazon_music_url || '';
  f.stream_tidal_url.value = a.stream_tidal_url || '';
  f.stream_bandcamp_url.value = a.stream_bandcamp_url || '';

  f.dataset.editId = a.id;
}

// Album submit
$('#album-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!supabaseClient) return;

  const f = e.currentTarget;
  const payload = {
    album_name: f.album_name.value.trim(),
    album_type: f.album_type.value || null,
    album_artist: f.album_artist.value,
    catalog_number: f.catalog_number.value ? Number(f.catalog_number.value) : null,
    upc: f.upc.value || null,
    distributor_url: f.distributor_url.value || null,
    label_url: f.label_url.value || null,
    release_date: f.release_date.value || null,
    removal_date: f.removal_date.value || null,
    front_cover_url: f.front_cover_url.value || null,
    back_cover_url: f.back_cover_url.value || null,
    sleeve_url: f.sleeve_url.value || null,
    sticker_url: f.sticker_url.value || null,
    album_commentary: f.album_commentary.value || null,
    stream_apple_music_url: f.stream_apple_music_url.value || null,
    stream_spotify_url: f.stream_spotify_url.value || null,
    stream_youtube_music_url: f.stream_youtube_music_url.value || null,
    stream_itunes_url: f.stream_itunes_url.value || null,
    stream_amazon_music_url: f.stream_amazon_music_url.value || null,
    stream_tidal_url: f.stream_tidal_url.value || null,
    stream_bandcamp_url: f.stream_bandcamp_url.value || null
  };

  let res, error;
  if (f.dataset.editId) {
    // update
    const id = Number(f.dataset.editId);
    ({ data: res, error } = await supabaseClient.from('albums').update(payload).eq('id', id).select().single());
  } else {
    ({ data: res, error } = await supabaseClient.from('albums').insert(payload).select().single());
  }

  if (error) return toast($('#album-msg'), error.message, false);

  toast($('#album-msg'), f.dataset.editId ? 'Album updated.' : 'Album created.');
  f.reset();
  delete f.dataset.editId;
  await refreshAlbums();
});

$('#album-reset').addEventListener('click', () => {
  const f = $('#album-form');
  f.reset();
  delete f.dataset.editId;
});

// Track form
$('#track-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!supabaseClient) return;
  const f = e.currentTarget;
  const payload = {
    album_id: Number(f.album_id.value),
    track_no: Number(f.track_no.value),
    track_name: f.track_name.value.trim(),
    duration_seconds: mmssToSeconds(f.duration_mmss.value),
    isrc: f.isrc.value || null,
    track_status: f.track_status.value || 'In Development',
    stage_of_production: f.stage_of_production.value ? Number(f.stage_of_production.value) : null,
    stage_of_production_date: f.stage_of_production_date.value || null,
    visibility: f.visibility.value || null,
    stream_embed_url: f.stream_embed_url.value || null,
    stream_blocked: $('#stream_blocked').checked,
    purchase_download_url: f.purchase_download_url.value || null
  };

  const { error } = await supabaseClient.from('tracks').insert(payload);
  if (error) return toast($('#track-msg'), error.message, false);

  toast($('#track-msg'), 'Track created.');
  f.reset();
  await refreshTracks();
});

$('#track-reset').addEventListener('click', () => {
  $('#track-form').reset();
});

// Album credits
$('#album-credit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!supabaseClient) return;
  const f = e.currentTarget;
  const album_id = Number(f.album_id.value);
  const credit_type = f.credit_type.value;
  const payload = {
    album_id,
    name: f.name.value.trim(),
    url: f.url.value || null,
    sort_order: f.sort_order.value ? Number(f.sort_order.value) : null
  };
  let table = null;
  if (credit_type === 'producer') table = 'album_producers';
  else if (credit_type === 'engineer') table = 'album_engineers';
  else table = 'album_contributors';

  // If contributor, include role
  if (table === 'album_contributors') payload.role = f.role.value || null;

  const { error } = await supabaseClient.from(table).insert(payload);
  if (error) return toast($('#album-credit-msg'), error.message, false);

  toast($('#album-credit-msg'), 'Album credit added.');
  f.reset();
});

// Track credits
$('#track-credit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!supabaseClient) return;
  const f = e.currentTarget;
  const track_id = Number(f.track_id.value);
  const credit_type = f.credit_type.value;
  const common = { track_id, name: f.name.value.trim(), url: f.url.value || null, sort_order: f.sort_order.value ? Number(f.sort_order.value) : null };

  let table = null;
  let payload = { ...common };
  if (credit_type === 'composer') {
    table = 'track_composers';
  } else {
    table = 'track_contributors';
    payload.role = f.role.value || null;
  }

  const { error } = await supabaseClient.from(table).insert(payload);
  if (error) return toast($('#track-credit-msg'), error.message, false);

  toast($('#track-credit-msg'), 'Track credit added.');
  f.reset();
});

// Logs
$('#log-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!supabaseClient) return;
  const f = e.currentTarget;
  const payload = {
    track_id: Number(f.track_id.value),
    title: f.title.value.trim(),
    subject: f.subject.value || null,
    notes: f.notes.value || null
  };
  const { error } = await supabaseClient.from('track_logs').insert(payload);
  if (error) return toast($('#log-msg'), error.message, false);

  toast($('#log-msg'), 'Log added.');
  f.reset();
});

// Reactivity
$('#track-album')?.addEventListener('change', refreshTracks);

// Populate track & log selects with tracks after album selection
async function hydrateTrackSelects() {
  if (!supabaseClient) return;
  const sel = $('#credit-track');
  const sel2 = $('#log-track');
  sel.innerHTML = '';
  sel2.innerHTML = '';

  const { data, error } = await supabaseClient.from('tracks')
    .select('track_id, track_no, track_name, album_id').order('album_id').order('track_no');
  if (error) return;
  for (const t of data) {
    const opt = document.createElement('option');
    opt.value = t.track_id;
    opt.textContent = `#${t.track_no} ${t.track_name} (Album ${t.album_id})`;
    const opt2 = opt.cloneNode(true);
    sel.appendChild(opt);
    sel2.appendChild(opt2);
  }
}

// When album list changes, refresh dependent selects
document.addEventListener('DOMContentLoaded', () => {
  // Hook to refresh track selects after connects or insertions
  setInterval(() => {
    if (supabaseClient) hydrateTrackSelects();
  }, 5000);
});
