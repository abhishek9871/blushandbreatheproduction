
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './hooks/useTheme';
import { BookmarkProvider } from './hooks/useBookmarks';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <BookmarkProvider>
        <App />
      </BookmarkProvider>
    </ThemeProvider>
  </React.StrictMode>
);