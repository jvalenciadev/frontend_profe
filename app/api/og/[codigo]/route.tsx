import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Revalidar cada 5 minutos para que crawlers obtengan imagen fresca sin overhead
export const revalidate = 300;

const API_BASE = (
    process.env.VIEWS_API_URL ||
    process.env.NEXT_PUBLIC_VIEWS_API_URL ||
    'http://172.20.34.60:3005'
).replace(/\/$/, '');

const SECRET = process.env.API_SECRET || process.env.NEXT_PUBLIC_API_SECRET || 'mQsYt86mu5wiiqjmwyxYXMqeHVo4lRqIT6dQUwqYqzM=';

const BACKEND_BASE = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    'http://172.20.34.60:3000'
).replace(/\/api$/, '').replace(/\/$/, '');

const SITE_BASE = (process.env.NEXT_PUBLIC_APP_URL || 'https://aulaprofe.minedu.gob.bo').replace(/\/$/, '');

/** Construye la URL absoluta de la imagen del afiche/banner */
function resolveImageUrl(path?: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const withUploads = normalized.toLowerCase().startsWith('/uploads/')
        ? normalized
        : `/uploads${normalized}`;
    return `${BACKEND_BASE}${withUploads}`;
}

/** Descarga la imagen del evento y la convierte a base64 para incrustarla en ImageResponse */
async function fetchImageAsBase64(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (!res.ok) return null;
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        return `data:${contentType};base64,${base64}`;
    } catch {
        return null;
    }
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ codigo: string }> }
) {
    const { codigo } = await params;

    try {
        // 1. Obtener datos del evento
        const res = await fetch(`${API_BASE}/public/eventos/${codigo}`, {
            headers: { 'X-SECRET': SECRET },
            signal: AbortSignal.timeout(4000),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const evento = await res.json();

        // 2. Resolver imagen: preferir afiche, fallback a banner
        const imagePath = evento.afiche || evento.banner;
        const imageUrl = resolveImageUrl(imagePath);

        // 3. Si tiene imagen, convertirla a base64 (accesible desde edge runtime)
        let imageData: string | null = null;
        if (imageUrl) {
            imageData = await fetchImageAsBase64(imageUrl);
        }

        const nombre: string = evento.nombre || 'Evento';
        const tipoNombre: string = evento.tipo?.nombre || '';

        // 4. Renderizar imagen OG
        return new ImageResponse(
            (
                <div
                    style={{
                        width: '1200px',
                        height: '630px',
                        display: 'flex',
                        position: 'relative',
                        backgroundColor: '#0f172a',
                        overflow: 'hidden',
                    }}
                >
                    {/* Afiche/banner como fondo */}
                    {imageData ? (
                        <img
                            src={imageData}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    ) : null}

                    {/* Overlay degradado para legibilidad */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: imageData
                                ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)'
                                : 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
                            display: 'flex',
                        }}
                    />

                    {/* Contenido inferior */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '40px 56px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                        }}
                    >
                        {tipoNombre ? (
                            <span
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 900,
                                    letterSpacing: '0.25em',
                                    textTransform: 'uppercase',
                                    color: '#fbbf24',
                                }}
                            >
                                {tipoNombre}
                            </span>
                        ) : null}

                        <span
                            style={{
                                fontSize: nombre.length > 50 ? '32px' : '42px',
                                fontWeight: 900,
                                color: '#ffffff',
                                lineHeight: 1.15,
                                textTransform: 'uppercase',
                            }}
                        >
                            {nombre}
                        </span>

                        <span
                            style={{
                                fontSize: '18px',
                                color: 'rgba(255,255,255,0.7)',
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                            }}
                        >
                            PROFE · Ministerio de Educación de Bolivia
                        </span>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (err) {
        // Fallback: imagen institucional genérica
        return new ImageResponse(
            (
                <div
                    style={{
                        width: '1200px',
                        height: '630px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
                        flexDirection: 'column',
                        gap: '16px',
                    }}
                >
                    <span style={{ fontSize: '64px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.3em' }}>
                        PROFE
                    </span>
                    <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em' }}>
                        Ministerio de Educación de Bolivia
                    </span>
                </div>
            ),
            { width: 1200, height: 630 }
        );
    }
}
