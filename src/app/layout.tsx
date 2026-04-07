import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cosmetic AI",
  description:
    "AI-powered social media content creation for cosmetics and home chemistry businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInitScript = `
    (function () {
      try {
        var key = 'cosmetic-ai-theme';
        var mode = localStorage.getItem(key) || 'system';
        var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var dark = mode === 'dark' || (mode === 'system' && systemDark);
        document.documentElement.classList.toggle('dark', dark);
      } catch (e) {}
    })();
  `;

  return (
    <html lang="sr" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
