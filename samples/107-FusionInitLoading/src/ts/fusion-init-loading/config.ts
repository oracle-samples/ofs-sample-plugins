import { PersistedPluginState, RuntimeConfig } from "./types";

const DEFAULT_PAGE_LIMIT = 500;
const DEFAULT_TITLE = "Fusion Init Loading";
const DEFAULT_SUBTITLE =
  "Cached Fusion data loaded during init and rendered instantly on open.";
const DEFAULT_EMPTY_MESSAGE =
  "No cached Fusion data is available yet. Configure the plugin secured params and wait for the background wakeup, or use Refresh now.";

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

function parseQuery(rawValue: string | undefined): Record<string, string> {
  if (!rawValue) {
    return {};
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return {};
  }

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      return Object.entries(parsed).reduce((accumulator, [key, value]) => {
        accumulator[key] = value === null || value === undefined ? "" : String(value);
        return accumulator;
      }, {} as Record<string, string>);
    } catch {
      return {};
    }
  }

  const normalizedQuery = trimmed.startsWith("?") ? trimmed.slice(1) : trimmed;
  const searchParams = new URLSearchParams(normalizedQuery);
  const query: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return query;
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

export function buildCacheKey(config: RuntimeConfig): string {
  return JSON.stringify({
    fusionPath: config.fusionPath,
    itemsPath: config.itemsPath || "",
    queryParams: config.queryParams,
    pageLimit: config.pageLimit,
  });
}

export function resolveRuntimeConfig(
  config: RuntimeConfig,
  state: PersistedPluginState
): RuntimeConfig {
  const resolvedQueryParams = Object.entries(config.queryParams).reduce(
    (accumulator, [key, value]) => {
      accumulator[key] = resolveTemplate(value, state) || "";
      return accumulator;
    },
    {} as Record<string, string>
  );

  return {
    ...config,
    fusionPath: resolveTemplate(config.fusionPath, state) || config.fusionPath,
    queryParams: resolvedQueryParams,
    itemsPath: resolveTemplate(config.itemsPath, state) || config.itemsPath,
    title: resolveTemplate(config.title, state) || config.title,
    subtitle: resolveTemplate(config.subtitle, state) || config.subtitle,
    emptyStateMessage:
      resolveTemplate(config.emptyStateMessage, state) || config.emptyStateMessage,
  };
}

export function parseRuntimeConfig(
  securedData?: Record<string, unknown>
): RuntimeConfig | null {
  const normalizedSecuredData = normalizeParams(securedData);
  const fusionPath =
    normalizedSecuredData.fusionPath?.trim() ||
    normalizedSecuredData.FUSION_PATH?.trim() ||
    normalizedSecuredData.defaultFusionPath?.trim() ||
    normalizedSecuredData.DEFAULT_FUSION_PATH?.trim() ||
    "";

  if (!fusionPath) {
    return null;
  }

  const query =
    normalizedSecuredData.fusionQuery ||
    normalizedSecuredData.FUSION_QUERY ||
    normalizedSecuredData.defaultFusionQuery ||
    normalizedSecuredData.DEFAULT_FUSION_QUERY;

  return {
    fusionPath,
    queryParams: parseQuery(query),
    pageLimit: parsePositiveInt(
      normalizedSecuredData.pageLimit ||
        normalizedSecuredData.PAGE_LIMIT ||
        normalizedSecuredData.defaultPageLimit ||
        normalizedSecuredData.DEFAULT_PAGE_LIMIT,
      DEFAULT_PAGE_LIMIT
    ),
    itemsPath:
      normalizedSecuredData.itemsPath?.trim() ||
      normalizedSecuredData.ITEMS_PATH?.trim() ||
      normalizedSecuredData.defaultItemsPath?.trim() ||
      normalizedSecuredData.DEFAULT_ITEMS_PATH?.trim() ||
      undefined,
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
        normalizedSecuredData.enableLogging ||
        normalizedSecuredData.ENABLE_LOGGING
    ),
  };
}
