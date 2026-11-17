import { useId } from 'react';
/**
 * Accesibilidad de errores: el campo se marca con aria-invalid y apunta a su
 * mensaje con aria-describedby SOLO mientras el error se muestra (si se
 * referenciara siempre, el lector de pantalla lo leería antes de tiempo).
 */
export function useFieldError(error, describedBy) {
  const errorId = useId();
  const ids = [describedBy, error ? errorId : null].filter(Boolean).join(' ');
  return {
    errorId,
    fieldProps: { 'aria-invalid': error ? 'true' : 'false', 'aria-describedby': ids || undefined },
  };
}
