import { useEffect, useState } from "react";
import {
  STAT_BLOCK_REGISTRY,
  STAT_BLOCK_SCHEMA_IDS,
  getFieldDescriptors,
  validateStatBlock,
  type StatBlockSchemaId,
} from "@manyouscript/rpg-schemas";
import { Button, Panel } from "@manyouscript/ui";

export interface CharacterSheetFormProps {
  schemaId: string | null;
  data: Record<string, unknown>;
  onSave: (schemaId: string, data: Record<string, unknown>) => void;
}

function toFieldValues(data: Record<string, unknown>): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && typeof value !== "object") {
      values[key] = String(value);
    }
  }
  return values;
}

export function CharacterSheetForm({ schemaId, data, onSave }: CharacterSheetFormProps) {
  const [selectedSchemaId, setSelectedSchemaId] = useState<StatBlockSchemaId>(
    (schemaId as StatBlockSchemaId) ?? STAT_BLOCK_SCHEMA_IDS[0]!,
  );
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(toFieldValues(data));
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSchemaId((schemaId as StatBlockSchemaId) ?? STAT_BLOCK_SCHEMA_IDS[0]!);
    setFieldValues(toFieldValues(data));
    setErrors([]);
  }, [schemaId, data]);

  const fields = getFieldDescriptors(selectedSchemaId);

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = fieldValues[field.key];
      if (raw === undefined || raw === "") {
        continue;
      }
      payload[field.key] = field.kind === "number" ? Number(raw) : raw;
    }
    const result = validateStatBlock(selectedSchemaId, payload);
    if (!result.success) {
      setErrors(result.errors ?? ["Invalid stat block."]);
      return;
    }
    setErrors([]);
    onSave(selectedSchemaId, result.data ?? payload);
  };

  return (
    <Panel title="Character Sheet">
      <label className="myc-form-row">
        <span>Schema</span>
        <select
          value={selectedSchemaId}
          onChange={(event) => setSelectedSchemaId(event.target.value as StatBlockSchemaId)}
        >
          {STAT_BLOCK_SCHEMA_IDS.map((id) => (
            <option key={id} value={id}>
              {STAT_BLOCK_REGISTRY[id].label}
            </option>
          ))}
        </select>
      </label>

      {fields.map((field) => (
        <label className="myc-form-row" key={field.key}>
          <span>{field.label}</span>
          {field.kind === "textarea" ? (
            <textarea
              value={fieldValues[field.key] ?? ""}
              onChange={(event) => handleFieldChange(field.key, event.target.value)}
            />
          ) : (
            <input
              type={field.kind === "number" ? "number" : "text"}
              value={fieldValues[field.key] ?? ""}
              onChange={(event) => handleFieldChange(field.key, event.target.value)}
            />
          )}
        </label>
      ))}

      {errors.length > 0 ? (
        <ul className="myc-form-errors">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      <Button onClick={handleSave}>Save Stat Block</Button>
    </Panel>
  );
}
