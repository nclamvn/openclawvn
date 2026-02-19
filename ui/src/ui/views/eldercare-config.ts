import { html, nothing } from "lit";

import { t } from "../i18n";

export type EldercareConfigSection = "monitor" | "sos" | "companion" | "videocall";

export type EldercareContact = {
  name: string;
  phone: string;
  zaloId?: string;
  role: string;
};

export type EldercareConfigProps = {
  connected: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  activeSection: EldercareConfigSection;
  monitorConfig: Record<string, unknown> | null;
  sosContacts: EldercareContact[];
  companionConfig: Record<string, unknown> | null;
  videocallConfig: Record<string, unknown> | null;
  haEntities: Record<string, string>;
  onSave: () => void;
  onRefresh: () => void;
  onSectionChange: (section: EldercareConfigSection) => void;
  onConfigChange: (section: string, path: string[], value: unknown) => void;
};

const SECTIONS: EldercareConfigSection[] = ["monitor", "sos", "companion", "videocall"];

function sectionIcon(section: EldercareConfigSection): string {
  switch (section) {
    case "monitor": return "📡";
    case "sos": return "🚨";
    case "companion": return "🎵";
    case "videocall": return "📞";
  }
}

function renderMonitorSection(props: EldercareConfigProps) {
  const tr = t().eldercare.config;
  const cfg = (props.monitorConfig ?? {}) as Record<string, unknown>;
  const thresholds = (cfg.thresholds ?? {}) as Record<string, Record<string, unknown>>;
  const noMotion = (thresholds.no_motion_minutes ?? {}) as Record<string, unknown>;
  const temp = (thresholds.temperature ?? {}) as Record<string, unknown>;

  return html`
    <div class="ec-config-section">
      <h4 class="ec-config-section__title">${tr.monitorThresholds}</h4>
      <div class="ec-config-field">
        <label class="ec-config-field__label">${tr.noMotionAttention}</label>
        <input
          class="ec-config-field__input"
          type="number"
          .value=${String(noMotion.attention ?? 30)}
          @change=${(e: Event) =>
            props.onConfigChange("monitor", ["thresholds", "no_motion_minutes", "attention"], Number((e.target as HTMLInputElement).value))}
        />
        <span class="ec-config-field__hint">${tr.minutesHint}</span>
      </div>
      <div class="ec-config-field">
        <label class="ec-config-field__label">${tr.noMotionWarning}</label>
        <input
          class="ec-config-field__input"
          type="number"
          .value=${String(noMotion.warning ?? 60)}
          @change=${(e: Event) =>
            props.onConfigChange("monitor", ["thresholds", "no_motion_minutes", "warning"], Number((e.target as HTMLInputElement).value))}
        />
      </div>
      <div class="ec-config-field">
        <label class="ec-config-field__label">${tr.noMotionEmergency}</label>
        <input
          class="ec-config-field__input"
          type="number"
          .value=${String(noMotion.emergency ?? 90)}
          @change=${(e: Event) =>
            props.onConfigChange("monitor", ["thresholds", "no_motion_minutes", "emergency"], Number((e.target as HTMLInputElement).value))}
        />
      </div>
    </div>

    <div class="ec-config-section">
      <h4 class="ec-config-section__title">${tr.temperatureThresholds}</h4>
      <div class="ec-config-field">
        <label class="ec-config-field__label">${tr.tempLow}</label>
        <input
          class="ec-config-field__input"
          type="number"
          step="0.5"
          .value=${String(temp.low ?? 20)}
          @change=${(e: Event) =>
            props.onConfigChange("monitor", ["thresholds", "temperature", "low"], Number((e.target as HTMLInputElement).value))}
        />
      </div>
      <div class="ec-config-field">
        <label class="ec-config-field__label">${tr.tempHigh}</label>
        <input
          class="ec-config-field__input"
          type="number"
          step="0.5"
          .value=${String(temp.high ?? 35)}
          @change=${(e: Event) =>
            props.onConfigChange("monitor", ["thresholds", "temperature", "high"], Number((e.target as HTMLInputElement).value))}
        />
      </div>
    </div>

    <div class="ec-config-section">
      <h4 class="ec-config-section__title">${tr.haEntities}</h4>
      ${Object.entries(props.haEntities).map(
        ([key, value]) => html`
          <div class="ec-config-field">
            <label class="ec-config-field__label">${key}</label>
            <input
              class="ec-config-field__input"
              type="text"
              .value=${value}
              @change=${(e: Event) =>
                props.onConfigChange("monitor", ["entities", key], (e.target as HTMLInputElement).value)}
            />
          </div>
        `,
      )}
    </div>
  `;
}

