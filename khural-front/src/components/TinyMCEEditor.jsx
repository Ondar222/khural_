import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

// Плагины и тулбар только из self-hosted пакета (без Cloud/Premium),
// чтобы редактор работал на любых устройствах и доменах без зависимости от Tiny CDN.
const SELF_HOSTED_PLUGINS = [
  'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'link', 'lists',
  'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
];
const SELF_HOSTED_TOOLBAR = 'undo redo | blocks | bold italic underline strikethrough | link media table | numlist bullist indent outdent | emoticons charmap | removeformat';

const FALLBACK_TIMEOUT_MS = 12000;

export default function TinyMCEEditor({ value, onChange, placeholder, height = 400, disabled, minHeight }) {
  const [useFallback, setUseFallback] = useState(false);
  const timeoutRef = useRef(null);
  const loadedRef = useRef(false);

  const handleEditorChange = useCallback((content, editor) => {
    if (onChange) onChange(content);
  }, [onChange]);

  const handleInit = useCallback(() => {
    loadedRef.current = true;
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
        height: height ?? 400,
        min_height: minHeight,
        menubar: false,
        plugins: SELF_HOSTED_PLUGINS,
        toolbar: SELF_HOSTED_TOOLBAR,
        placeholder: placeholder || '',
        content_style: 'body { font-family: Helvetica, Arial, sans-serif; font-size: 14px }',
        branding: false,
        promotion: false,
      }}
    />
  );
}
