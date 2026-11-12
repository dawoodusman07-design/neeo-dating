import { useCallback, useState } from 'react';
import type { ZodType } from 'zod';

type Validator = (value: string) => string | undefined;

/** zod schema → validator returning the first error message. */
export const fromSchema =
  (schema: ZodType): Validator =>
  (v) => {
    const r = schema.safeParse(v);
    return r.success ? undefined : r.error.issues[0]?.message;
  };

/**
 * Form field state with validation on blur (and on submit).
 * Errors show only after the field was touched, then update live while typing.
 * Spread `field.props` into <TextField />.
 */
export function useField(initial: string, validate?: Validator) {
  const [value, setValue] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const error = serverError ?? (touched && validate ? validate(value) : undefined);

  const check = useCallback(() => {
    setTouched(true);
    return !validate || !validate(value);
  }, [validate, value]);

  return {
    value,
    setValue,
    error,
    /** Validate now (e.g. on submit). Returns true when valid. */
    check,
    /** Show an error from the server (cleared on the next edit). */
    setServerError,
    reset: (v = initial) => {
      setValue(v);
      setTouched(false);
      setServerError(undefined);
    },
    props: {
      value,
      error,
      onChangeText: (v: string) => {
        setValue(v);
        setServerError(undefined);
      },
      onBlur: () => setTouched(true),
    },
  };
}
