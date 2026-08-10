import type { NextConfig } from "next";

/* El optimizador de imágenes solo sirve orígenes declarados aquí. El del
 * proyecto de Supabase se deriva de la env en vez de escribirlo a mano, así
 * que cambiar de proyecto (o pasar a producción) no exige tocar este archivo
 * ni deja el catálogo sin fotos por un hostname olvidado. */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  /* Las fotos viajan DENTRO de la Server Action que registra la compra o crea
   * el producto, y el cuerpo de una Server Action está limitado a 1 MB por
   * defecto: cualquier foto de teléfono lo revienta y la acción muere con un
   * error del servidor, no con un aviso dentro del formulario.
   *
   * 4 MB y no más: la mayoría de plataformas cortan la petición sobre los
   * 4,5 MB y ahí ya no manda esta línea, sino el proxy. Lo que de verdad
   * sostiene el margen es que ImagePicker reduce cada foto antes de enviarla
   * —una compra con tres productos nuevos manda tres— así que este número es
   * el techo de seguridad, no el tamaño de trabajo. */
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
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
