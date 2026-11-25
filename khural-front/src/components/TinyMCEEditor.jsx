import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { UploadApi } from '../api/client.js';

// Плагины и тулбар только из self-hosted пакета (без Cloud/Premium),
// чтобы редактор работал на любых устройствах и доменах без зависимости от Tiny CDN.
const SELF_HOSTED_PLUGINS = [
  'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists',
  'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
];
const SELF_HOSTED_TOOLBAR = 'undo redo | blocks | bold italic underline strikethrough | link image media table | numlist bullist indent outdent | emoticons charmap | removeformat';

const FALLBACK_TIMEOUT_MS = 12000;

export default function TinyMCEEditor({ value, onChange, placeholder, height = 400, disabled, minHeight }) {
  const [useFallback, setUseFallback] = useState(false);
  const timeoutRef = useRef(null);
  const loadedRef = useRef(false);
  const editorRef = useRef(null);

  // Sync external value changes to editor
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getContent()) {
      editorRef.current.setContent(value ?? '');
    }
  }, [value]);

  const handleEditorChange = useCallback((content, editor) => {
    editorRef.current = editor;
    if (onChange) onChange(content);
  }, [onChange]);

  const handleInit = useCallback((_, editor) => {
    loadedRef.current = true;
    editorRef.current = editor;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleScriptsLoadError = useCallback(() => {
    setUseFallback(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (useFallback) return;
    timeoutRef.current = setTimeout(() => {
      if (!loadedRef.current) setUseFallback(true);
    }, FALLBACK_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [useFallback]);

  if (useFallback) {
    return (
      <textarea
        className="tinymce-fallback"
        value={value ?? ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder || ''}
        disabled={disabled}
        style={{
          width: '100%',
          minHeight: typeof height === 'number' ? height : 400,
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: 14,
          padding: 8,
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          boxSizing: 'border-box',
        }}
      />
    );
  }

  const imagesUploadHandler = useCallback(async (blobInfo) => {
    const file = blobInfo.blob();
    const name = blobInfo.filename?.() || file?.name || 'image';
    const uploadFile = file instanceof File ? file : new File([file], name, { type: file?.type || 'image/png' });
    const uploaded = await UploadApi.upload(uploadFile);
    const id = uploaded?.id || uploaded?.file?.id;
    if (!id) throw new Error('Не удалось загрузить изображение');
    return `/api/files/${encodeURIComponent(id)}`;
  }, []);

  return (
    <Editor
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      licenseKey="gpl"
      value={value ?? ''}
      onEditorChange={handleEditorChange}
      onInit={handleInit}
      onScriptsLoadError={handleScriptsLoadError}
      disabled={disabled}
      init={{
        base_url: '/tinymce',
        language: 'ru',
        language_url: '/tinymce/langs/ru.js',
        height: height ?? 400,
        min_height: minHeight,
        menubar: false,
        plugins: SELF_HOSTED_PLUGINS,
        toolbar: SELF_HOSTED_TOOLBAR,
        placeholder: placeholder || '',
        content_style: 'body { font-family: Helvetica, Arial, sans-serif; font-size: 14px } img { max-width: 100%; height: auto; } table { border-collapse: collapse; width: 100%; } table td, table th { border: 1px solid #d9d9d9; padding: 6px; }',
        branding: false,
        promotion: false,
        automatic_uploads: true,
        images_upload_handler: imagesUploadHandler,
        file_picker_types: 'image',
        paste_data_images: true,
      }}
    />
  );
}
