"use client"

import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import { AtSign, Bold, CheckSquare, Code2, Heading, Italic, Link2, List, ListOrdered, Paperclip, Redo2, Undo2 } from "lucide-react"
import { Toggle } from "../components/toggle"
import { cn } from "../lib/utils"

export function WorkspaceEditor({
  className,
  content,
  onChange,
  placeholder = "Start typing...",
}: {
  className?: string
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
}) {
  const [mode, setMode] = React.useState<"write" | "preview">("write")
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
    ],
    content: content ?? "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[132px] px-4 py-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  })

  if (!editor) return null

  function toggleLink() {
    const previousUrl = editor!.getAttributes("link").href
    const url = window.prompt("Enter URL", previousUrl ?? "")
    if (url === null) return
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="overflow-hidden rounded-md border border-input bg-background">
        <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/20 px-3">
          <div className="flex items-end gap-1 self-stretch">
            <button
              type="button"
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium",
                mode === "write" ? "border-background bg-background text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setMode("write")}
            >
              Write
            </button>
            <button
              type="button"
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium",
                mode === "preview" ? "border-background bg-background text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setMode("preview")}
            >
              Preview
            </button>
          </div>
          {mode === "write" ? (
            <div className="flex flex-wrap items-center gap-1 py-1.5 text-muted-foreground">
              <EditorToggle label="Heading" pressed={editor.isActive("heading", { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading className="size-4" />
              </EditorToggle>
              <EditorToggle label="Bold" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()}>
                <Bold className="size-4" />
              </EditorToggle>
              <EditorToggle label="Italic" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>
                <Italic className="size-4" />
              </EditorToggle>
              <ToolbarDivider />
              <EditorToggle label="Code" pressed={editor.isActive("code")} onPressedChange={() => editor.chain().focus().toggleCode().run()}>
                <Code2 className="size-4" />
              </EditorToggle>
              <EditorToggle label="Link" pressed={editor.isActive("link")} onPressedChange={toggleLink}>
                <Link2 className="size-4" />
              </EditorToggle>
              <ToolbarDivider />
              <EditorToggle label="Bullet list" pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}>
                <List className="size-4" />
              </EditorToggle>
              <EditorToggle label="Numbered list" pressed={editor.isActive("orderedList")} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}>
                <ListOrdered className="size-4" />
              </EditorToggle>
              <EditorToggle label="Checklist mark" pressed={false} onPressedChange={() => editor.chain().focus().insertContent("- [ ] ").run()}>
                <CheckSquare className="size-4" />
              </EditorToggle>
              <ToolbarDivider />
              <EditorToggle label="Mention" pressed={false} onPressedChange={() => editor.chain().focus().insertContent("@").run()}>
                <AtSign className="size-4" />
              </EditorToggle>
              <EditorToggle label="Undo" pressed={false} onPressedChange={() => editor.chain().focus().undo().run()}>
                <Undo2 className="size-4" />
              </EditorToggle>
              <EditorToggle label="Redo" pressed={false} onPressedChange={() => editor.chain().focus().redo().run()}>
                <Redo2 className="size-4" />
              </EditorToggle>
            </div>
          ) : null}
        </div>
        {mode === "write" ? (
          <EditorContent editor={editor} />
        ) : (
          <div
            className="prose prose-sm min-h-[132px] max-w-none px-4 py-4 text-sm"
            dangerouslySetInnerHTML={{ __html: editor.getHTML() || "<p>No preview yet.</p>" }}
          />
        )}
      </div>
      <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
        <Paperclip className="size-4" />
        <span>Paste, drop, or click to add files</span>
      </div>
    </div>
  )
}

function EditorToggle({
  children,
  label,
  onPressedChange,
  pressed,
}: {
  children: React.ReactNode
  label: string
  onPressedChange: () => void
  pressed: boolean
}) {
  return (
    <Toggle aria-label={label} title={label} size="sm" pressed={pressed} onPressedChange={onPressedChange}>
      {children}
    </Toggle>
  )
}

function ToolbarDivider() {
  return <span className="mx-1 h-5 w-px bg-border" />
}
