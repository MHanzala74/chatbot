import "./globals.css";

export const metadata = {
  title: "Simple Chatbot",
  description: "A simple AI chatbot deployed on Temps",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
