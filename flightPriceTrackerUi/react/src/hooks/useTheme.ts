import { useEffect, useState } from 'react';

export type ThemeType = 'light' | 'dark';

function getInitialTheme(): ThemeType {
  const stored = localStorage.getItem('kendo-theme') || localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useTheme = (): { currentTheme: ThemeType; toggleTheme: () => void } => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(getInitialTheme);

  useEffect(() => {
    const htmlElement = document.documentElement;
    htmlElement.classList.remove('dark', 'light');
    if (currentTheme === 'dark') {
      htmlElement.classList.add('dark');
    }
    applyKendoTheme(currentTheme);
  }, []);

  const applyKendoTheme = async (theme: ThemeType): Promise<void> => {
    try {
      let linkElement = document.getElementById('kendo-theme') as HTMLLinkElement | null;

      if (!linkElement) {
        linkElement = document.querySelector('link[href*="kendo"]') as HTMLLinkElement;
      }

      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.type = 'text/css';
        linkElement.id = 'kendo-theme';
        document.head.appendChild(linkElement);
      }

      const newHref = `styles/css/kendo-${theme}.css`;

      if (!linkElement.href.endsWith(newHref)) {
        linkElement.href = newHref;

        await new Promise<void>((resolve) => {
          const timeoutId = setTimeout(() => resolve(), 10000);
          linkElement!.onload = () => {
            clearTimeout(timeoutId);
            resolve();
          };
          linkElement!.onerror = () => {
            clearTimeout(timeoutId);
            resolve();
          };
        });
      }

      localStorage.setItem('kendo-theme', theme);
      localStorage.setItem('theme', theme);

      const kendoThemeEvent = new CustomEvent('kendo-theme-changed', { detail: { theme } });
      document.dispatchEvent(kendoThemeEvent);
    } catch {
      // Silently fail — theme toggle still works via CSS class
    }
  };

  const toggleTheme = (): void => {
    const newTheme: ThemeType = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);

    const htmlElement = document.documentElement;
    htmlElement.classList.remove('dark', 'light');
    if (newTheme === 'dark') {
      htmlElement.classList.add('dark');
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains('light') && newTheme === 'dark') {
            target.classList.remove('light');
          }
        }
      });
    });
    observer.observe(htmlElement, { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => observer.disconnect(), 3000);

    localStorage.setItem('darkMode', newTheme === 'dark' ? 'true' : 'false');
    localStorage.setItem('kendo-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    const c3ThemeEvent = new CustomEvent('c3-theme-changed', { detail: { theme: newTheme } });
    document.dispatchEvent(c3ThemeEvent);

    applyKendoTheme(newTheme);
  };

  return { currentTheme, toggleTheme };
};