function renderSosSection(props: EldercareConfigProps) {
  const tr = t().eldercare.config;

  return html`
    <div class="ec-config-section">
      <h4 class="ec-config-section__title">${tr.sosContacts}</h4>
      <div class="ec-contact-list">
        ${props.sosContacts.map(
          (contact, i) => html`
            <div class="ec-contact-item">
              <span class="ec-contact-item__name">${contact.name}</span>
              <span class="ec-contact-item__phone">${contact.phone}</span>
              <span class="ec-contact-item__role">${contact.role}</span>
            </div>
          `,
        )}
        ${props.sosContacts.length === 0
          ? html`<div class="ec-empty-state"><div class="ec-empty-state__text">${tr.noContacts}</div></div>`
          : nothing}
      </div>
      <p class="ec-config-field__hint" style="margin-top: 8px">${tr.contactsHint}</p>
    </div>

    <div class="ec-config-section">
      <h4 class="ec-config-section__title">${tr.escalationLevels}</h4>
      <div class="ec-stat-row">
        <span class="ec-stat-label">Level 1</span>
        <span class="ec-stat-value">${tr.level1Desc}</span>
      </div>
      <div class="ec-stat-row">
        <span class="ec-stat-label">Level 2 (+3 ${tr.minutes})</span>
        <span class="ec-stat-value">${tr.level2Desc}</span>
      </div>
      <div class="ec-stat-row">
        <span class="ec-stat-label">Level 3 (+5 ${tr.minutes})</span>
        <span class="ec-stat-value">${tr.level3Desc}</span>
      </div>
    </div>
  `;
}

function renderCompanionSection(props: EldercareConfigProps) {
  const tr = t().eldercare.config;
  const cfg = (props.companionConfig ?? {}) as Record<string, unknown>;
  const music = (cfg.music ?? {}) as Record<string, unknown>;
  const stories = (cfg.stories ?? {}) as Record<string, unknown>;

  return html`
    <div class="ec-config-section">
      <h4 class="ec-config-section__title">${tr.musicSettings}</h4>
      <div class="ec-config-field">
        <label class="ec-config-field__label">${tr.defaultPlaylist}</label>
        <input
          class="ec-config-field__input"
          type="text"
          .value=${String(music.default_playlist ?? "bolero_mix")}
          @change=${(e: Event) =>
            props.onConfigChange("companion", ["music", "default_playlist"], (e.target as HTMLInputElement).value)}
        />
      </div>
      <div class="ec-config-field">
        <label class="ec-config-field__label">${tr.volume}</label>
        <input
          class="ec-config-field__input"
          type="number"
          min="0"
          max="1"
          step="0.1"
          .value=${String(music.volume ?? 0.9)}
          @change=${(e: Event) =>
            props.onConfigChange("companion", ["music", "volume"], Number((e.target as HTMLInputElement).value))}
        />
      </div>
    </div>

    <div class="ec-config-section">
      <h4 class="ec-config-section__title">${tr.ttsSettings}</h4>
      <div class="ec-config-field">
        <label class="ec-config-field__label">${tr.ttsRate}</label>
        <input
          class="ec-config-field__input"
          type="number"
          min="0.5"
          max="1.5"
          step="0.1"
          .value=${String(stories.tts_rate ?? 0.8)}
          @change=${(e: Event) =>
            props.onConfigChange("companion", ["stories", "tts_rate"], Number((e.target as HTMLInputElement).value))}
        />
        <span class="ec-config-field__hint">${tr.ttsRateHint}</span>
      </div>
      <div class="ec-config-field">
        <label class="ec-config-field__label">${tr.ttsVoice}</label>
        <input
          class="ec-config-field__input"
          type="text"
          .value=${String(stories.tts_voice ?? "vi-VN-HoaiMyNeural")}
          @change=${(e: Event) =>
            props.onConfigChange("companion", ["stories", "tts_voice"], (e.target as HTMLInputElement).value)}
        />
      </div>
    </div>
  `;
}

