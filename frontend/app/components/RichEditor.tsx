import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useCallback, useRef, useEffect } from "react";
import {
  Bold, Italic, List, ListOrdered, Strikethrough,
  Link2, ImagePlus, Type as TypeIcon,
  Undo, Redo, X, Heading1, Heading2, Heading3,
} from "lucide-react";
import { cn } from "~/lib/utils";

/* ──────────────────────────── types ──────────────────────────── */

export interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

/* ──────────────────────────── Component ──────────────────────────── */

export function RichEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInserting = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline", target: "_blank" },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: "rounded-lg max-w-full" },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm prose-headings:font-semibold prose-img:rounded-lg max-w-none focus:outline-none min-h-[120px]",
          "prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5",
          "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
        ),
      },
    },
  });

  // Sync external value changes (e.g. draft restore)
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !imageInserting.current) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  // Client-side upload handler
  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;
    imageInserting.current = true;

    // Get token from cookie (veris_token or similar)
    const getTokenFromCookie = () => {
      const cookies = document.cookie.split(";");
      for (const cookie of cookies) {
        const [name, ...rest] = cookie.trim().split("=");
        if (name === "veris_token" || name === "access_token" || name === "token") {
          return rest.join("=");
        }
      }
      // Fallback: check sessionStorage
      return sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || null;
    };

    const token = getTokenFromCookie();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload-image/", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
      }
    } catch {
      // Fallback: convert to base64 and insert
      const reader = new FileReader();
      reader.onload = () => {
        editor.chain().focus().setImage({ src: reader.result as string }).run();
      };
      reader.readAsDataURL(file);
    }

    imageInserting.current = false;
  }, [editor]);

  const handleImageFile = useCallback(async (file: File) => {
    await handleImageUpload(file);
  }, [handleImageUpload]);

  /* ── Toolbar actions ── */
  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const toggleStrike = useCallback(() => editor?.chain().focus().toggleStrike().run(), [editor]);
  const toggleH1 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 1 }).run(), [editor]);
  const toggleH2 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 2 }).run(), [editor]);
  const toggleH3 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 3 }).run(), [editor]);
  const toggleUl = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor]);
  const toggleOl = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor]);
  const undo = useCallback(() => editor?.chain().focus().undo().run(), [editor]);
  const redo = useCallback(() => editor?.chain().focus().redo().run(), [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = prompt("Enter URL:");
    if (url) editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
  }, [editor]);

  const removeLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
  }, [editor]);

  if (!editor) return null;

  const isLinkActive = editor.isActive("link");

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden bg-muted/20", className)}>
      {/* Toolbar */}
      <Toolbar
        editor={editor}
        isLinkActive={isLinkActive}
        toggleBold={toggleBold}
        toggleItalic={toggleItalic}
        toggleStrike={toggleStrike}
        toggleH1={toggleH1}
        toggleH2={toggleH2}
        toggleH3={toggleH3}
        toggleUl={toggleUl}
        toggleOl={toggleOl}
        addLink={addLink}
        removeLink={removeLink}
        undo={undo}
        redo={redo}
        fileInputRef={fileInputRef}
        onImageClick={() => fileInputRef.current?.click()}
      />

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className={cn(
          "px-3 py-2 bg-background",
          !value && "text-muted-foreground/60",
        )}
      />

      {/* Placeholder */}
      {placeholder && !editor.getText()?.trim() && (
        <div
          className="px-3 -mt-[60px] text-sm text-muted-foreground/50 pointer-events-none select-none"
          onClick={() => editor.commands.focus()}
        >
          {placeholder}
        </div>
      )}

      {/* Hidden file input for images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ──────────────────────────── Toolbar ──────────────────────────── */

interface ToolbarProps {
  editor: ReturnType<typeof useEditor>;
  isLinkActive: boolean;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleStrike: () => void;
  toggleH1: () => void;
  toggleH2: () => void;
  toggleH3: () => void;
  toggleUl: () => void;
  toggleOl: () => void;
  addLink: () => void;
  removeLink: () => void;
  undo: () => void;
  redo: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageClick: () => void;
}

function Toolbar({
  editor, isLinkActive,
  toggleBold, toggleItalic, toggleStrike,
  toggleH1, toggleH2, toggleH3,
  toggleUl, toggleOl,
  addLink, removeLink, undo, redo,
  fileInputRef, onImageClick,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-muted/50 border-b border-border">
      <TBtn onClick={undo} active={false}><Undo className="w-3.5 h-3.5" /></TBtn>
      <TBtn onClick={redo} active={false}><Redo className="w-3.5 h-3.5" /></TBtn>

      <Div />

      <TBtn onClick={toggleH1} active={editor?.isActive("heading", { level: 1 })}>
        <Heading1 className="w-3.5 h-3.5" />
      </TBtn>
      <TBtn onClick={toggleH2} active={editor?.isActive("heading", { level: 2 })}>
        <Heading2 className="w-3.5 h-3.5" />
      </TBtn>
      <TBtn onClick={toggleH3} active={editor?.isActive("heading", { level: 3 })}>
        <Heading3 className="w-3.5 h-3.5" />
      </TBtn>

      <Div />

      <TBtn onClick={toggleBold} active={editor?.isActive("bold")}><Bold className="w-3.5 h-3.5" /></TBtn>
      <TBtn onClick={toggleItalic} active={editor?.isActive("italic")}><Italic className="w-3.5 h-3.5" /></TBtn>
      <TBtn onClick={toggleStrike} active={editor?.isActive("strike")}><Strikethrough className="w-3.5 h-3.5" /></TBtn>

      <Div />

      <TBtn onClick={toggleUl} active={editor?.isActive("bulletList")}><List className="w-3.5 h-3.5" /></TBtn>
      <TBtn onClick={toggleOl} active={editor?.isActive("orderedList")}><ListOrdered className="w-3.5 h-3.5" /></TBtn>

      <Div />

      {isLinkActive ? (
        <TBtn onClick={removeLink} active tooltip="Remove link"><X className="w-3.5 h-3.5" /></TBtn>
      ) : (
        <TBtn onClick={addLink} active={false}><Link2 className="w-3.5 h-3.5" /></TBtn>
      )}

      <TBtn onClick={onImageClick} active={false} tooltip="Insert image">
        <ImagePlus className="w-3.5 h-3.5" />
      </TBtn>
    </div>
  );
}

function TBtn({ onClick, active, children, tooltip }: {
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={tooltip}
      className={cn(
        "p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors",
        active && "bg-primary/15 text-primary hover:bg-primary/25",
      )}
    >
      {children}
    </button>
  );
}

function Div() {
  return <div className="h-4 w-px bg-border mx-0.5" />;
}
