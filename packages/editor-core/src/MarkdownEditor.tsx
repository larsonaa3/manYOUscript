import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { useEffect, useRef } from "react";
import { WikiLink } from "./wikilink-node";
import { WikiLinkSuggestion } from "./wikilink-suggestion";
import { StatBlock } from "./statblock-node";

export interface MarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  editable?: boolean;
  onNavigateWikilink?: (target: string) => void;
  getWikilinkSuggestions?: () => string[];
}

interface MarkdownStorage {
  markdown: {
    getMarkdown(): string;
  };
}

function getMarkdown(editor: Editor): string {
  return (editor.storage as unknown as MarkdownStorage).markdown.getMarkdown();
}

export function MarkdownEditor({
  value,
  onChange,
  editable = true,
  onNavigateWikilink,
  getWikilinkSuggestions,
}: MarkdownEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onNavigateRef = useRef(onNavigateWikilink);
  onNavigateRef.current = onNavigateWikilink;
  const getSuggestionsRef = useRef(getWikilinkSuggestions);
  getSuggestionsRef.current = getWikilinkSuggestions;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      WikiLink.configure({
        onNavigate: (target) => onNavigateRef.current?.(target),
      }),
      WikiLinkSuggestion.configure({
        getSuggestions: () => getSuggestionsRef.current?.() ?? [],
      }),
      StatBlock,
    ],
    content: value,
    editable,
    onUpdate({ editor }) {
      onChangeRef.current(getMarkdown(editor));
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    if (getMarkdown(editor) !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  return <EditorContent editor={editor} className="myc-editor-content" />;
}
