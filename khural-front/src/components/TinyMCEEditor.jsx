import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

export default function TinyMCEEditor({ value, onChange, placeholder, height = 400, disabled, minHeight }) {
  const handleEditorChange = (content, editor) => {
    if (onChange) {
      onChange(content);
    }
  };
//fdfdfdf
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
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        tinycomments_mode: 'embedded',
        tinycomments_author: 'Author name',
        mergetags_list: [
          { value: 'First.Name', title: 'First Name' },
          { value: 'Email', title: 'Email' },
        ],
        ai_request: (request, respondWith) => respondWith.string(() => Promise.reject('See docs to implement AI Assistant')),
        uploadcare_public_key: 'b5ecd5cbedbfeef5a7c8',
        branding: false,
        promotion: false,
      }}
    />
  );
}
