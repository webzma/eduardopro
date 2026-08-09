import type { NextConfig } from "next";

/* El optimizador de imágenes solo sirve orígenes declarados aquí. El del
 * proyecto de Supabase se deriva de la env en vez de escribirlo a mano, así
 * que cambiar de proyecto (o pasar a producción) no exige tocar este archivo
 * ni deja el catálogo sin fotos por un hostname olvidado. */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              // Solo lo público del bucket: nada de rutas firmadas ni de otros
              // buckets que se añadan después.
              pathname: "/storage/v1/object/public/productos/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
