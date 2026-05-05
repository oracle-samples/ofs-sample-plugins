import { PersistedPluginState, RuntimeConfig } from "./types";

const DEFAULT_ASSETS_PATH =
  "/fscmRestApi/resources/11.13.18.05/installedBaseAssets";
const DEFAULT_PAGE_LIMIT = 500;
const DEFAULT_TITLE = "Asset Init Loading";
const DEFAULT_SUBTITLE =
  "Installed base assets are refreshed in the background and cached for offline use.";
const DEFAULT_EMPTY_MESSAGE =
  "No cached asset data is available yet. Wait for the background wakeup or use Refresh now.";

function normalizeParams(
  params: unknown
): Record<string, string | undefined> {
  if (!params) {
    return {};
  }

  if (typeof params === "string") {
    const trimmed = params.trim();
    if (!trimmed) {
      return {};
    }

    if (trimmed.startsWith("{")) {
      try {
        return normalizeParams(JSON.parse(trimmed));
      } catch {
        return {};
      }
    }

    const searchParams = new URLSearchParams(trimmed);
    const normalized: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      normalized[key] = value;
    });
    return normalized;
  }

  if (typeof params === "object") {
    return Object.entries(params as Record<string, unknown>).reduce(
      (accumulator, [key, value]) => {
        accumulator[key] =
          typeof value === "string" ? value : value?.toString();
        return accumulator;
      },
      {} as Record<string, string | undefined>
    );
  }

  return {};
}

function parseBooleanFlag(rawValue: string | undefined): boolean {
  if (!rawValue) {
    return false;
  }

  return ["true", "1", "yes", "on"].includes(rawValue.trim().toLowerCase());
}

function parsePositiveInt(rawValue: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(rawValue || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function lookupPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    return (current as Record<string, unknown>)[key];
  }, source);
}

function resolvePlaceholderValue(
  token: string,
  state: PersistedPluginState
): string {
  const trimmedToken = token.trim();

  if (!trimmedToken) {
    return "";
  }

  const scopedValue = lookupPath(
    {
      provider: state.provider || {},
      activity: state.activity || {},
      environment: state.environment || {},
      securedData: state.securedData || {},
      user: state.user || {},
      openParams:
        typeof state.openParams === "object" && state.openParams
          ? state.openParams
          : {},
    },
    trimmedToken
  );

  if (scopedValue !== undefined && scopedValue !== null) {
    return String(scopedValue);
  }

  const shorthandSources = [
    state.provider,
    state.activity,
    state.environment,
    state.securedData,
    state.user,
  ];

  for (const source of shorthandSources) {
    if (!source || typeof source !== "object") {
      continue;
    }
    const value = (source as Record<string, unknown>)[trimmedToken];
    if (value !== undefined && value !== null) {
      return String(value);
    }
  }

  return "";
}

function resolveTemplate(
  value: string | undefined,
  state: PersistedPluginState
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value
    .replace(/\$\{([^}]+)\}/g, (_match, token) =>
      resolvePlaceholderValue(token, state)
    )
    .replace(/\$([A-Za-z_][A-Za-z0-9_.]*)/g, (_match, token) =>
      resolvePlaceholderValue(token, state)
    );
}

export function buildCacheKey(
  config: RuntimeConfig,
  state: PersistedPluginState
): string {
  return JSON.stringify({
    assetsPath: config.assetsPath,
    pageLimit: config.pageLimit,
    userLogin: String(state.user?.ulogin || ""),
    faUrl: String(state.environment?.faUrl || ""),
    fsUrl: String(state.environment?.fsUrl || ""),
  });
}

export function resolveRuntimeConfig(
  config: RuntimeConfig,
  state: PersistedPluginState
): RuntimeConfig {
  return {
    ...config,
    assetsPath:
      resolveTemplate(config.assetsPath, state) || config.assetsPath,
    title: resolveTemplate(config.title, state) || config.title,
    subtitle: resolveTemplate(config.subtitle, state) || config.subtitle,
    emptyStateMessage:
      resolveTemplate(config.emptyStateMessage, state) || config.emptyStateMessage,
  };
}

export function parseRuntimeConfig(
  securedData?: Record<string, unknown>
): RuntimeConfig {
  const normalizedSecuredData = normalizeParams(securedData);

  return {
    assetsPath:
      normalizedSecuredData.assetsPath?.trim() ||
      normalizedSecuredData.ASSETS_PATH?.trim() ||
      normalizedSecuredData.defaultAssetsPath?.trim() ||
      normalizedSecuredData.DEFAULT_ASSETS_PATH?.trim() ||
      DEFAULT_ASSETS_PATH,
    pageLimit: parsePositiveInt(
      normalizedSecuredData.pageLimit ||
        normalizedSecuredData.PAGE_LIMIT ||
        normalizedSecuredData.defaultPageLimit ||
        normalizedSecuredData.DEFAULT_PAGE_LIMIT,
      DEFAULT_PAGE_LIMIT
    ),
    title:
      normalizedSecuredData.title?.trim() ||
      normalizedSecuredData.TITLE?.trim() ||
      DEFAULT_TITLE,
    subtitle:
      normalizedSecuredData.subtitle?.trim() ||
      normalizedSecuredData.SUBTITLE?.trim() ||
      DEFAULT_SUBTITLE,
    emptyStateMessage:
      normalizedSecuredData.emptyStateMessage?.trim() ||
      normalizedSecuredData.EMPTY_STATE_MESSAGE?.trim() ||
      DEFAULT_EMPTY_MESSAGE,
    enableLogging: parseBooleanFlag(
      normalizedSecuredData.enableLogging ||
        normalizedSecuredData.ENABLE_LOGGING ||
        normalizedSecuredData.logEnabled ||
        normalizedSecuredData.LOG_ENABLED
    ),
  };
}
