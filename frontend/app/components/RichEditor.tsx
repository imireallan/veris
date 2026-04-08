import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer, mergeAttributes } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Node, mergeAttributes as mergeAttrs } from "@tiptap/core";
import { useCallback, useRef, useEffect, useState } from "react";
import {
  Bold, Italic, List, ListOrdered, Strikethrough,
  Link2, ImagePlus, Type as TypeIcon,
  Undo, Redo, X, Heading1, Heading2, Heading3, Trash2,
} from "lucide-react";
import { cn } from "~/lib/utils";

/* ──────────────────────────── Resizable Image Extension ──────────────────────────── */

/**
 * Extended Image extension with width attribute and NodeView for resize/delete UI.
 * Images get: corner drag handle for resize, delete button on hover/selected,
 * inline width preset buttons.
 */

function ResizableImageNodeView({ node, getPos, updateAttributes, editor, deleteNode }: any) {
  const [showControls, setShowControls] = useState(false);

  // Preset width presets (percentages)
  const presets = [25, 50, 75, 100];
  const currentWidth = node.attrs.width || 100;

  const handleDelete = useCallback(() => {
    // Select this node by position, then delete it
    if (typeof getPos === "function") {
      const pos = getPos();
      editor.chain().setNodeSelection(pos).deleteSelection().run();
    } else if (typeof deleteNode === "function") {
      deleteNode();
    }
  }, [editor, getPos, deleteNode]);

  return (
    <NodeViewWrapper
      className="relative group/image resizable-image-node"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Delete button (visible on hover/selected) */}
      {(showControls || editor.isActive("image")) && (
        <button
          type="button"
          className="absolute top-2 right-2 z-10 p-1 rounded bg-destructive/90 text-white hover:bg-destructive opacity-0 group-hover/image:opacity-100 transition-opacity shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleDelete}
          title="Delete image"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}

      {/* Width preset bar (visible on hover/selected) */}
      {(showControls || editor.isActive("image")) && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-0.5 px-1.5 py-0.5 rounded bg-background/90 border border-border shadow-sm opacity-0 group-hover/image:opacity-100 transition-opacity"
          onMouseDown={(e) => e.preventDefault()}
        >
          {presets.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => updateAttributes({ width: w })}
              className={cn(
                "px-1.5 py-0.5 text-[10px] rounded hover:bg-muted transition-colors",
                Math.round(currentWidth) === w && "bg-primary text-primary-foreground",
              )}
            >
              {w}%
            </button>
          ))}
        </div>
      )}

      {/* The image */}
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ""}
        style={{ width: `${currentWidth}%`, maxWidth: "100%" }}
        className="transition-all"
      />

      {/* Resize handle (bottom-right corner) */}
      <div
        className="absolute bottom-0 right-0 z-10 w-4 h-4 cursor-nwse-resize bg-primary rounded-tl-sm opacity-0 group-hover/image:opacity-80 transition-opacity"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth = currentWidth;
          const imgEl = (e.target as HTMLElement).previousElementSibling as HTMLImageElement;
          if (!imgEl) return;
          const rect = imgEl.getBoundingClientRect();
          const containerWidth = rect.width / (startWidth / 100);

          const onMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX;
            const newWidth = Math.min(100, Math.max(10, ((startWidth / 100) * containerWidth + delta) / containerWidth * 100));
            updateAttributes({ width: Math.round(newWidth) });
          };
          const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
          };
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        }}
      />
    </NodeViewWrapper>
  );
}

const ResizableImage = Node.create({
  name: "image",
  group: "block",
  draggable: true,
  addAttributes() {
    return {
      src: { default: null, renderHTML: (attrs) => ({ src: attrs.src }) },
      alt: { default: null, renderHTML: (attrs) => attrs.alt ? { alt: attrs.alt } : {} },
      width: { default: 100, renderHTML: (attrs) => attrs.width && attrs.width !== 100 ? { "data-width": attrs.width } : {} },
      title: { default: null, renderHTML: (attrs) => attrs.title ? { title: attrs.title } : {} },
    };
  },
  parseHTML() {
    return [{ tag: "img[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const width = HTMLAttributes["data-width"] || 100;
    return ["div", { class: "resizable-image-node", "data-width": width == 100 ? undefined : width },
      ["img", mergeAttrs(Image.options.HTMLAttributes, HTMLAttributes, {
        style: `width: ${width}%; max-width: 100%; display: block; margin: 0 auto;`,
      })],
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },
  addCommands() {
    return {
      setImage:
        (options: { src: string; alt?: string; title?: string; width?: number }) =>
        ({ commands }: any) =>
          commands.insertContent({
            type: "image",
            attrs: {
              src: options.src,
              alt: options.alt || "",
              width: options.width || 100,
              title: options.title || null,
            },
          }),
    };
  },
});

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
  const lastChangeSource = useRef<"editor" | "external">("external");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline", target: "_blank" },
      }),
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      lastChangeSource.current = "editor";
      if (imageInserting.current) return;
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

  // Sync external value changes (e.g. draft restore) only — NEVER during active editing
  const initialContentRef = useRef(true);
  useEffect(() => {
    if (!editor) return;
    // On the very first render, let the editor's `content` prop set it — don't override
    if (initialContentRef.current) {
      initialContentRef.current = false;
      return;
    }
    // Skip while user is actively typing
    if (editor.isFocused) return;

    const current = editor.getHTML();
    // If both are empty-ish, skip
    const currentEmpty = !current || current === "<p></p>" || current === "<p><br></p>";
    const valueEmpty = !value || value === "<p></p>" || value === "<p><br></p>";
    if (currentEmpty && valueEmpty) return;
    if (current === value) return;

    // External change detected (draft restore, etc.)
    lastChangeSource.current = "external";
    editor.commands.setContent(value || "");
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
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach((f) => handleImageUpload(f));
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
