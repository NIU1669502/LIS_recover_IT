export const metadata = {
  title: "Exemple Supabase",
  description: "Exemple de lectura i escriptura amb Supabase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ca">
      <body>{children}</body>
    </html>
  );
}
