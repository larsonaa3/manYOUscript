import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { useEffect, useRef } from "react";

export interface MarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  editable?: boolean;
}

interface MarkdownStorage {
  markdown: {
    getMarkdown(): string;
  };
}

function getMarkdown(editor: Editor): string {
  return (editor.storage as unknown as MarkdownStorage).markdown.getMarkdown();
}

export function MarkdownEditor({ value, onChange, editable = true }: MarkdownEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [StarterKit, Markdown],
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

  return <EditorContent editor={editor} />;
}
