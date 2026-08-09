import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel — EduardoPro",
  robots: { index: false, follow: false },
};

// Solo envuelve. El shell con sidebar vive en (panel)/layout.tsx, para que
// /admin/login quede fuera de él — una pantalla de acceso con menú lateral no
// tiene sentido y además el menú necesita saber el rol, que allí aún no existe.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
