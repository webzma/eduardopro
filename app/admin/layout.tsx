import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Inventario — EduardoPro",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-bg text-cream">{children}</div>;
}
