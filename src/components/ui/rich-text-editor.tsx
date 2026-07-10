"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor, Bold, Italic, Essentials, Paragraph, Heading, List, Link as CKLink, Image, ImageInsert, ImageToolbar, ImageCaption, ImageStyle, ImageResize, LinkImage, Table, TableToolbar } from "ckeditor5";
import "ckeditor5/ckeditor5.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  return (
    <div className="prose max-w-none">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        config={{
          plugins: [
            Essentials, Bold, Italic, Paragraph, Heading, List, CKLink,
            Image, ImageInsert, ImageToolbar, ImageCaption, ImageStyle, ImageResize, LinkImage,
            Table, TableToolbar
          ],
          toolbar: [
            "heading",
            "|",
            "bold",
            "italic",
            "link",
            "bulletedList",
            "numberedList",
            "insertImage",
            "insertTable",
            "|",
            "undo",
            "redo",
          ],
          image: {
            toolbar: [
              "imageStyle:inline",
              "imageStyle:block",
              "imageStyle:side",
              "|",
              "toggleImageCaption",
              "imageTextAlternative"
            ]
          },
          table: {
            contentToolbar: [
              "tableColumn",
              "tableRow",
              "mergeTableCells"
            ]
          }
        }}
        onChange={(event, editor) => {
          const data = editor.getData();
          onChange(data);
        }}
      />
    </div>
  );
}
