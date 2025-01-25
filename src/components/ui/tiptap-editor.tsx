"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Toggle } from "./toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";


interface TiptapEditorProps {
  value?: string;
  onBlur?: () => void;
  name?: string;
  onChange?: (value: string) => void;
}

const headingOptions = [
  { value: "p", label: "Normal" },
  { value: "h1", label: "Başlık 1" },
  { value: "h2", label: "Başlık 2" },
  { value: "h3", label: "Başlık 3" },
];

export const TiptapEditor = forwardRef<any, TiptapEditorProps>(
  ({ value, onBlur, name, onChange }, ref) => {
    const [editorValue, setEditorValue] = useState(value);
    const editor = useEditor({
      extensions: [
        StarterKit,
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        TextStyle,
        Color,
      ],
      content: value,
      editorProps: {
        attributes: {
          class:
            "prose prose-base w-full focus:outline-none min-h-[80px] px-3 py-2",
        },
        handleDOMEvents: {
          blur: () => {
            onBlur?.();
            return true;
          },
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        setEditorValue(html);
        onChange?.(html);
      },
      immediatelyRender: false
    });

    useEffect(() => {
      if (editor && value !== editorValue) {
        editor.commands.setContent(value || '');
      }
    }, [value, editor]);

    useImperativeHandle(ref, () => ({
      getValue: () => editorValue,
      setValue: (content: string) => editor?.commands.setContent(content),
      focus: () => editor?.commands.focus(),
      blur: () => editor?.commands.blur(),
    }));

    return (
      <div className="border rounded-md">
        <div className="border-b bg-muted py-0.5 px-1">
          <div className="flex flex-wrap items-center gap-0.5">
            <Select
              value={
                editor?.isActive("heading", { level: 1 })
                  ? "h1"
                  : editor?.isActive("heading", { level: 2 })
                    ? "h2"
                    : editor?.isActive("heading", { level: 3 })
                      ? "h3"
                      : "p"
              }
              onValueChange={(value) => {
                if (value === "p") {
                  editor?.chain().focus().setParagraph().run();
                } else {
                  editor?.chain().focus().toggleHeading({
                    level: parseInt(value.charAt(1)) as 1 | 2 | 3,
                  }).run();
                }
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Stil seçin" />
              </SelectTrigger>
              <SelectContent>
                {headingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Toggle
              size="sm"
              pressed={editor?.isActive("bold")}
              onPressedChange={() => editor?.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Toggle>

            <Toggle
              size="sm"
              pressed={editor?.isActive("italic")}
              onPressedChange={() => editor?.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Toggle>

            <Toggle
              size="sm"
              pressed={editor?.isActive("bulletList")}
              onPressedChange={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" />
            </Toggle>

            <Toggle
              size="sm"
              pressed={editor?.isActive("orderedList")}
              onPressedChange={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-4 w-4" />
            </Toggle>

            <div className="flex items-center gap-0.5 border-l ml-1 pl-1">
              <Toggle
                size="sm"
                pressed={editor?.isActive({ textAlign: "left" })}
                onPressedChange={() => editor?.chain().focus().setTextAlign("left").run()}
              >
                <AlignLeft className="h-4 w-4" />
              </Toggle>

              <Toggle
                size="sm"
                pressed={editor?.isActive({ textAlign: "center" })}
                onPressedChange={() => editor?.chain().focus().setTextAlign("center").run()}
              >
                <AlignCenter className="h-4 w-4" />
              </Toggle>

              <Toggle
                size="sm"
                pressed={editor?.isActive({ textAlign: "right" })}
                onPressedChange={() => editor?.chain().focus().setTextAlign("right").run()}
              >
                <AlignRight className="h-4 w-4" />
              </Toggle>
            </div>
          </div>
        </div>
        <input type="hidden" name={name} value={editorValue} />
        <EditorContent editor={editor} />
      </div>
    );
  });
TiptapEditor.displayName = "TiptapEditor";
