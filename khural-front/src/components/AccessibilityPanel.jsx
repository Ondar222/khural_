import React from "react";
import { EyeIcon } from "./icons/LinearIcons.jsx";

export default function AccessibilityPanel() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [settings, setSettings] = React.useState(() => {
    // Загружаем настройки из localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('accessibilitySettings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return { fontSize: 1, theme: 'normal', contrast: 'normal' };
        }
      }
    }
    return { fontSize: 1, theme: 'normal', contrast: 'normal' };
  });

  // Применяем настройки к body
  React.useEffect(() => {
    const body = document.body;
    
    // Удаляем все классы доступности
    body.classList.remove('a11y-large', 'a11y-xlarge', 'a11y-high-contrast', 'a11y-dark', 'a11y-blue', 'a11y-brown');
    
    // Применяем размер шрифта только если не стандартный
    if (settings.fontSize === 1.25) {
      body.classList.add('a11y-large');
    } else if (settings.fontSize === 1.5) {
      body.classList.add('a11y-xlarge');
    }
    
    // Применяем тему только если не стандартная
    if (settings.theme === 'dark') {
      body.classList.add('a11y-dark');
    } else if (settings.theme === 'blue') {
      body.classList.add('a11y-blue');
    } else if (settings.theme === 'brown') {
      body.classList.add('a11y-brown');
    }
    
    // Применяем контраст только если не стандартный
    if (settings.contrast === 'high') {
      body.classList.add('a11y-high-contrast');
    }
    
    // Сохраняем настройки
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings({ fontSize: 1, theme: 'normal', contrast: 'normal' });
  };

  return (
    <>
      {/* Кнопка открытия панели */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="a11y-toggle-btn"
        aria-label="Версия для слабовидящих"
        title="Версия для слабовидящих"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '2px solid #003366',
          backgroundColor: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <EyeIcon size={15} />
      </button>

      {/* Панель настроек */}
      {isOpen && (
        <div
          className="a11y-panel"
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 10001,
            backgroundColor: '#fff',
            border: '2px solid #003366',
            borderRadius: '8px',
            padding: '20px',
            minWidth: '300px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Версия для слабовидящих</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
                lineHeight: '1',
              }}
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          {/* Размер шрифта */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
              Размер шрифта:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => updateSetting('fontSize', 1)}
                className={settings.fontSize === 1 ? 'active' : ''}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #003366',
                  borderRadius: '4px',
                  backgroundColor: settings.fontSize === 1 ? '#003366' : '#fff',
                  color: settings.fontSize === 1 ? '#fff' : '#003366',
                  cursor: 'pointer',
                }}
              >
                Обычный
              </button>
              <button
                onClick={() => updateSetting('fontSize', 1.25)}
                className={settings.fontSize === 1.25 ? 'active' : ''}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #003366',
                  borderRadius: '4px',
                  backgroundColor: settings.fontSize === 1.25 ? '#003366' : '#fff',
                  color: settings.fontSize === 1.25 ? '#fff' : '#003366',
                  cursor: 'pointer',
                }}
              >
                Крупный
              </button>
              <button
                onClick={() => updateSetting('fontSize', 1.5)}
                className={settings.fontSize === 1.5 ? 'active' : ''}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #003366',
                  borderRadius: '4px',
                  backgroundColor: settings.fontSize === 1.5 ? '#003366' : '#fff',
                  color: settings.fontSize === 1.5 ? '#fff' : '#003366',
                  cursor: 'pointer',
                }}
              >
                Очень крупный
              </button>
            </div>
          </div>

          {/* Цветовая схема */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
              Цветовая схема:
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => updateSetting('theme', 'normal')}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #003366',
                  borderRadius: '4px',
                  backgroundColor: settings.theme === 'normal' ? '#003366' : '#fff',
                  color: settings.theme === 'normal' ? '#fff' : '#003366',
                  cursor: 'pointer',
                }}
              >
                Обычная
              </button>
              <button
                onClick={() => updateSetting('theme', 'dark')}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #003366',
                  borderRadius: '4px',
                  backgroundColor: settings.theme === 'dark' ? '#003366' : '#fff',
                  color: settings.theme === 'dark' ? '#fff' : '#003366',
                  cursor: 'pointer',
                }}
              >
                Темная
              </button>
              <button
                onClick={() => updateSetting('theme', 'blue')}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #003366',
                  borderRadius: '4px',
                  backgroundColor: settings.theme === 'blue' ? '#003366' : '#fff',
                  color: settings.theme === 'blue' ? '#fff' : '#003366',
                  cursor: 'pointer',
                }}
              >
                Синяя
              </button>
              <button
                onClick={() => updateSetting('theme', 'brown')}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #003366',
                  borderRadius: '4px',
                  backgroundColor: settings.theme === 'brown' ? '#003366' : '#fff',
                  color: settings.theme === 'brown' ? '#fff' : '#003366',
                  cursor: 'pointer',
                }}
              >
                Коричневая
              </button>
            </div>
          </div>

          {/* Контраст */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
              Контраст:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => updateSetting('contrast', 'normal')}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #003366',
                  borderRadius: '4px',
                  backgroundColor: settings.contrast === 'normal' ? '#003366' : '#fff',
                  color: settings.contrast === 'normal' ? '#fff' : '#003366',
                  cursor: 'pointer',
                }}
              >
                Обычный
              </button>
              <button
                onClick={() => updateSetting('contrast', 'high')}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #003366',
                  borderRadius: '4px',
                  backgroundColor: settings.contrast === 'high' ? '#003366' : '#fff',
                  color: settings.contrast === 'high' ? '#fff' : '#003366',
                  cursor: 'pointer',
                }}
              >
                Высокий
              </button>
            </div>
          </div>

          {/* Кнопка сброса */}
          <button
            onClick={resetSettings}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #dc3545',
              borderRadius: '4px',
              backgroundColor: '#fff',
              color: '#dc3545',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Сбросить настройки
          </button>
        </div>
      )}
    </>
  );
}

