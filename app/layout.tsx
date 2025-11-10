import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eisenhower Matrix & AI Blueprint Organizer",
  description: "Task management and AI model blueprint organization tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
