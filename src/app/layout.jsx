import ToastContainer from './components/ToastContainer'
import { ThemeProvider } from './context/ThemeContext'
import './styles/globals.css'

export const metadata = {
  title: "RecoverIT",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ca">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
