import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Italic,
  List,
  Heading1,
  Heading2,
  Heading3,
  ListOrdered,
  Quote,
  Strikethrough,
  Undo2,
  Redo2
} from 'lucide-react'
import { radius } from '../../utils/styles.js'

function ToolbarButton({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      style={{ borderRadius: radius.btn }}
      className={[
        'p-1.5 border-2 transition-all duration-100 font-hand text-sm',
        active
          ? 'bg-ink text-paper border-ink'
          : 'border-transparent text-ink/50 hover:border-ink hover:text-ink hover:bg-muted'
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-4 bg-ink/20 mx-0.5" />
}

export function RichTextEditor({ content = '', onChange, placeholder = 'Start writing…' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        horizontalRule: false,
        dropcursor: false
      })
    ],
    content,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'rich-editor font-hand text-base text-ink outline-none min-h-[180px] leading-relaxed'
      }
    }
  })

  if (!editor) return null

  return (
    <div className="border-2 border-ink" style={{ borderRadius: radius.wobblyCard }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b-2 border-ink bg-muted/30">
        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={15} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={15} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={15} strokeWidth={2.5} />
        </ToolbarButton>

        <Divider />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={15} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={15} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={15} strokeWidth={2.5} />
        </ToolbarButton>

        <Divider />

        {/* Lists & quote */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          <List size={15} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered list"
        >
          <ListOrdered size={15} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote size={15} strokeWidth={2.5} />
        </ToolbarButton>

        <Divider />

        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          active={false}
          title="Undo"
        >
          <Undo2 size={15} strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          active={false}
          title="Redo"
        >
          <Redo2 size={15} strokeWidth={2.5} />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <div className="px-4 py-3 relative">
        {editor.isEmpty && (
          <p className="absolute top-3 left-4 font-hand text-base text-ink/30 pointer-events-none select-none">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
