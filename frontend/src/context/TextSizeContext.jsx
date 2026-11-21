import React, { createContext, useContext, useState, useEffect } from 'react';

const TextSizeContext = createContext({
  textSize: 'md',
  setTextSize: () => {},
});

const SIZES = {
  sm: '13px',
  md: '14px',
  lg: '16px',
};

export function TextSizeProvider({ children }) {
  const [textSize, setTextSizeState] = useState(() => {
    return localStorage.getItem('gbu_font_size') || 'md';
  });

  useEffect(() => {
    const sizePx = SIZES[textSize] || '14px';
    document.documentElement.style.fontSize = sizePx;
    localStorage.setItem('gbu_font_size', textSize);
  }, [textSize]);

  const setTextSize = (size) => {
    if (SIZES[size]) {
      setTextSizeState(size);
    }
  };

  return (
    <TextSizeContext.Provider value={{ textSize, setTextSize }}>
      {children}
    </TextSizeContext.Provider>
  );
}

export function useTextSize() {
  return useContext(TextSizeContext);
}
