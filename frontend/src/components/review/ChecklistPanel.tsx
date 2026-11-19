import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { ReviewCheck } from '../../types';
import { reviewApi } from '../../api/services';
import { getErrorMessage } from '../../api/errors';
import Alert from '../ui/Alert';

const schema = z.object({
  checks: z.array(z.object({
    key: z.string(),
    passed: z.boolean(),
    notes: z.string().max(2000).optional(),
  })),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  itemId: string;
  checks: ReviewCheck[];
  canEdit: boolean;
}

export default function ChecklistPanel({ itemId, checks, canEdit }: Props) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { checks: [] },
  });

  useEffect(() => {
    reset({
      checks: checks.map((check) => ({
        key: check.key,
        passed: check.computed === false ? false : check.passed,
        notes: check.notes ?? '',
      })),
    });
  }, [checks, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => reviewApi.saveChecks(itemId, values.checks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-checks', itemId] });
      queryClient.invalidateQueries({ queryKey: ['review-detail', itemId] });
    },
  });

  const mandatory = checks.filter((check) => check.mandatory);
  const passedMandatory = mandatory.filter((check) => check.passed && check.computed).length;
  const passedTotal = checks.filter((check) => check.passed && check.computed).length;

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-unior-900/10 bg-gradient-to-r from-unior-50 to-brand-50/40 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="font-display text-2xl font-bold leading-none text-unior-900">{passedTotal}<span className="text-sm font-normal text-unior-400">/{checks.length}</span></p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-unior-500">Cumplidos</p>
          </div>
          <div className="h-8 w-px bg-unior-900/10" />
          <div className="text-center">
            <p className="font-display text-2xl font-bold leading-none text-unior-900">{passedMandatory}<span className="text-sm font-normal text-unior-400">/{mandatory.length}</span></p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-unior-500">Obligatorios</p>
          </div>
        </div>
        <p className="text-[10px] leading-4 text-ink-soft/50">El sistema verifica la evidencia documental.</p>
      </div>

      <div className="space-y-2">
        {checks.map((check, index) => {
          const computed = check.computed === true;
          const blocked = canEdit && !computed;
          return (
            <div key={check.key} className={`rounded-xl border p-3.5 transition ${computed ? 'border-unior-900/10 bg-white hover:border-brand-400/30 hover:bg-brand-50/20' : 'border-amber-200 bg-amber-50/60'}`}>
              <div className="flex items-start gap-3">
                <input type="hidden" {...register(`checks.${index}.key`)} />
                <input
                  type="checkbox"
                  id={`check-${check.key}`}
                  disabled={!canEdit || blocked}
                  {...register(`checks.${index}.passed`)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <label htmlFor={`check-${check.key}`} className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-800">
                    {check.label}
                    {check.mandatory && <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600">Obligatorio</span>}
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${computed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {computed ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> : <XCircle className="h-3 w-3" aria-hidden="true" />}
                      {computed ? 'Evidencia encontrada' : 'Sin evidencia'}
                    </span>
                  </label>
                  {!computed && (
                    <p className="mt-1 text-xs text-amber-700">El sistema no encontró evidencia que cumpla este requisito. Corrija los metadatos o el archivo antes de marcarlo.</p>
                  )}
                  <input
                    type="text"
                    placeholder="Notas de la revisión (opcional)"
                    disabled={!canEdit}
                    {...register(`checks.${index}.notes`)}
                    className="input mt-2"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {errors.checks && <p className="text-sm text-red-600">Revise la lista de verificación.</p>}
      {mutation.isError && <Alert tone="error" title="No se pudo guardar el checklist">{getErrorMessage(mutation.error)}</Alert>}
      {mutation.isSuccess && <Alert tone="success">Checklist guardado correctamente.</Alert>}
      {canEdit && (
        <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary">
          {mutation.isPending ? 'Guardando…' : 'Guardar checklist'}
        </button>
      )}
    </form>
  );
}
