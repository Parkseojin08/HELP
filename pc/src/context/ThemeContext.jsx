import { createContext, useContext, useState, useEffect } from "react";

// Theme context 생성
const ThemeContext = createContext(null);

// Theme Provider
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // 로컬스토리지에서 저장된 테마 불러오기
    const savedTheme = localStorage.getItem("app-theme");
    if (savedTheme) return savedTheme;
    
    // 시스템 설정 확인
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    // DOM 업데이트
    document.documentElement.setAttribute("data-theme", theme);
    // 로컬스토리지 저장
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
