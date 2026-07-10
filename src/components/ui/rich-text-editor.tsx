"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor, Bold, Italic, Essentials, Paragraph, Heading, List, Link as CKLink, Image, ImageInsert, ImageToolbar, ImageCaption, ImageStyle, ImageResize, LinkImage, Table, TableToolbar } from "ckeditor5";
import "ckeditor5/ckeditor5.css";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

class CKEditorErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("CKEditor Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-500 bg-red-50 text-red-900 rounded-lg">
          <h3 className="font-bold">Rich Text Editor failed to load</h3>
          <p className="text-sm mt-2 font-mono">{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  return (
    <div className="prose max-w-none relative min-h-[200px] border border-input rounded-md p-1">
      <CKEditorErrorBoundary>
        <CKEditor
          editor={ClassicEditor}
          data={value}
          config={{
            licenseKey: "GPL",
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
      </CKEditorErrorBoundary>
    </div>
  );
}
