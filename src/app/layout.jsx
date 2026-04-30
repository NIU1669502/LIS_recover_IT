import ToastContainer from './components/ToastContainer'

export const metadata = {
  title: "RecoverIT",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ca">
      <body>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
