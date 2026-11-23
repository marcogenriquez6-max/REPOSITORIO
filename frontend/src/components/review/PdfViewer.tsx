import { useEffect, useState } from 'react';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { downloadPdf, fetchPdfBlob } from '../../api/services';
import { Skeleton } from '../ui/Skeleton';

export default function PdfViewer({ bitstreamId, fileName }: { bitstreamId?: string; fileName?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bitstreamId) return;
    let created: string | null = null;
    let active = true;
    setError('');
    setUrl(null);
    fetchPdfBlob(bitstreamId)
      .then((objectUrl) => {
        created = objectUrl;
        if (active) setUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        if (active) setError('No se pudo cargar el documento PDF. Verifique sus permisos o intente más tarde.');
      });
    return () => {
      active = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [bitstreamId]);

  if (!bitstreamId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <FileText className="h-6 w-6 text-slate-400" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-600">El documento no tiene archivo PDF adjunto</p>
        <p className="text-xs text-slate-500">El registro puede estar en preparación o el archivo fue retirado.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
        {error}
      </div>
    );
  }

  if (!url) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-[60vh] w-full" />
        <p className="text-center text-xs text-slate-500">Cargando visor PDF…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <a href={url} target="_blank" rel="noreferrer" className="btn-secondary px-3 py-1.5 text-xs">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Abrir en nueva pestaña
        </a>
        <button type="button" onClick={() => void downloadPdf(bitstreamId, fileName)} className="btn-primary px-3 py-1.5 text-xs">
          <Download className="h-3.5 w-3.5" aria-hidden="true" /> Descargar PDF
        </button>
      </div>
      <object data={url} type="application/pdf" className="h-[70vh] w-full rounded border bg-white" aria-label={`Visor del documento ${fileName ?? ''}`.trim()}>
        <iframe src={url} title={fileName ? `Visor PDF: ${fileName}` : 'Visor PDF'} className="h-[70vh] w-full" />
      </object>
    </div>
  );
}
