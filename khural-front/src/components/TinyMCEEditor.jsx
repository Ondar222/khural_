import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

export default function TinyMCEEditor({ value, onChange, placeholder, height = 400, disabled, minHeight }) {
  const handleEditorChange = (content, editor) => {
    if (onChange) {
      onChange(content);
    }
  };

  return (
    <Editor
      apiKey='zj1t6pxsv8516ry4gn6wcalzrl656avlisb6ue81tegf0rjg'
      value={value ?? ''}
      onEditorChange={handleEditorChange}
      disabled={disabled}
      init={{
        height: height ?? 400,
        min_height: minHeight,
        menubar: false,
        plugins: [
          'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
          'checklist', 'mediaembed', 'casechange', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'advtemplate', 'ai', 'uploadcare', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown', 'importword', 'exportword', 'exportpdf'
        ],
        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography uploadcare | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
        placeholder: placeholder || '',
