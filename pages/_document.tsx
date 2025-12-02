import { Html, Head, Main, NextScript } from "next/document";

// Script to prevent flash of wrong theme AND handle font loading
const themeInitScript = `
(function() {
  // Theme detection
  function getTheme() {
    try {
      var stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (e) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  var theme = getTheme();
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  
  // Font loading detection - adds 'fonts-loaded' class when Material Symbols is ready
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function() {
      document.documentElement.classList.add('fonts-loaded');
    });
  } else {
    // Fallback for browsers without Font Loading API
    setTimeout(function() {
      document.documentElement.classList.add('fonts-loaded');
    }, 500);
  }
})();
`;

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        
        {/* 
          PERFORMANCE OPTIMIZATION: Self-Hosted Fonts
          
          Benefits vs Google Fonts:
          1. No DNS lookup to fonts.googleapis.com (saves 50-100ms)
          2. No TCP connection to fonts.gstatic.com (saves 50-100ms)
          3. No font CSS fetch (saves 100-200ms)
          4. Fonts cached with site assets
          5. Total savings: 200-400ms on mobile
          
          Strategy:
          - Preload font files for fastest delivery
          - font-display: swap in CSS ensures text renders immediately
          - Fonts served from same origin (/fonts/)
        */}
        
        {/* Preload critical fonts - highest priority, non-render-blocking */}
        <link
          rel="preload"
          href="/fonts/lexend-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/material-symbols.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* Font CSS - defines @font-face rules with font-display: swap */}
        <link rel="stylesheet" href="/fonts/fonts.css" />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#2dd4bf" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
