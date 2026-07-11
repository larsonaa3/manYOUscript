import { Node, mergeAttributes } from "@tiptap/core";
import type { MarkdownSerializerState } from "prosemirror-markdown";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type MarkdownIt from "markdown-it";

export interface WikiLinkOptions {
  onNavigate: (target: string) => void;
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    wikiLink: {
      insertWikiLink: (target: string) => ReturnType;
    };
  }
}

export const WikiLink = Node.create<WikiLinkOptions>({
  name: "wikiLink",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return {
      onNavigate: () => {},
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      target: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-target") ?? element.textContent ?? "",
        renderHTML: (attributes) => ({ "data-target": attributes.target as string }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-type='wiki-link']" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "wiki-link",
        class: "myc-wikilink",
      }),
      `[[${node.attrs.target}]]`,
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const span = document.createElement("span");
      span.className = "myc-wikilink";
      span.dataset.type = "wiki-link";
      span.dataset.target = node.attrs.target as string;
      span.textContent = `[[${node.attrs.target}]]`;
      span.addEventListener("click", (event) => {
        event.preventDefault();
        this.options.onNavigate(node.attrs.target as string);
      });
      return { dom: span };
    };
  },

  addCommands() {
    return {
      insertWikiLink:
        (target: string) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { target } }),
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
          state.write(`[[${state.esc(String(node.attrs.target))}]]`);
        },
        parse: {
          setup(markdownit: MarkdownIt) {
            markdownit.inline.ruler.before("link", "wiki_link", (state, silent) => {
              const start = state.pos;
              const max = state.posMax;
              if (
                state.src.charCodeAt(start) !== 0x5b /* [ */ ||
                state.src.charCodeAt(start + 1) !== 0x5b
              ) {
                return false;
              }
              const end = state.src.indexOf("]]", start + 2);
              if (end === -1 || end >= max) {
                return false;
              }
              const rawInner = state.src.slice(start + 2, end);
              const target = rawInner.split("|")[0]!.split("#")[0]!.trim();
              if (!target) {
                return false;
              }
              if (!silent) {
                const token = state.push("wiki_link", "", 0);
                token.attrSet("target", target);
                token.content = target;
              }
              state.pos = end + 2;
              return true;
            });
            markdownit.renderer.rules.wiki_link = (tokens, idx) => {
              const target = tokens[idx]!.attrGet("target") ?? "";
              const escaped = target
                .replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
              return `<span data-type="wiki-link" data-target="${escaped}">${escaped}</span>`;
            };
          },
        },
      },
    };
  },
});
