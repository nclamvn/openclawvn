import { html, nothing, type TemplateResult } from "lit";

import { t } from "../i18n";

type UiHint = {
  label?: string;
  help?: string;
  sensitive?: boolean;
  placeholder?: string;
  order?: number;
};

export type SchemaFormProps = {
  schema: Record<string, unknown> | null;
  uiHints: Record<string, UiHint> | null;
  values: Record<string, unknown> | null;
  onFieldChange: (field: string, value: unknown) => void;
  disabled?: boolean;
};

type PropertyDef = {
  type?: string;
  enum?: string[];
  format?: string;
  description?: string;
  items?: { type?: string };
};

export function renderSchemaForm(props: SchemaFormProps): TemplateResult {
  if (!props.schema) {
    return html`<div class="muted">${t().skills.catalog?.settings?.noConfig ?? "No configuration available."}</div>`;
  }

  const properties = (props.schema.properties ?? {}) as Record<string, PropertyDef>;
  const required = Array.isArray(props.schema.required) ? (props.schema.required as string[]) : [];
  const hints = props.uiHints ?? {};
  const values = props.values ?? {};

  // Sort by uiHints.order, then alphabetical
  const keys = Object.keys(properties).sort((a, b) => {
    const orderA = hints[a]?.order ?? 999;
    const orderB = hints[b]?.order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });

  if (keys.length === 0) {
    return html`<div class="muted">${t().skills.catalog?.settings?.noConfig ?? "No configuration available."}</div>`;
  }

  return html`
    <div class="schema-form">
      ${keys.map((key) =>
        renderField(key, properties[key], hints[key], values[key], required.includes(key), props),
      )}
    </div>
  `;
}

function renderField(
  key: string,
  prop: PropertyDef,
  hint: UiHint | undefined,
  value: unknown,
  isRequired: boolean,
  props: SchemaFormProps,
): TemplateResult {
  const label = hint?.label ?? key;
  const helpText = hint?.help ?? prop?.description ?? "";
  const isSecret = hint?.sensitive === true || prop?.format === "password";
  const placeholder = hint?.placeholder ?? "";
  const requiredMark = isRequired ? " *" : "";

  return html`
    <div class="schema-form__field">
      <label class="schema-form__label">${label}${requiredMark}</label>
      ${renderInput(key, prop, value, isSecret, placeholder, props)}
      ${helpText ? html`<div class="schema-form__help">${helpText}</div>` : nothing}
    </div>
  `;
}

function renderInput(
  key: string,
  prop: PropertyDef,
  value: unknown,
  isSecret: boolean,
  placeholder: string,
  props: SchemaFormProps,
): TemplateResult {
  const disabled = props.disabled ?? false;

  // Enum → dropdown
  if (prop?.enum && Array.isArray(prop.enum)) {
    const strVal = String(value ?? "");
    return html`
      <select
        class="schema-form__select"
        ?disabled=${disabled}
        @change=${(e: Event) => props.onFieldChange(key, (e.target as HTMLSelectElement).value)}
      >
        <option value="" ?selected=${!strVal}>--</option>
        ${prop.enum.map(
          (opt: string) => html`<option value=${opt} ?selected=${strVal === opt}>${opt}</option>`,
        )}
      </select>
    `;
  }

  // Boolean → toggle
  if (prop?.type === "boolean") {
    const checked = value === true;
    return html`
      <label class="schema-form__toggle">
        <input
          type="checkbox"
          ?checked=${checked}
          ?disabled=${disabled}
          @change=${(e: Event) => props.onFieldChange(key, (e.target as HTMLInputElement).checked)}
        />
        <span>${checked ? "On" : "Off"}</span>
      </label>
    `;
  }

  // Number
  if (prop?.type === "number" || prop?.type === "integer") {
    const numVal = typeof value === "number" ? value : "";
    return html`
      <input
        class="schema-form__input"
        type="number"
        .value=${String(numVal)}
        placeholder=${placeholder}
        ?disabled=${disabled}
        @input=${(e: Event) => {
          const raw = (e.target as HTMLInputElement).value;
          props.onFieldChange(key, raw ? Number(raw) : undefined);
        }}
      />
    `;
  }

  // Array of strings → textarea (one per line)
  if (prop?.type === "array" && prop.items?.type === "string") {
    const arr = Array.isArray(value) ? value.join("\n") : String(value ?? "");
    return html`
      <textarea
        class="schema-form__textarea"
        rows="3"
        placeholder=${placeholder || "One item per line"}
        ?disabled=${disabled}
        .value=${arr}
        @input=${(e: Event) => {
          const lines = (e.target as HTMLTextAreaElement).value
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
          props.onFieldChange(key, lines);
        }}
      ></textarea>
    `;
  }

  // Nested object or complex → JSON textarea fallback
  if (prop?.type === "object") {
    const jsonVal = typeof value === "object" && value !== null ? JSON.stringify(value, null, 2) : "";
    return html`
      <textarea
        class="schema-form__textarea"
        rows="4"
        placeholder=${placeholder || "JSON"}
        ?disabled=${disabled}
        .value=${jsonVal}
        @input=${(e: Event) => {
          const raw = (e.target as HTMLTextAreaElement).value;
          try {
            props.onFieldChange(key, JSON.parse(raw));
          } catch {
            // Keep raw string until valid JSON
          }
        }}
      ></textarea>
    `;
  }

  // String (default) — secret or regular
  const strVal = String(value ?? "");
  return html`
    <input
      class="schema-form__input"
      type=${isSecret ? "password" : "text"}
      .value=${strVal}
      placeholder=${placeholder}
      ?disabled=${disabled}
      @input=${(e: Event) => props.onFieldChange(key, (e.target as HTMLInputElement).value)}
    />
  `;
}