function renderVideocallSection(props: EldercareConfigProps) {
  const tr = t().eldercare.config;
  const cfg = (props.videocallConfig ?? {}) as Record<string, unknown>;
  const tablet = (cfg.tablet ?? {}) as Record<string, unknown>;
  const schedule = (cfg.schedule ?? {}) as Record<string, unknown>;

  return html`
    <div class="ec-config-section">
      <h4 class="ec-config-section__title">${tr.tabletSettings}</h4>
      <div class="ec-config-field">
        <label class="ec-config-field__label">${tr.tabletIp}</label>
        <input
          class="ec-config-field__input"
          type="text"
          .value=${String(tablet.ip ?? "192.168.1.xxx")}
          @change=${(e: Event) =>
            props.onConfigChange("videocall", ["tablet", "ip"], (e.target as HTMLInputElement).value)}
        />
      </div>
      <div class="ec-config-field">
        <label class="ec-config-field__label">${tr.fullyKioskPassword}</label>
        <input
          class="ec-config-field__input"
          type="password"
          .value=${String(tablet.fully_kiosk_password ?? "")}
          @change=${(e: Event) =>
            props.onConfigChange("videocall", ["tablet", "fully_kiosk_password"], (e.target as HTMLInputElement).value)}
        />
      </div>
    </div>

    <div class="ec-config-section">
      <h4 class="ec-config-section__title">${tr.scheduleSettings}</h4>
      <div class="ec-config-field">
        <label class="ec-config-field__label">${tr.morningReminder}</label>
        <input
          class="ec-config-field__input"
          type="time"
          .value=${String(schedule.morning_reminder_time ?? "08:00")}
          @change=${(e: Event) =>
            props.onConfigChange("videocall", ["schedule", "morning_reminder_time"], (e.target as HTMLInputElement).value)}
        />
      </div>
      <div class="ec-config-field">
        <label class="ec-config-field__label">${tr.quietHoursStart}</label>
        <input
          class="ec-config-field__input"
          type="time"
          .value=${String(schedule.quiet_hours_start ?? "22:00")}
          @change=${(e: Event) =>
            props.onConfigChange("videocall", ["schedule", "quiet_hours_start"], (e.target as HTMLInputElement).value)}
        />
      </div>
      <div class="ec-config-field">
        <label class="ec-config-field__label">${tr.quietHoursEnd}</label>
        <input
          class="ec-config-field__input"
          type="time"
          .value=${String(schedule.quiet_hours_end ?? "06:00")}
          @change=${(e: Event) =>
            props.onConfigChange("videocall", ["schedule", "quiet_hours_end"], (e.target as HTMLInputElement).value)}
        />
      </div>
    </div>
  `;
}

export function renderEldercareConfig(props: EldercareConfigProps) {
  const tr = t().eldercare;

  return html`
    <div class="ec-config">
      <!-- Section tabs -->
      <div class="ec-config-tabs">
        ${SECTIONS.map(
          (section) => html`
            <button
              class="ec-config-tab ${props.activeSection === section ? "ec-config-tab--active" : ""}"
              @click=${() => props.onSectionChange(section)}
            >
              ${sectionIcon(section)} ${tr.configSections[section]}
            </button>
          `,
        )}
      </div>

      <!-- Actions -->
      <div class="ec-actions">
        <button
          class="btn btn--primary btn--sm"
          @click=${props.onSave}
          ?disabled=${props.saving || !props.connected}
        >
          ${props.saving ? t().common.saving : t().common.save}
        </button>
        <button
          class="btn btn--ghost btn--sm"
          @click=${props.onRefresh}
          ?disabled=${props.loading || !props.connected}
        >
          ${t().common.refresh}
        </button>
        ${props.error
          ? html`<span class="ec-error">${props.error}</span>`
          : nothing}
      </div>

      <!-- Active section content -->
      ${props.activeSection === "monitor" ? renderMonitorSection(props) : nothing}
      ${props.activeSection === "sos" ? renderSosSection(props) : nothing}
      ${props.activeSection === "companion" ? renderCompanionSection(props) : nothing}
      ${props.activeSection === "videocall" ? renderVideocallSection(props) : nothing}
    </div>
  `;
}
