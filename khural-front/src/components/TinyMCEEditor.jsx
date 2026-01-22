import React from "react";
import { Editor } from "@tinymce/tinymce-react";

const DEFAULT_INIT = {
  menubar: false,
  language: "ru",
  plugins: "lists link code",
  toolbar:
    "undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | link | code",
  content_style:
    "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; }",
  branding: false,
  promotion: false,
};

export default function TinyMCEEditor({
  value,
  onChange,
  height = 360,
  disabled,
  placeholder,
  minHeight,
}) {
  return (
    <Editor
      apiKey="zj1t6pxsv8516ry4gn6wcalzrl656avlisb6ue81tegf0rjg"
      value={value ?? ""}
      onEditorChange={(val) => onChange?.(val)}
      disabled={disabled}
      init={{
        ...DEFAULT_INIT,
        height: height ?? 360,
        min_height: minHeight,
        placeholder: placeholder ?? "",
      }}
    />
  );
}
