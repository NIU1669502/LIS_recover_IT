import ToastContainer from './components/ToastContainer'
export const metadata = {
  title: "RecoverIT",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ca">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      </head>
      <body>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
