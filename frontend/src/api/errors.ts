import axios from 'axios';

interface ApiErrorBody {
  message?: string;
  code?: string;
  details?: {
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  };
}

export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado. Intente nuevamente.'): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    const fieldErrors = body?.details?.fieldErrors;
    const firstFieldError = fieldErrors
      ? Object.values(fieldErrors).flat().find((message) => Boolean(message))
      : undefined;

    if (body?.message) {
      return firstFieldError ? `${body.message}: ${firstFieldError}` : body.message;
    }
    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. Verifique que la API esté en ejecución.';
    }
    return (error as Error & { userMessage?: string }).userMessage || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
