(() => {
  'use strict';

  const TABLE = 'gcse_user_state';
  const META_KEY = '__gcse_cloud_sync_meta_v1';
  const POLL_MS = 1400;
  const PULL_COOLDOWN_MS = 15000;
  const auth = window.GCSE_AUTH;
  const client = auth?.client;

  if (!auth || !client) {
    console.warn('[GCSE Cloud] Supabase account client is unavailable.');
    return;
  }

  const cloud = {
    userId: null,
    startingUserId: null,
    interval: null,
    snapshot: new Map(),
    busy: false,
    lastPull: 0,
    lastSync: null,
    status: 'idle',
    error: null
  };

  const parse = (value, fallback) => {
    try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
  };
  const loadMeta = () => parse(localStorage.getItem(META_KEY), {});
  const saveMeta = meta => { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch {} };
  const eligible = key => typeof key === 'string' && key.startsWith('gcse-') && key.length <= 200;

  function fingerprint(value = '') {
    const text = String(value);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `${(hash >>> 0).toString(36)}:${text.length}`;
  }

  function scanLocal() {
    const map = new Map();
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!eligible(key)) continue;
      const raw = localStorage.getItem(key);
      if (raw !== null) map.set(key, raw);
    }
    return map;
  }

  function rowRaw(row) {
    const value = row?.state_value;
    return value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'raw')
      ? String(value.raw ?? '')
      : '';
  }

  function json(raw) {
    try { return { ok: true, value: JSON.parse(raw) }; }
    catch { return { ok: false, value: raw }; }
  }

  function timestamp(value) {
    if (!value || typeof value !== 'object') return 0;
    const candidate = value.updated ?? value.updatedAt ?? value.updated_at ?? value.timestamp ?? value.created ?? value.date;
    if (typeof candidate === 'number') return Number.isFinite(candidate) ? candidate : 0;
    const parsed = candidate ? Date.parse(candidate) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function mergeValues(remote, local) {
    if (Array.isArray(remote) && Array.isArray(local)) {
      const objects = [...remote, ...local].every(item => item && typeof item === 'object' && !Array.isArray(item));
      const identified = objects && [...remote, ...local].some(item => item.id !== undefined && item.id !== null);
      if (identified) {
        const merged = new Map();
        remote.forEach(item => merged.set(String(item.id), item));
        local.forEach(item => {
          const id = String(item.id);
          merged.set(id, merged.has(id) ? mergeValues(merged.get(id), item) : item);
        });
        return [...merged.values()];
      }
      const seen = new Set();
      return [...remote, ...local].filter(item => {
        let key;
        try { key = JSON.stringify(item); } catch { key = String(item); }
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (remote && local && typeof remote === 'object' && typeof local === 'object' && !Array.isArray(remote) && !Array.isArray(local)) {
      const remoteTime = timestamp(remote);
      const localTime = timestamp(local);
      if (remoteTime && localTime && remoteTime !== localTime) return localTime > remoteTime ? local : remote;
      const result = { ...remote };
      for (const [key, value] of Object.entries(local)) {
        result[key] = Object.prototype.hasOwnProperty.call(result, key) ? mergeValues(result[key], value) : value;
      }
      return result;
    }

    return local;
  }

  function mergeRaw(remoteRaw, localRaw) {
    if (remoteRaw === localRaw) return localRaw;
    const remote = json(remoteRaw);
    const local = json(localRaw);
    if (!remote.ok || !local.ok) return localRaw;
    try { return JSON.stringify(mergeValues(remote.value, local.value)); }
    catch { return localRaw; }
  }

  function status(next, error = null) {
    cloud.status = next;
    cloud.error = error;
    window.dispatchEvent(new CustomEvent('gcse-cloud-sync-status', {
      detail: { status: next, error, lastSync: cloud.lastSync, userId: cloud.userId }
    }));
  }

  function setMeta(meta, userId, key, raw, syncedAt = new Date().toISOString()) {
    meta[userId] ||= {};
    meta[userId][key] = { hash: fingerprint(raw), syncedAt };
  }

  async function fetchRows(userId) {
    const { data, error } = await client.from(TABLE).select('state_key,state_value,updated_at').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  }

  async function upsert(userId, entries) {
    if (!entries.length) return;
    const now = new Date().toISOString();
    const rows = entries.map(entry => ({
      user_id: userId,
      state_key: entry.key,
      state_value: { raw: entry.raw },
      updated_at: entry.updatedAt || now
    }));
    const { error } = await client.from(TABLE).upsert(rows, { onConflict: 'user_id,state_key' });
    if (error) throw error;
  }

  async function remove(userId, keys) {
    if (!keys.length) return;
    const { error } = await client.from(TABLE).delete().eq('user_id', userId).in('state_key', keys);
    if (error) throw error;
  }

  function requestReload(userId) {
    const key = `__gcse_cloud_reload_${userId}`;
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
    window.location.reload();
  }

  function clearReloadGuard(userId) {
    const key = `__gcse_cloud_reload_${userId}`;
    window.setTimeout(() => sessionStorage.removeItem(key), 5000);
  }

  async function initialSync(userId) {
    cloud.busy = true;
    status('syncing');
    try {
      const rows = await fetchRows(userId);
      const remote = new Map(rows.map(row => [row.state_key, row]));
      const local = scanLocal();
      const meta = loadMeta();
      const userMeta = meta[userId] || {};
      const uploads = [];
      let changedLocal = false;

      for (const row of rows) {
        const key = row.state_key;
        if (!eligible(key)) continue;
        const remoteRaw = rowRaw(row);
        const localRaw = local.get(key);
        const prior = userMeta[key];
        const remoteTime = Date.parse(row.updated_at || 0) || 0;
        const priorTime = Date.parse(prior?.syncedAt || 0) || 0;
        const localUnchanged = localRaw !== undefined && prior?.hash === fingerprint(localRaw);

        if (localRaw === undefined) {
          localStorage.setItem(key, remoteRaw);
          local.set(key, remoteRaw);
          setMeta(meta, userId, key, remoteRaw, row.updated_at);
          changedLocal = true;
          continue;
        }

        if (localRaw === remoteRaw) {
          setMeta(meta, userId, key, localRaw, row.updated_at);
          continue;
        }

        if (localUnchanged && remoteTime > priorTime) {
          localStorage.setItem(key, remoteRaw);
          local.set(key, remoteRaw);
          setMeta(meta, userId, key, remoteRaw, row.updated_at);
          changedLocal = true;
          continue;
        }

        const mergedRaw = mergeRaw(remoteRaw, localRaw);
        if (mergedRaw !== localRaw) {
          localStorage.setItem(key, mergedRaw);
          local.set(key, mergedRaw);
          changedLocal = true;
        }
        if (mergedRaw !== remoteRaw) uploads.push({ key, raw: mergedRaw });
        else setMeta(meta, userId, key, mergedRaw, row.updated_at);
      }

      for (const [key, raw] of local.entries()) {
        if (!remote.has(key)) uploads.push({ key, raw });
      }

      if (uploads.length) {
        await upsert(userId, uploads);
        const syncedAt = new Date().toISOString();
        uploads.forEach(item => setMeta(meta, userId, item.key, item.raw, syncedAt));
      }

      saveMeta(meta);
      cloud.snapshot = scanLocal();
      cloud.lastPull = Date.now();
      cloud.lastSync = new Date().toISOString();
      status('synced');
      clearReloadGuard(userId);
      if (changedLocal) requestReload(userId);
    } catch (error) {
      console.warn('[GCSE Cloud] Initial sync failed', error?.message || error);
      status('error', error?.message || 'Cloud sync failed');
    } finally {
      cloud.busy = false;
    }
  }

  async function pushChanges() {
    const userId = cloud.userId;
    if (!userId || cloud.busy) return;
    const current = scanLocal();
    const changed = [];
    const removed = [];

    for (const [key, raw] of current.entries()) if (cloud.snapshot.get(key) !== raw) changed.push({ key, raw });
    for (const key of cloud.snapshot.keys()) if (!current.has(key)) removed.push(key);
    if (!changed.length && !removed.length) return;

    cloud.busy = true;
    status('syncing');
    try {
      await upsert(userId, changed);
      await remove(userId, removed);
      const meta = loadMeta();
      const syncedAt = new Date().toISOString();
      changed.forEach(item => setMeta(meta, userId, item.key, item.raw, syncedAt));
      if (meta[userId]) removed.forEach(key => delete meta[userId][key]);
      saveMeta(meta);
      cloud.snapshot = current;
      cloud.lastSync = syncedAt;
      status('synced');
    } catch (error) {
      console.warn('[GCSE Cloud] Save failed', error?.message || error);
      status('error', error?.message || 'Could not save learning data');
    } finally {
      cloud.busy = false;
    }
  }

  async function pullChanges() {
    const userId = cloud.userId;
    if (!userId || cloud.busy || Date.now() - cloud.lastPull < PULL_COOLDOWN_MS) return;
    cloud.busy = true;
    cloud.lastPull = Date.now();
    try {
      const rows = await fetchRows(userId);
      const meta = loadMeta();
      const userMeta = meta[userId] || {};
      let changedLocal = false;

      for (const row of rows) {
        if (!eligible(row.state_key)) continue;
        const key = row.state_key;
        const remoteRaw = rowRaw(row);
        const localRaw = localStorage.getItem(key);
        const prior = userMeta[key];
        const localUnchanged = localRaw !== null && prior?.hash === fingerprint(localRaw);
        const remoteTime = Date.parse(row.updated_at || 0) || 0;
        const priorTime = Date.parse(prior?.syncedAt || 0) || 0;

        if (localRaw === null || (localUnchanged && remoteTime > priorTime && remoteRaw !== localRaw)) {
          localStorage.setItem(key, remoteRaw);
          setMeta(meta, userId, key, remoteRaw, row.updated_at);
          changedLocal = true;
        }
      }

      saveMeta(meta);
      cloud.snapshot = scanLocal();
      cloud.lastSync = new Date().toISOString();
      status('synced');
      if (changedLocal) requestReload(userId);
    } catch (error) {
      console.warn('[GCSE Cloud] Refresh failed', error?.message || error);
      status('error', error?.message || 'Could not refresh cloud data');
    } finally {
      cloud.busy = false;
    }
  }

  function stopSync() {
    if (cloud.interval) clearInterval(cloud.interval);
    cloud.interval = null;
    cloud.userId = null;
    cloud.startingUserId = null;
    cloud.snapshot = new Map();
    cloud.lastPull = 0;
    cloud.lastSync = null;
    cloud.error = null;
    status('idle');
  }

  async function startSync(session) {
    const userId = session?.user?.id;
    if (!userId) {
      stopSync();
      return;
    }
    if (cloud.userId === userId || cloud.startingUserId === userId) return;

    if (cloud.userId && cloud.userId !== userId) stopSync();
    cloud.startingUserId = userId;
    cloud.snapshot = scanLocal();
    await initialSync(userId);
    if (cloud.startingUserId !== userId) return;
    cloud.startingUserId = null;
    cloud.userId = userId;
    if (cloud.interval) clearInterval(cloud.interval);
    cloud.interval = setInterval(pushChanges, POLL_MS);
  }

  window.addEventListener('gcse-auth-changed', event => {
    startSync(event.detail?.signedIn ? { user: event.detail.user } : null);
  });

  window.addEventListener('storage', event => {
    if (eligible(event.key)) setTimeout(pushChanges, 50);
  });

  window.addEventListener('focus', () => {
    pushChanges();
    pullChanges();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      pushChanges();
      pullChanges();
    }
  });

  setTimeout(() => {
    if (cloud.userId || cloud.startingUserId) return;
    client.auth.getSession().then(({ data }) => startSync(data?.session || null));
  }, 500);

  window.GCSE_CLOUD_SYNC = {
    syncNow: async () => {
      await pushChanges();
      await pullChanges();
      return { status: cloud.status, lastSync: cloud.lastSync, error: cloud.error };
    },
    status: () => ({
      status: cloud.status,
      lastSync: cloud.lastSync,
      error: cloud.error,
      signedIn: Boolean(cloud.userId || cloud.startingUserId),
      savedKeys: cloud.snapshot.size
    })
  };
})();
