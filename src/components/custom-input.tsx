import {
  useMemo,
  useState,
  type ChangeEventHandler,
  type FocusEventHandler,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
  type UseControllerProps,
} from "react-hook-form";
import { Icon } from "@/lib/ui";

type BorderRadius = "md" | "lg" | "xl" | "2xl" | "3xl";

const radiusMap: Record<BorderRadius, number> = {
  md: 8,
  lg: 12,
  xl: 14,
  "2xl": 18,
  "3xl": 24,
};

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "onFocus"
>;

interface CustomInputProps<
  TFieldValues extends FieldValues,
> extends NativeInputProps {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: UseControllerProps<TFieldValues, Path<TFieldValues>>["rules"];
  label?: string;
  isVerified?: boolean;
  borderRadius?: BorderRadius;
  className?: string;
  inputClassName?: string;
  rightIcon?: ReactNode;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
}

export default function CustomInput<TFieldValues extends FieldValues>({
  name,
  control,
  rules,
  label,
  type = "text",
  readOnly,
  isVerified,
  borderRadius,
  className,
  inputClassName,
  rightIcon,
  onChange,
  onFocus,
  onBlur,
  id,
  style,
  placeholder,
  ...rest
}: CustomInputProps<TFieldValues>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
    rules,
  });

  const [showPassword, setShowPassword] = useState(false);

  const inputValue =
    typeof field.value === "string" || typeof field.value === "number"
      ? field.value
      : "";

  const rightSlotPadding = useMemo(() => {
    const numberOfSlots =
      Number(type === "password") +
      Number(Boolean(isVerified)) +
      Number(Boolean(rightIcon));

    return numberOfSlots > 0 ? 14 + numberOfSlots * 34 : undefined;
  }, [type, isVerified, rightIcon]);

  const inputId = id ?? String(name);
  const errorId = `${inputId}-error`;

  const resolvedType =
    type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`custom-input-wrap ${className ?? ""}`}>
      {label && (
        <label className="label" htmlFor={inputId}>
          {label}
        </label>
      )}

      <div className="custom-input-field">
        <input
          {...rest}
          ref={field.ref}
          id={inputId}
          name={field.name}
          type={resolvedType}
          value={inputValue}
          readOnly={readOnly}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : rest["aria-describedby"]}
          onChange={(event) => {
            field.onChange(event);
            onChange?.(event);
          }}
          onFocus={(event) => {
            onFocus?.(event);
          }}
          onBlur={(event) => {
            field.onBlur();
            onBlur?.(event);
          }}
          className={[
            "input",
            "custom-input-control",
            error ? "is-error" : "",
            inputClassName ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            ...style,
            ...(borderRadius
              ? {
                  borderRadius: radiusMap[borderRadius],
                }
              : {}),
            ...(rightSlotPadding
              ? {
                  paddingRight: rightSlotPadding,
                }
              : {}),
          }}
        />

        {(type === "password" || isVerified || rightIcon) && (
          <div className="custom-input-actions">
            {isVerified && (
              <span
                className="custom-input-verified"
                aria-label="Verified"
                title="Verified"
              >
                <Icon n="check" s={14} />
              </span>
            )}

            {type === "password" && (
              <button
                type="button"
                className="autheye custom-input-eye"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Icon
                  n="eye"
                  s={17}
                  c={showPassword ? "var(--blue-ink)" : "var(--muted)"}
                />
              </button>
            )}

            {rightIcon && (
              <span className="custom-input-right-icon">{rightIcon}</span>
            )}
          </div>
        )}
      </div>

      {error?.message && (
        <p id={errorId} className="custom-input-error" role="alert">
          {String(error.message)}
        </p>
      )}
    </div>
  );
}
