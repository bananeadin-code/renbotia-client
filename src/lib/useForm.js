import { useCallback, useState } from 'react';

/**
 * Hook de formulario ligero (sin dependencias) para validar campos obligatorios
 * con errores DENTRO del campo (se pasan al prop `error` de <Input>), en lugar de
 * los globos nativos del navegador. Recuerda poner `noValidate` en el <form> y
 * validar en el submit.
 *
 *   const f = useForm({ email: '', password: '' }, {
 *     email: v.compose(v.required(), v.email()),
 *     password: v.required('Escribe tu contraseña'),
 *   });
 *   <Input value={f.values.email} onChange={f.setField('email')} error={f.errors.email} />
 *   onSubmit: if (!f.validate()) return; ... usa f.values
 */
export function useForm(initial, validators = {}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  // Devuelve un onChange para el campo; limpia su error al escribir.
  const setField = useCallback(
    (name) => (e) => {
      const value = e && e.target ? e.target.value : e;
      setValues((v) => ({ ...v, [name]: value }));
      setErrors((er) => (er[name] ? { ...er, [name]: '' } : er));
    },
    []
  );

  const setError = useCallback((name, msg) => setErrors((er) => ({ ...er, [name]: msg })), []);

  const validate = useCallback(() => {
    const next = {};
    for (const [name, fn] of Object.entries(validators)) {
      const msg = fn(values[name], values);
      if (msg) next[name] = msg;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [values, validators]);

  return { values, setValues, errors, setErrors, setError, setField, validate };
}

/** Validadores componibles. Devuelven '' si es válido, o el mensaje de error. */
export const v = {
  required:
    (msg = 'Este campo es obligatorio') =>
    (val) =>
      String(val ?? '').trim() ? '' : msg,
  email:
    (msg = 'Escribe un correo válido') =>
    (val) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || '').trim()) ? '' : msg,
  minLen:
    (n, msg) =>
    (val) =>
      String(val || '').length >= n ? '' : msg || `Debe tener al menos ${n} caracteres`,
  compose:
    (...fns) =>
    (val, all) => {
      for (const fn of fns) {
        const m = fn(val, all);
        if (m) return m;
      }
      return '';
    },
};
