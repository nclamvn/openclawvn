import type { IconName } from "./icons.js";
import { t } from "./i18n";

// Tab groups with translation keys - Minimal 2-group structure
export const TAB_GROUPS = [
  {
    label: "core",
    labelKey: "core",
    tabs: ["chat", "overview", "channels", "memory"],
    icon: "messageSquare",
    shortcut: "1"
  },
  {
    label: "admin",
    labelKey: "admin",
    tabs: ["config", "skills", "nodes", "debug", "logs"],
    icon: "settings",
    shortcut: "2"
  },
  {
    label: "deploy",
    labelKey: "deployGroup",
    tabs: ["projects", "deploy", "preview"],
    icon: "rocket",
    shortcut: "3"
  },
  {
    label: "eldercare",
    labelKey: "eldercare",
    tabs: ["eldercare", "eldercare-config"],
    icon: "activity",
    shortcut: "4"
  },
] as const;

export function getTabGroupLabel(group: (typeof TAB_GROUPS)[number]): string {
  const translations = t();
  switch (group.labelKey) {
    case "core":
      return (translations.nav as Record<string, string>).core ?? "Core";
    case "admin":
      return (translations.nav as Record<string, string>).admin ?? "Admin";
    case "deployGroup":
      return (translations.nav as Record<string, string>).deployGroup ?? "Deploy";
    case "eldercare":
      return (translations.nav as Record<string, string>).eldercare ?? "Eldercare";
    // Legacy fallbacks
    case "conversations":
      return translations.nav.conversations ?? "CONVERSATIONS";
    case "connections":
      return translations.nav.connections ?? "CONNECTIONS";
    case "activity":
      return translations.nav.activity ?? "ACTIVITY";
    case "settings":
      return translations.nav.settings;
    default:
      return group.label.toUpperCase();
  }
}

export function getTabGroupShortcut(group: (typeof TAB_GROUPS)[number]): string {
  return (group as { shortcut?: string }).shortcut ?? "";
}

export type Tab =
  | "overview"
  | "channels"
  | "instances"
  | "sessions"
  | "cron"
  | "skills"
  | "nodes"
  | "chat"
  | "memory"
  | "config"
  | "debug"
  | "logs"
  | "projects"
  | "deploy"
  | "preview"
  | "eldercare"
  | "eldercare-config";

const TAB_PATHS: Record<Tab, string> = {
  overview: "/overview",
  channels: "/channels",
  instances: "/instances",
  sessions: "/sessions",
  cron: "/cron",
  skills: "/skills",
  memory: "/memory",
  nodes: "/nodes",
  chat: "/chat",
  config: "/config",
  debug: "/debug",
  logs: "/logs",
  projects: "/projects",
  deploy: "/deploy",
  preview: "/preview",
  eldercare: "/eldercare",
  "eldercare-config": "/eldercare-config",
};

const PATH_TO_TAB = new Map(Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab as Tab]));

export function normalizeBasePath(basePath: string): string {
  if (!basePath) return "";
  let base = basePath.trim();
  if (!base.startsWith("/")) base = `/${base}`;
  if (base === "/") return "";
  if (base.endsWith("/")) base = base.slice(0, -1);
  return base;
}

export function normalizePath(path: string): string {
  if (!path) return "/";
  let normalized = path.trim();
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

export function pathForTab(tab: Tab, basePath = ""): string {
  const base = normalizeBasePath(basePath);
  const path = TAB_PATHS[tab];
  return base ? `${base}${path}` : path;
}

export function tabFromPath(pathname: string, basePath = ""): Tab | null {
  const base = normalizeBasePath(basePath);
  let path = pathname || "/";
  if (base) {
    if (path === base) {
      path = "/";
    } else if (path.startsWith(`${base}/`)) {
      path = path.slice(base.length);
    }
  }
  let normalized = normalizePath(path).toLowerCase();
  if (normalized.endsWith("/index.html")) normalized = "/";
  if (normalized === "/") return "chat";
  return PATH_TO_TAB.get(normalized) ?? null;
}

export function inferBasePathFromPathname(pathname: string): string {
  let normalized = normalizePath(pathname);
  if (normalized.endsWith("/index.html")) {
    normalized = normalizePath(normalized.slice(0, -"/index.html".length));
  }
  if (normalized === "/") return "";
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) return "";
  for (let i = 0; i < segments.length; i++) {
    const candidate = `/${segments.slice(i).join("/")}`.toLowerCase();
    if (PATH_TO_TAB.has(candidate)) {
      const prefix = segments.slice(0, i);
      return prefix.length ? `/${prefix.join("/")}` : "";
    }
  }
  return `/${segments.join("/")}`;
}

export function iconForTab(tab: Tab): IconName {
  switch (tab) {
    case "chat":
      return "messageSquare";
    case "overview":
      return "barChart";
    case "channels":
      return "link";
    case "instances":
      return "radio";
    case "sessions":
      return "fileText";
    case "cron":
      return "loader";
    case "memory":
      return "brain";
    case "skills":
      return "zap";
    case "nodes":
      return "monitor";
    case "config":
      return "settings";
    case "debug":
      return "bug";
    case "logs":
      return "scrollText";
    case "projects":
      return "folder";
    case "deploy":
      return "rocket";
    case "preview":
      return "globe";
    case "eldercare":
      return "activity";
    case "eldercare-config":
      return "settings";
    default:
      return "folder";
  }
}

export function titleForTab(tab: Tab) {
  const translations = t();
  switch (tab) {
    case "overview":
      return translations.nav.overview;
    case "channels":
      return translations.nav.channels;
    case "instances":
      return translations.nav.instances;
    case "sessions":
      return translations.nav.sessions;
    case "cron":
      return translations.nav.cronJobs;
    case "memory":
      return translations.nav.memory;
    case "skills":
      return translations.nav.skills;
    case "nodes":
      return translations.nav.nodes;
    case "chat":
      return translations.nav.chat;
    case "config":
      return translations.nav.config;
    case "debug":
      return translations.nav.debug;
    case "logs":
      return translations.nav.logs;
    case "projects":
      return translations.nav.projects;
    case "deploy":
      return translations.nav.deploy;
    case "preview":
      return translations.nav.preview;
    case "eldercare":
      return (translations.nav as Record<string, string>).eldercare ?? "Eldercare";
    case "eldercare-config":
      return (translations.nav as Record<string, string>).eldercareConfig ?? "Eldercare Config";
    default:
      return translations.nav.control;
  }
}

export function subtitleForTab(tab: Tab) {
  const subtitles = t().nav.subtitles;
  switch (tab) {
    case "overview":
      return subtitles.overview;
    case "channels":
      return subtitles.channels;
    case "instances":
      return subtitles.instances;
    case "sessions":
      return subtitles.sessions;
    case "cron":
      return subtitles.cron;
    case "memory":
      return subtitles.memory;
    case "skills":
      return subtitles.skills;
    case "nodes":
      return subtitles.nodes;
    case "chat":
      return subtitles.chat;
    case "config":
      return subtitles.config;
    case "debug":
      return subtitles.debug;
    case "logs":
      return subtitles.logs;
    case "projects":
      return subtitles.projects;
    case "deploy":
      return subtitles.deploy;
    case "preview":
      return subtitles.preview;
    case "eldercare":
      return (subtitles as Record<string, string>).eldercare ?? "";
    case "eldercare-config":
      return (subtitles as Record<string, string>).eldercareConfig ?? "";
    default:
      return "";
  }
}
