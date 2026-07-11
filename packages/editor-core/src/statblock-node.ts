import { Node, mergeAttributes } from "@tiptap/core";
import type { MarkdownSerializerState } from "prosemirror-markdown";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type MarkdownIt from "markdown-it";
import { load as loadYaml } from "js-yaml";

export interface StatBlockOptions {
  HTMLAttributes: Record<string, unknown>;
}

const FENCE_MARKER = "__manyouscriptStatBlockFence";

function escapeHtmlText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const StatBlock = Node.create<StatBlockOptions>({
  name: "statBlock",
  group: "block",
  atom: true,
  isolating: true,
  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      schemaId: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-schema") ?? "",
        renderHTML: (attributes) => ({ "data-schema": attributes.schemaId as string }),
      },
      raw: {
        default: "",
        parseHTML: (element) => element.textContent ?? "",
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='stat-block']" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "stat-block",
        class: "myc-statblock",
      }),
      String(node.attrs.raw),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const schemaId = node.attrs.schemaId as string;
      const raw = node.attrs.raw as string;

      let parsed: Record<string, unknown> | null = null;
      try {
        const loaded = loadYaml(raw);
        if (loaded && typeof loaded === "object") {
          parsed = loaded as Record<string, unknown>;
        }
      } catch {
        parsed = null;
      }

      const card = document.createElement("div");
      card.className = "myc-statblock";
      card.dataset.type = "stat-block";
      card.dataset.schema = schemaId;
      card.contentEditable = "false";

      const title = document.createElement("div");
      title.className = "myc-statblock__title";
      title.textContent = typeof parsed?.name === "string" ? parsed.name : schemaId;
      card.appendChild(title);

      const subtitle = document.createElement("div");
      subtitle.className = "myc-statblock__subtitle";
      subtitle.textContent = schemaId;
      card.appendChild(subtitle);

      const pre = document.createElement("pre");
      pre.className = "myc-statblock__raw";
      pre.textContent = raw;
      card.appendChild(pre);

      return { dom: card };
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
          state.write("```rpg:" + String(node.attrs.schemaId) + "\n");
          state.text(String(node.attrs.raw), false);
          state.ensureNewLine();
          state.write("```");
          state.closeBlock(node);
        },
        parse: {
          setup(markdownit: MarkdownIt) {
            const existingFence = markdownit.renderer.rules.fence;
            if ((existingFence as { [FENCE_MARKER]?: boolean } | undefined)?.[FENCE_MARKER]) {
              return;
            }
            const wrapped: typeof existingFence = (tokens, idx, options, env, self) => {
              const token = tokens[idx]!;
              const info = (token.info || "").trim();
              const firstWord = info.split(/\s+/)[0] ?? "";
              if (firstWord.startsWith("rpg:")) {
                const schemaId = firstWord.slice("rpg:".length);
                return `<div data-type="stat-block" data-schema="${escapeHtmlText(schemaId)}">${escapeHtmlText(token.content)}</div>`;
              }
              if (existingFence) {
                return existingFence(tokens, idx, options, env, self);
              }
              return self.renderToken(tokens, idx, options);
            };
            (wrapped as unknown as { [FENCE_MARKER]: boolean })[FENCE_MARKER] = true;
            markdownit.renderer.rules.fence = wrapped;
          },
        },
      },
    };
  },
});
