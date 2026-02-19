// ═══════════════════════════════════════════════════════════════
// COMMAND PALETTE
// ⌘K Quick actions and navigation (Linear/Raycast style)
// ═══════════════════════════════════════════════════════════════

import { html, nothing } from "lit";
import { icons } from "../icons";
import { titleForTab, TAB_GROUPS, type Tab } from "../navigation";
import { t } from "../i18n";

export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
}

export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon: keyof typeof icons;
  category: string;
  action: () => void;
}

export interface CommandPaletteProps {
  state: CommandPaletteState;
  connected: boolean;
  currentTab: Tab;
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onSelectIndex: (index: number) => void;
  onNavigate: (tab: Tab) => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onRefresh: () => void;
}

function getCommands(props: CommandPaletteProps): Command[] {
  const translations = t();
  const commands: Command[] = [];

  // Navigation commands — sidebar tabs + hidden tabs still accessible via ⌘K
  const allTabs: Tab[] = [
    ...TAB_GROUPS.flatMap(group => [...group.tabs]),
    "sessions", "instances", "cron", "skills",
  ];

  allTabs.forEach((tab, index) => {
    const group = TAB_GROUPS.find(g => g.tabs.includes(tab));
    const groupShortcut = (group as { shortcut?: string })?.shortcut;
    const isFirstInGroup = group?.tabs[0] === tab;

    commands.push({
      id: `nav-${tab}`,
      label: `Go to ${titleForTab(tab)}`,
      shortcut: isFirstInGroup && groupShortcut ? `⌘${groupShortcut}` : undefined,
      icon: getTabIcon(tab),
      category: "Navigation",
      action: () => props.onNavigate(tab),
    });
  });

  // Action commands
  commands.push({
    id: "new-chat",
    label: "Start New Chat",
    shortcut: "⌘N",
    icon: "plus",
    category: "Actions",
    action: props.onNewChat,
  });

  commands.push({
    id: "toggle-sidebar",
    label: "Toggle Sidebar",
    shortcut: "⌘B",
    icon: "panelLeft",
    category: "View",
    action: props.onToggleSidebar,
  });

  commands.push({
    id: "refresh",
    label: translations.common.refresh,
    shortcut: "⌘R",
    icon: "refreshCw",
    category: "Actions",
    action: props.onRefresh,
  });

  return commands;
}

function getTabIcon(tab: Tab): keyof typeof icons {
  const iconMap: Record<Tab, keyof typeof icons> = {
    chat: "messageSquare",
    sessions: "fileText",
    channels: "link",
    instances: "radio",
    overview: "barChart",
    cron: "loader",
    logs: "scrollText",
    config: "settings",
    skills: "zap",
    nodes: "monitor",
    debug: "bug",
  };
  return iconMap[tab] || "folder";
}

function filterCommands(commands: Command[], query: string): Command[] {
  if (!query.trim()) return commands;
  const q = query.toLowerCase();
  return commands.filter(cmd =>
    cmd.label.toLowerCase().includes(q) ||
    cmd.category.toLowerCase().includes(q)
  );
}

function groupCommands(commands: Command[]): Record<string, Command[]> {
  const groups: Record<string, Command[]> = {};
  for (const cmd of commands) {
    if (!groups[cmd.category]) groups[cmd.category] = [];
    groups[cmd.category].push(cmd);
  }
  return groups;
}

export function renderCommandPalette(props: CommandPaletteProps) {
  if (!props.state.isOpen) return nothing;

  const commands = getCommands(props);
  const filtered = filterCommands(commands, props.state.query);
  const grouped = groupCommands(filtered);
  let flatIndex = 0;

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      props.onSelectIndex(Math.min(props.state.selectedIndex + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      props.onSelectIndex(Math.max(props.state.selectedIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[props.state.selectedIndex]?.action();
      props.onClose();
    } else if (e.key === "Escape") {
      props.onClose();
    }
  };

  return html`
    <div class="command-overlay" @click=${props.onClose}>
      <div class="command-palette" @click=${(e: Event) => e.stopPropagation()}>
        <div class="command-search">
          <span class="command-search__icon">${icons.search}</span>
          <input
            class="command-search__input"
            type="text"
            placeholder="Type a command or search..."
            .value=${props.state.query}
            @input=${(e: Event) => props.onQueryChange((e.target as HTMLInputElement).value)}
            @keydown=${handleKeydown}
            autofocus
          />
          <span class="command-search__hint">
            <kbd>esc</kbd> to close
          </span>
        </div>

        <div class="command-results">
          ${Object.keys(grouped).length === 0 ? html`
            <div class="command-empty">
              <span class="command-empty__icon">${icons.search}</span>
              <span>No results found</span>
            </div>
          ` : Object.entries(grouped).map(([category, cmds]) => html`
            <div class="command-category">${category}</div>
            ${cmds.map(cmd => {
              const idx = flatIndex++;
              const isSelected = idx === props.state.selectedIndex;
              return html`
                <button
                  class="command-item ${isSelected ? 'selected' : ''}"
                  @click=${() => { cmd.action(); props.onClose(); }}
                  @mouseenter=${() => props.onSelectIndex(idx)}
                >
                  <span class="command-item__icon">${icons[cmd.icon]}</span>
                  <span class="command-item__label">${cmd.label}</span>
                  ${cmd.shortcut ? html`
                    <span class="command-item__shortcut">
                      ${cmd.shortcut.split('').map(char =>
                        char === '⌘' ? html`<kbd>⌘</kbd>` : html`<kbd>${char}</kbd>`
                      )}
                    </span>
                  ` : nothing}
                </button>
              `;
            })}
          `)}
        </div>

        <div class="command-footer">
          <span>BỜM Control</span>
          <div class="command-footer__hints">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> select</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
