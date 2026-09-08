import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps {
  value?: string; // Pode ser formato ISO "YYYY-MM-DD" ou "DD/MM/YYYY" ou vazio
  onChange: (isoDate: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  id?: string;
}

// Converte YYYY-MM-DD para DD/MM/YYYY
function isoToBR(iso?: string): string {
  if (!iso || typeof iso !== 'string') return '';
  const clean = iso.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-');
    return `${d}/${m}/${y}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    return clean;
  }
  return clean;
}

// Converte DD/MM/YYYY para YYYY-MM-DD
function brToIso(br?: string): string {
  if (!br || typeof br !== 'string') return '';
  const clean = br.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split('/');
    // Validação básica
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    const year = parseInt(y, 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1970 && year <= 2100) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }
  return '';
}

export const DateInput: React.FC<DateInputProps> = ({
  value = '',
  onChange,
  placeholder = 'dd/mm/aaaa',
  className = '',
  disabled = false,
  autoFocus = false,
  onBlur,
  onKeyDown,
  id
}) => {
  const [textValue, setTextValue] = useState<string>(() => isoToBR(value));
  const hiddenDateRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Sincroniza se o valor externo mudar
  useEffect(() => {
    setTextValue(isoToBR(value));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    
    // Se o usuário digitou ou colou no formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      setTextValue(isoToBR(raw));
      onChange(raw);
      return;
    }

    // Permite apenas dígitos e barras
    let digits = raw.replace(/\D/g, '').slice(0, 8);
    let formatted = '';

    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }

    setTextValue(formatted);

    // Se completou 8 dígitos (DD/MM/YYYY)
    if (digits.length === 8) {
      const iso = brToIso(formatted);
      if (iso) {
        onChange(iso);
      }
    } else if (digits.length === 0) {
      onChange('');
    }
  };

  const handleBlur = () => {
    if (textValue.trim() === '') {
      onChange('');
    } else {
      const iso = brToIso(textValue);
      if (iso) {
        onChange(iso);
        setTextValue(isoToBR(iso));
      } else {
        // Se inválido, restaura o valor anterior ou limpa
        const fallback = isoToBR(value);
        setTextValue(fallback);
      }
    }
    onBlur?.();
  };

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    onKeyDown?.(e);
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.value;
    if (picked) {
      setTextValue(isoToBR(picked));
      onChange(picked);
    }
  };

  const openCalendarPicker = () => {
    if (hiddenDateRef.current && !disabled) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          hiddenDateRef.current.showPicker();
        } else {
          hiddenDateRef.current.focus();
        }
      } catch (err) {
        hiddenDateRef.current.click();
      }
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        ref={textInputRef}
        id={id}
        type="text"
        inputMode="numeric"
        disabled={disabled}
        autoFocus={autoFocus}
        value={textValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDownInternal}
        placeholder={placeholder}
        maxLength={10}
        className={`w-full pr-8 ${className}`}
      />

      {/* Botão com ícone de calendário para abrir seletor nativo opcional */}
      <button
        type="button"
        disabled={disabled}
        onClick={openCalendarPicker}
        tabIndex={-1}
        title="Abrir calendário"
        className="absolute right-2.5 p-1 text-slate-400 hover:text-blue-600 transition flex items-center justify-center cursor-pointer"
      >
        <Calendar size={15} />
      </button>

      {/* Input de data nativo oculto para disparar showPicker quando desejado */}
      <input
        ref={hiddenDateRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        value={value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ''}
        onChange={handlePickerChange}
        className="absolute opacity-0 pointer-events-none w-0 h-0 right-0 bottom-0"
      />
    </div>
  );
};
