import { load as loadYaml, dump as dumpYaml } from "js-yaml";

export interface StructuredBlock {
  schemaId: string;
  raw: string;
  data: unknown;
}

const FENCE_PATTERN = /```rpg:(\S+)\r?\n([\s\S]*?)```/g;

export function extractStructuredBlocks(body: string): StructuredBlock[] {
  const blocks: StructuredBlock[] = [];
  const pattern = new RegExp(FENCE_PATTERN);
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    const schemaId = match[1]!;
    const raw = match[2]!;
    let data: unknown;
    try {
      data = loadYaml(raw);
    } catch {
      continue;
    }
    blocks.push({ schemaId, raw, data });
  }
  return blocks;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replaces the fenced ```rpg:<schemaId> block in body with one containing
 * `data`, or appends a new one if no block with that schemaId exists yet.
 */
export function upsertStructuredBlock(
  body: string,
  schemaId: string,
  data: Record<string, unknown>,
): string {
  const yamlContent = `${dumpYaml(data).trimEnd()}\n`;
  const newBlock = "```rpg:" + schemaId + "\n" + yamlContent + "```";
  const pattern = new RegExp("```rpg:" + escapeRegExp(schemaId) + "\\r?\\n[\\s\\S]*?```");

  if (pattern.test(body)) {
    return body.replace(pattern, newBlock);
  }

  const separator = body.trim().length > 0 ? "\n\n" : "";
  return `${body.trimEnd()}${separator}${newBlock}\n`;
}
