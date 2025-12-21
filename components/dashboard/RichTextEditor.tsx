'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Undo,
  Redo,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  initialContent?: string;
  placeholder?: string;
  onChange: (html: string) => void;
  onUpdate?: (plainTextLength: number) => void;
}

export function RichTextEditor({
  initialContent = '',
  placeholder = 'Enter text...',
  onChange,
  onUpdate,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[200px] focus:outline-none p-4 border rounded-md',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);

      if (onUpdate) {
        // Use DOMParser for safer HTML parsing
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const plainTextLength = (doc.body.textContent || '').length;
        onUpdate(plainTextLength);
      }
    },
  });

  // Cleanup: destroy editor instance on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleBulletList = () =>
    editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () =>
    editor?.chain().focus().toggleOrderedList().run();
  const setLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      // Validate URL to prevent javascript: or data: protocol injection
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          alert('Only http:// or https:// URLs are allowed');
          return;
        }
      } catch {
        alert('Please enter a valid URL');
        return;
      }
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };
  const handleUndo = () => editor?.chain().focus().undo().run();
  const handleRedo = () => editor?.chain().focus().redo().run();

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleBold}
          aria-label="Bold"
          aria-pressed={editor?.isActive('bold')}
          className={cn(editor?.isActive('bold') && 'bg-accent')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleItalic}
          aria-label="Italic"
          aria-pressed={editor?.isActive('italic')}
          className={cn(editor?.isActive('italic') && 'bg-accent')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleBulletList}
          aria-label="Bulleted list"
          aria-pressed={editor?.isActive('bulletList')}
          className={cn(editor?.isActive('bulletList') && 'bg-accent')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleOrderedList}
          aria-label="Numbered list"
          aria-pressed={editor?.isActive('orderedList')}
          className={cn(editor?.isActive('orderedList') && 'bg-accent')}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLink}
          aria-label="Insert link"
          aria-pressed={editor?.isActive('link')}
          className={cn(editor?.isActive('link') && 'bg-accent')}
        >
          <Link2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          aria-label="Undo"
          disabled={!editor?.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRedo}
          aria-label="Redo"
          disabled={!editor?.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
