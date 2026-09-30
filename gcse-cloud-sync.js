(() => {
  'use strict';

  const TABLE = 'gcse_user_state';
  const LOCAL_PREFIX = 'gcse-';
  const META_KEY = '__gcse_cloud_sync_meta_v1';
  const POLL_MS = 1400;
  const PULL_COOLDOWN_MS = 15000;

  const auth = window.GCSE_AUTH;
  const client = auth?.client;
  if (!auth || !client) {
    console.warn('[GCSE Cloud] Account client is not available.');
    return;
  }

  const cloud = {
    userId: null,
    interval: null,
    snapshot: new Map(),
    busy: false,
    lastPull: 0,
    lastSync: null,
    status: 'idle',
    error: null
  };

  const safeParse = (value, fallback) => {
    try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
  };

  const loadMeta = () => safeParse(localStorage.getItem(META_KEY), {});
  const saveMeta = meta => {
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch {}
  };

  function fingerprint(value = '') {
    const text = String(value);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `${(hash >>> 0).toString(36)}:${text.length}`;
  }

  function eligibleKey(key) {
    return typeof key === 'string' && key.startsWith(LOCAL_PREFIX) && key.length <= 200;
  }

  function scanLocal() {
    const map = new Map();
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!eligibleKey(key)) continue;
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

  function parseMaybeJson(raw) {
    try { return { ok: true, value: JSON.parse(raw) }; }
    catch { return { ok: false, value: raw }; }
  }

  function timeValue(value) {
    if (!value || typeof value !== 'object') return 0;
    const candidate = value.updated ?? value.updatedAt ?? value.updated_at ?? value.timestamp ?? value.created ?? value.date ?? null;
    if (candidate === null || candidate === undefined) return 0;
    if (typeof candidate === 'number') return Number.isFinite(candidate) ? candidate : 0;
    const parsed = Date.parse(candidate);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function mergeArrays(cloudValue, localValue) {
    const allObjects = [...cloudValue, ...localValue].every(item => item && typeof item === 'object' && !Array.isArray(item));
    const hasIds = allObjects && [...cloudValue, ...localValue].some(item => item.id !== undefined && item.id !== null);

    if (hasIds) {
      const byId = new Map();
      for (const item of cloudValue) byId.set(String(item.id), item);
      for (const item of localValue) {
        const id = String(item.id);
        if (!byId.has(id)) {
          byId.set(id, item);
          continue;
        }
        byId.set(id, mergeValues(byId.get(id), item));
      }
      return [...byId.values()].sort((a, b) => {
        const aTime = timeValue(a);
        const bTime = timeValue(b);
        return aTime && bTime ? aTime - bTime : 0;
      });
    }

    const seen = new Set();
    const merged = [];
    for (const item of [...cloudValue, ...localValue]) {
      let key;
      try { key = JSON.stringify(item); } catch { key = String(item); }
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
    return merged;
  }

  function mergeValues(cloudValue, localValue) {
    if (Array.isArray(cloudValue) && Array.isArray(localValue)) return mergeArrays(cloudValue, localValue);

    if (cloudValue && localValue && typeof cloudValue === 'object' && typeof localValue === 'object' && !Array.isArray(cloudValue) && !Array.isArray(localValue)) {
      const cloudTime = timeValue(cloudValue);
      const localTime = timeValue(localValue);
      if (cloudTime && localTime && cloudTime !== localTime) return localTime > cloudTime ? localValue : cloudValue;

      const merged = { ...cloudValue };
      for (const [key, value] of Object.entries(localValue)) {
        if (!Object.prototype.hasOwnProperty.call(merged, key)) merged[key] = value;
        else merged[key] = mergeValues(merged[key], value);
      }
      return merged;
    }

    return localValue;
  }

  function mergeRaw(cloudRaw, localRaw) {
    if (cloudRaw === localRaw) return localRaw;
    const cloudParsed = parseMaybeJson(cloudRaw);
    const localParsed = parseMaybeJson(localRaw);
    if (!cloudParsed.ok || !localParsed.ok) return localRaw;
    try { return JSON.stringify(mergeValues(cloudParsed.value, localParsed.value)); }
    catch { return localRaw; }
  }

  function updateStatus(status, error = null) {
    cloud.status = status;
    cloud.error = error;
    window.dispatchEvent(new CustomEvent('gcse-cloud-sync-status', {
      detail: {
        status: cloud.status,
        error: cloud.error,
        lastSync: cloud.lastSync,
        userId: cloud.userId
      }
    }));
  }

  function requestReload(userId) {
    const key = `__gcse_cloud_reload_${userId}`;
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
    window.location.reload();
  }

  function clearReloadGuardLater(userId) {
    const key = `__gcse_cloud_reload_${userId}`;
    window.setTimeout(() => sessionStorage.removeItem(key), 5000);
  }

  async function fetchCloudRows(userId) {
    const { data, error } = await client
      .from(TABLE)
      .select('state_key,state_value,updated_at')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  }

  async function upsertRows(userId, items) {
    if (!items.length) return;
    const now = new Date().toISOString();
    const rows = items.map(({ key, raw, updatedAt }) => ({
      user_id: userId,
      state_key: key,
      state_value: { raw },
      updated_at: updatedAt || now
    }));
    const { error } = await client
      .from(TABLE)
      .upsert(rows, { onConflict: 'user_id,state_key' });
    if (error) throw error;
  }

  async function deleteRows(userId, keys) {
    if (!keys.length) return;
    const { error } = await client
      .from(TABLE)
      .delete()
      .eq('user_id', userId)
      .in('state_key', keys);
    if (error) throw error;
  }

  function setMetaEntry(meta, userId, key, raw, syncedAt) {
    meta[userId] ||= {};
    meta[userId][key] = {
      hash: fingerprint(raw),
      syncedAt: syncedAt || new Date().toISOString()
    };
  }

  async function initialSync(userId) {
    if (!userId || cloud.busy) return;
    cloud.busy = true;
    updateStatus('syncing');

    try {
      const [rows, local] = await Promise.all([fetchCloudRows(userId), Promise.resolve(scanLocal())]);
      const cloudByKey = new Map(rows.map(row => [row.state_key, row]));
      const meta = loadMeta();
      const userMeta = meta[userId] || {};
      const uploads = [];
      let changedLocal = false;

      for (const row of rows) {
        const key = row.state_key;
        if (!eligibleKey(key)) continue;
        const cloudRaw = rowRaw(row);
        const localRaw = local.get(key);
        const cloudTime = Date.parse(row.updated_at || 0) || 0;
        const prior = userMeta[key];
        const localUnchangedSinceLastSync = localRaw !== undefined && prior?.hash === fingerprint(localRaw);
        const priorSyncTime = Date.parse(prior?.syncedAt || 0) || 0;

        if (localRaw === undefined) {
          localStorage.setItem(key, cloudRaw);
          local.set(key, cloudRaw);
          changedLocal = true;
          setMetaEntry(meta, userId, key, cloudRaw, row.updated_at);
          continue;
        }

        if (localRaw === cloudRaw) {
          setMetaEntry(meta, userId, key, localRaw, row.updated_at);
          continue;
        }

        if (localUnchangedSinceLastSync && cloudTime > priorSyncTime) {
          localStorage.setItem(key, cloudRaw);
          local.set(key, cloudRaw);
          changedLocal = true;
          setMetaEntry(meta, userId, key, cloudRaw, row.updated_at);
          continue;
        }

        const mergedRaw = mergeRaw(cloudRaw, localRaw);
        if (mergedRaw !== localRaw) {
          localStorage.setItem(key, mergedRaw);
          local.set(key, mergedRaw);
          changedLocal = true;
        }
        if (mergedRaw !== cloudRaw) uploads.push({ key, raw: mergedRaw });
        else setMetaEntry(meta, userId, key, mergedRaw, row.updated_at);
      }

      for (const [key, raw] of local.entries()) {
        if (!cloudByKey.has(key)) uploads.push({ key, raw });
      }

      if (uploads.length) {
        await upsertRows(userId, uploads);
        const syncedAt = new Date().toISOString();
        for (const item of uploads) setMetaEntry(meta, userId, item.key, item.raw, syncedAt);
      }

      saveMeta(meta);
      cloud.snapshot = scanLocal();
      cloud.lastSync = new Date().toISOString();
      cloud.lastPull = Date.now();
      updateStatus('synced');
      clearReloadGuardLater(userId);

      if (changedLocal) requestReload(userId);
    } catch (error) {
      console.warn('[GCSE Cloud] Initial sync failed', error?.message || error);
      updateStatus('error', error?.message || 'Cloud sync failed');
    } finally {
      cloud.busy = false;
    }
  }

  async function pushChangedLocal() {
    const userId = cloud.userId;
    if (!userId || cloud.busy) return;

    const current = scanLocal();
    const changed = [];
    const removed = [];

    for (const [key, raw] of current.entries()) {
      if (cloud.snapshot.get(key) !== raw) changed.push({ key, raw });
    }
    for (const key of cloud.snapshot.keys()) {
      if (!current.has(key)) removed.push(key);
    }

    if (!changed.length && !removed.length) return;

    cloud.busy = true;
    updateStatus('syncing');
    try {
      if (changed.length) await upsertRows(userId, changed);
      if (removed.length) await deleteRows(userId, removed);

      const meta = loadMeta();
      const syncedAt = new Date().toISOString();
      for (const item of changed) setMetaEntry(meta, userId, item.key, item.raw, syncedAt);
      if (meta[userId]) for (const key of removed) delete meta[userId][key];
      saveMeta(meta);

      cloud.snapshot = current;
      cloud.lastSync = syncedAt;
      updateStatus('synced');
    } catch (error) {
      console.warn('[GCSE Cloud] Save failed', error?.message || error);
      updateStatus('error', error?.message || 'Could not save learning data');
    } finally {
      cloud.busy = false;
    }
  }

  async function pullNewerCloudState() {
    const userId = cloud.userId;
    if (!userId || cloud.busy || Date.now() - cloud.lastPull < PULL_COOLDOWN_MS) return;
    cloud.lastPull = Date.now();
    cloud.busy = true;

    try {
      const rows = await fetchCloudRows(userId);
      const meta = loadMeta();
      const userMeta = meta[userId] || {};
      let changedLocal = false;

      for (const row of rows) {
        const key = row.state_key;
        if (!eligibleKey(key)) continue;
        const cloudRaw = rowRaw(row);
        const localRaw = localStorage.getItem(key);
        const prior = userMeta[key];
        const localIsUnchanged = localRaw !== null && prior?.hash === fingerprint(localRaw);
        const cloudTime = Date.parse(row.updated_at || 0) || 0;
        const priorTime = Date.parse(prior?.syncedAt || 0) || 0;

        if (localRaw === null || (localIsUnchanged && cloudTime > priorTime && cloudRaw !== localRaw)) {
          localStorage.setItem(key, cloudRaw);
          setMetaEntry(meta, userId, key, cloudRaw, row.updated_at);
          changedLocal = true;
        }
      }

      saveMeta(meta);
      cloud.snapshot = scanLocal();
      cloud.lastSync = new Date().toISOString();
      updateStatus('synced');
      if (changedLocal) requestReload(userId);
    } catch (error) {
      console.warn('[GCSE Cloud] Pull failed', error?.message || error);
      updateStatus('error', error?.message || 'Could not refresh cloud data');
    } finally {
      cloud.busy = false;
    }
  }

  function stopSync() {
    if (cloud.interval) window.clearInterval(cloud.interval);
    cloud.interval = null;
    cloud.userId = null;
    cloud.snapshot = new Map();
    cloud.lastPull = 0;
    cloud.lastSync = null;
    cloud.error = null;
    updateStatus('idle');
  }

  async function startSync(session) {
    const userId = session?.user?.id;
    if (!userId) {
      stopSync();
      return;
    }

    if (cloud.userId === userId && cloud.interval) return;
    stopSync();
    cloud.userId = userId;
    cloud.snapshot = scanLocal();
    await initialSync(userId);

    if (cloud.userId !== userId) return;
    cloud.interval = window.setInterval(pushChangedLocal, POLL_MS);
  }

  window.addEventListener('gcse-auth-changed', event => {
    startSync(event.detail?.signedIn ? { user: event.detail.user } : null);
  });

  window.addEventListener('storage', event => {
    if (eligibleKey(event.key)) window.setTimeout(pushChangedLocal, 50);
  });

  window.addEventListener('focus', () => {
    pushChangedLocal();
    pullNewerCloudState();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      pushChangedLocal();
      pullNewerCloudState();
    }
  });

  window.addEventListener('pagehide', () => { pushChangedLocal(); });

  client.auth.getSession().then(({ data }) => startSync(data?.session || null));

  window.GCSE_CLOUD_SYNC = {
    syncNow: async () => {
      await pushChangedLocal();
      await pullNewerCloudState();
      return { status: cloud.status, lastSync: cloud.lastSync, error: cloud.error };
    },
    status: () => ({
      status: cloud.status,
      lastSync: cloud.lastSync,
      error: cloud.error,
      signedIn: Boolean(cloud.userId),
      savedKeys: cloud.snapshot.size
    })
  };
})();
