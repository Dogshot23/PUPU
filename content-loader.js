// PUPU - Content Loader
// Reads the module registry, checks each module's manifest, fetches each
// enabled module's interactions file, and combines everything into one
// flat array -- the same flat shape brain.js already expects from the
// old MISSIONS constant.
//
// This file is intentionally standalone right now: it is not included
// in index.html and nothing calls it yet. Once wired in, brain.js will
// only ever need ContentLoader.getInteractions() -- it will stay just
// as unaware of modules/registries/manifests as it is today.
//
// Not integrated into the app in this step, per task scope.

const CONTENT_ROOT = "content";
const REGISTRY_PATH = `${CONTENT_ROOT}/registry.json`;
const INTERACTIONS_FILENAME = "interactions.json";

// Holds the combined interactions array once loading has completed.
// Starts empty so getInteractions() has something sane to return even
// if called before load() resolves, or if loading fails entirely.
let loadedInteractions = [];

// ---------- Internal helpers ----------

// Compatibility fields (text/en/ko) exist ONLY so brain.js/script.js --
// which still only know how to display a single English string and a
// single Korean string per mission -- can keep working unmodified
// against the new, richer interaction schema. The richer schema
// (english[], translations{}, type, level, tags, emotion, animation)
// remains the source of truth and is preserved untouched on every
// returned object; text/en/ko are derived, disposable projections of
// it, not a replacement for it. Anything that later wants tags,
// emotion, weighting, etc. should read the original fields, not the
// compatibility ones.
function normalizeInteraction(raw) {
  const text = Array.isArray(raw.english) ? raw.english.join(" ") : "";
  const ko = Array.isArray(raw.translations?.ko) ? raw.translations.ko.join(" ") : "";

  return {
    ...raw,
    text,
    en: text,
    ko
  };
}

// Fetches and parses a single JSON file. Kept as one shared helper
// since every step of loading (registry, manifests, interaction
// files) is "fetch a URL, parse JSON" and nothing more.
async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Content loader: failed to fetch ${path} (${response.status})`);
  }

  return response.json();
}

// Loads a single module given its registry entry. The entry's `path`
// is resolved relative to CONTENT_ROOT -- modules are no longer
// assumed to live directly under content/, so a registry entry can
// point anywhere underneath it (content/core, content/packs/xyz,
// content/user/xyz, etc).
//
// Returns an array (empty if the module is disabled). Any failure --
// a missing/invalid manifest, a missing/invalid interactions file, a
// network error -- is caught here rather than propagating out, so one
// broken module can't stop every other module from loading. Failures
// are logged as warnings, not thrown, since a single optional module
// being unavailable is not an application-breaking condition.
async function loadModule(entry) {
  const modulePath = `${CONTENT_ROOT}/${entry.path}`;
  const manifestPath = `${modulePath}/module.json`;

  try {
    const manifest = await fetchJson(manifestPath);

    if (!manifest.enabled) {
      return [];
    }

    const interactionsPath = `${modulePath}/${INTERACTIONS_FILENAME}`;
    const interactions = await fetchJson(interactionsPath);

    return interactions.map(normalizeInteraction);
  } catch (error) {
    console.warn(
      `Content loader: skipping module "${entry.id ?? entry.path}" -- ${error.message}`
    );
    return [];
  }
}

// ---------- Public Content Loader API ----------
const ContentLoader = {
  // Loads the registry, loads every listed module, and combines all
  // enabled modules' interactions into one flat array. Resolves with
  // that array once everything has loaded; also stores it internally
  // so getInteractions() can return it synchronously afterwards.
  //
  // A module that fails to load (bad manifest, missing file, bad
  // path, etc) is skipped rather than aborting the whole load -- see
  // loadModule's try/catch. Only a failure to load the registry itself
  // is treated as fatal, since without it there is nothing to load.
  async load() {
    const registry = await fetchJson(REGISTRY_PATH);
    const moduleEntries = registry.modules ?? [];

    const perModuleInteractions = await Promise.all(
      moduleEntries.map((entry) => loadModule(entry))
    );

    loadedInteractions = perModuleInteractions.flat();
    return loadedInteractions;
  },

  // Synchronously returns whatever has been loaded so far (empty array
  // if load() hasn't resolved yet, or if every module failed to load).
  // This is the method brain.js will eventually call -- it never
  // awaits anything itself.
  getInteractions() {
    return loadedInteractions;
  }
};
