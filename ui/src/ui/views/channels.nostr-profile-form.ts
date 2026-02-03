/**
 * Nostr Profile Edit Form
 *
 * Provides UI for editing and publishing Nostr profile (kind:0).
 */

import { html, nothing, type TemplateResult } from "lit";

import type { NostrProfile as NostrProfileType } from "../types";
import { t } from "../i18n";

// ============================================================================
// Types
// ============================================================================

export interface NostrProfileFormState {
  /** Current form values */
  values: NostrProfileType;
  /** Original values for dirty detection */
  original: NostrProfileType;
  /** Whether the form is currently submitting */
  saving: boolean;
  /** Whether import is in progress */
  importing: boolean;
  /** Last error message */
  error: string | null;
  /** Last success message */
  success: string | null;
  /** Validation errors per field */
  fieldErrors: Record<string, string>;
  /** Whether to show advanced fields */
  showAdvanced: boolean;
}

export interface NostrProfileFormCallbacks {
  /** Called when a field value changes */
  onFieldChange: (field: keyof NostrProfileType, value: string) => void;
  /** Called when save is clicked */
  onSave: () => void;
  /** Called when import is clicked */
  onImport: () => void;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Called when toggle advanced is clicked */
  onToggleAdvanced: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function isFormDirty(state: NostrProfileFormState): boolean {
  const { values, original } = state;
  return (
    values.name !== original.name ||
    values.displayName !== original.displayName ||
    values.about !== original.about ||
    values.picture !== original.picture ||
    values.banner !== original.banner ||
    values.website !== original.website ||
    values.nip05 !== original.nip05 ||
    values.lud16 !== original.lud16
  );
}

// ============================================================================
// Form Rendering
// ============================================================================

export function renderNostrProfileForm(params: {
  state: NostrProfileFormState;
  callbacks: NostrProfileFormCallbacks;
  accountId: string;
}): TemplateResult {
  const { state, callbacks, accountId } = params;
  const isDirty = isFormDirty(state);

  const renderField = (
    field: keyof NostrProfileType,
    label: string,
    opts: {
      type?: "text" | "url" | "textarea";
      placeholder?: string;
      maxLength?: number;
      help?: string;
    } = {},
  ) => {
    const { type = "text", placeholder, maxLength, help } = opts;
    const value = state.values[field] ?? "";
    const error = state.fieldErrors[field];

    const inputId = `nostr-profile-${field}`;

    if (type === "textarea") {
      return html`
        <div class="form-field" style="margin-bottom: 12px;">
          <label for="${inputId}" style="display: block; margin-bottom: 4px; font-weight: 500;">
            ${label}
          </label>
          <textarea
            id="${inputId}"
            .value=${value}
            placeholder=${placeholder ?? ""}
            maxlength=${maxLength ?? 2000}
            rows="3"
            style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; resize: vertical; font-family: inherit;"
            @input=${(e: InputEvent) => {
              const target = e.target as HTMLTextAreaElement;
              callbacks.onFieldChange(field, target.value);
            }}
            ?disabled=${state.saving}
          ></textarea>
          ${help ? html`<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${help}</div>` : nothing}
          ${error ? html`<div style="font-size: 12px; color: var(--danger-color); margin-top: 2px;">${error}</div>` : nothing}
        </div>
      `;
    }

    return html`
      <div class="form-field" style="margin-bottom: 12px;">
        <label for="${inputId}" style="display: block; margin-bottom: 4px; font-weight: 500;">
          ${label}
        </label>
        <input
          id="${inputId}"
          type=${type}
          .value=${value}
          placeholder=${placeholder ?? ""}
          maxlength=${maxLength ?? 256}
          style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;"
          @input=${(e: InputEvent) => {
            const target = e.target as HTMLInputElement;
            callbacks.onFieldChange(field, target.value);
          }}
          ?disabled=${state.saving}
        />
        ${help ? html`<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${help}</div>` : nothing}
        ${error ? html`<div style="font-size: 12px; color: var(--danger-color); margin-top: 2px;">${error}</div>` : nothing}
      </div>
    `;
  };

  const renderPicturePreview = () => {
    const picture = state.values.picture;
    if (!picture) return nothing;

    return html`
      <div style="margin-bottom: 12px;">
        <img
          src=${picture}
          alt="${t().nostrProfile.avatarPreview}"
          style="max-width: 80px; max-height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);"
          @error=${(e: Event) => {
            const img = e.target as HTMLImageElement;
            img.style.display = "none";
          }}
          @load=${(e: Event) => {
            const img = e.target as HTMLImageElement;
            img.style.display = "block";
          }}
        />
      </div>
    `;
  };

  return html`
    <div class="nostr-profile-form" style="padding: 16px; background: var(--bg-secondary); border-radius: 8px; margin-top: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div style="font-weight: 600; font-size: 16px;">${t().nostrProfile.editTitle}</div>
        <div style="font-size: 12px; color: var(--text-muted);">${t().nostrProfile.account} ${accountId}</div>
      </div>

      ${
        state.error
          ? html`<div class="callout danger" style="margin-bottom: 12px;">${state.error}</div>`
          : nothing
      }

      ${
        state.success
          ? html`<div class="callout success" style="margin-bottom: 12px;">${state.success}</div>`
          : nothing
      }

      ${renderPicturePreview()}

      ${renderField("name", t().nostrProfile.username, {
        placeholder: t().nostrProfile.usernamePlaceholder,
        maxLength: 256,
        help: t().nostrProfile.usernameHelp,
      })}

      ${renderField("displayName", t().nostrProfile.displayName, {
        placeholder: t().nostrProfile.displayNamePlaceholder,
        maxLength: 256,
        help: t().nostrProfile.displayNameHelp,
      })}

      ${renderField("about", t().nostrProfile.bio, {
        type: "textarea",
        placeholder: t().nostrProfile.bioPlaceholder,
        maxLength: 2000,
        help: t().nostrProfile.bioHelp,
      })}

      ${renderField("picture", t().nostrProfile.avatarUrl, {
        type: "url",
        placeholder: t().nostrProfile.avatarUrlPlaceholder,
        help: t().nostrProfile.avatarUrlHelp,
      })}

      ${
        state.showAdvanced
          ? html`
            <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 12px;">
              <div style="font-weight: 500; margin-bottom: 12px; color: var(--text-muted);">${t().nostrProfile.advanced}</div>

              ${renderField("banner", t().nostrProfile.bannerUrl, {
                type: "url",
                placeholder: t().nostrProfile.bannerUrlPlaceholder,
                help: t().nostrProfile.bannerUrlHelp,
              })}

              ${renderField("website", t().nostrProfile.website, {
                type: "url",
                placeholder: t().nostrProfile.websitePlaceholder,
                help: t().nostrProfile.websiteHelp,
              })}

              ${renderField("nip05", t().nostrProfile.nip05, {
                placeholder: t().nostrProfile.nip05Placeholder,
                help: t().nostrProfile.nip05Help,
              })}

              ${renderField("lud16", t().nostrProfile.lightning, {
                placeholder: t().nostrProfile.lightningPlaceholder,
                help: t().nostrProfile.lightningHelp,
              })}
            </div>
          `
          : nothing
      }

      <div style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">
        <button
          class="btn primary"
          @click=${callbacks.onSave}
          ?disabled=${state.saving || !isDirty}
        >
          ${state.saving ? t().nostrProfile.saving : t().nostrProfile.savePublish}
        </button>

        <button
          class="btn"
          @click=${callbacks.onImport}
          ?disabled=${state.importing || state.saving}
        >
          ${state.importing ? t().nostrProfile.importing : t().nostrProfile.importFromRelay}
        </button>

        <button
          class="btn"
          @click=${callbacks.onToggleAdvanced}
        >
          ${state.showAdvanced ? t().nostrProfile.hideAdvanced : t().nostrProfile.showAdvanced}
        </button>

        <button
          class="btn"
          @click=${callbacks.onCancel}
          ?disabled=${state.saving}
        >
          ${t().common.cancel}
        </button>
      </div>

      ${
        isDirty
          ? html`
              <div style="font-size: 12px; color: var(--warning-color); margin-top: 8px">
                ${t().nostrProfile.unsavedChanges}
              </div>
            `
          : nothing
      }
    </div>
  `;
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create initial form state from existing profile
 */
export function createNostrProfileFormState(
  profile: NostrProfileType | undefined,
): NostrProfileFormState {
  const values: NostrProfileType = {
    name: profile?.name ?? "",
    displayName: profile?.displayName ?? "",
    about: profile?.about ?? "",
    picture: profile?.picture ?? "",
    banner: profile?.banner ?? "",
    website: profile?.website ?? "",
    nip05: profile?.nip05 ?? "",
    lud16: profile?.lud16 ?? "",
  };

  return {
    values,
    original: { ...values },
    saving: false,
    importing: false,
    error: null,
    success: null,
    fieldErrors: {},
    showAdvanced: Boolean(profile?.banner || profile?.website || profile?.nip05 || profile?.lud16),
  };
}
