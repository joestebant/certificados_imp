"use client";

import { useRef, useState } from "react";

// Parámetros fijos pedidos
const FONT_SPEC = "400 190px 'Pinyon Script', cursive";
const Y_PERCENT = 47;
const MAX_WIDTH_PCT = 85;


  function triggerDownload(dataURL: string, filename: string) {
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = filename;
    // If the browser supports download attribute
    if (typeof (a as any).download === "string") {
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      // Fallback (iOS Safari): open in new tab, user can long-press/save
      window.open(dataURL, "_blank");
    }
  }

export default function Home() {
  const [nombre, setNombre] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function handleDownload(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;

    // Cargar imagen base
    const img = await loadImage("/template-certificado.png");

    // Asegurar carga de fuente
    try {
      await (document as any).fonts?.load(FONT_SPEC);
    } catch {}

    // Dibujar en canvas oculto
    const cv = canvasRef.current || document.createElement("canvas");
    const ctx = cv.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    cv.width = img.naturalWidth * dpr;
    cv.height = img.naturalHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

    // Texto (auto-ajuste hacia abajo si no cabe, nunca arriba de 190px)
    const text = nombre.trim();
    const maxTextWidth = (img.naturalWidth * MAX_WIDTH_PCT) / 100;
    const centerX = img.naturalWidth / 2;
    const y = (img.naturalHeight * Y_PERCENT) / 100;

    let size = getFontPx(FONT_SPEC); // 190
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#0f172a";

    ctx.font = withSize(FONT_SPEC, size);
    while (ctx.measureText(text).width > maxTextWidth && size > 56) {
      size -= 2;
      ctx.font = withSize(FONT_SPEC, size);
    }

    ctx.shadowColor = "rgba(0,0,0,0.10)";
    ctx.shadowBlur = Math.max(0, size * 0.06);
    ctx.fillText(text, centerX, y);

    // Descargar (compatible con móviles/iOS)
    const dataURL = cv.toDataURL("image/png");
    const cleanName = text.replace(/\s+/g, " ").trim();
    triggerDownload(dataURL, `Certificado - ${cleanName}.png`);
  }

  return (
    <div className="container">
      <main className="card">
        <h1>Descarga tu Certificado</h1>
        <p className="sub">Ingresa tu nombre y apellido. Al continuar, se descargará tu certificado en PNG.</p>

        <form onSubmit={handleDownload}>
          <div>
            <label htmlFor="nombre">Nombre y apellido</label>
            <input
              id="nombre"
              type="text" autoComplete="name" inputMode="text"
              placeholder="Ej: Juan Pérez"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <div className="helper">La tipografía y posición están predefinidas para mantener el diseño.</div>
          </div>
          <button type="submit">Descargar certificado</button>
        </form>

        {/* Canvas oculto (sin previsualización) */}
        <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden />
        <div className="footer">Diseño optimizado para impresión. Formato PNG.</div>
      </main>
    </div>
  );
}

// Utils
function getFontPx(spec: string) {
  const m = spec.match(/(\d+)px/);
  return m ? parseInt(m[1], 10) : 190;
}
function withSize(spec: string, px: number) {
  return spec.replace(/\d+px/, `${Math.round(px)}px`);
}
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
