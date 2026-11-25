import "./globals.css";
import AnalyticsProvider from "../components/analytics-provider";

export const metadata = {
  title: "Simple Chatbot",
  description: "A simple AI chatbot deployed on Temps",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
