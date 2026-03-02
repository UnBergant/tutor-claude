/**
 * Chat layout — counteracts parent `<main>` padding to achieve
 * full-height chat experience. The AppHeader is 3.5rem (h-14).
 */
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-m-4 flex h-[calc(100vh-3.5rem)] flex-col md:-m-6">
      {children}
    </div>
  );
}
