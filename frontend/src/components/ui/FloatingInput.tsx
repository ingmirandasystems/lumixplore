import { useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import "./FloatingInput.css";

type FloatingInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "placeholder" | "id"
> & {
  id: string;
  label: string;
};

export function FloatingInput({
  id,
  label,
  className,
  ...inputProps
}: FloatingInputProps) {
  const labelRef = useRef<HTMLLabelElement>(null);
  const [labelWidth, setLabelWidth] = useState(0);

  useLayoutEffect(() => {
    const element = labelRef.current;
    if (!element) return;

    function measure() {
      if (element) {
        setLabelWidth(element.getBoundingClientRect().width);
      }
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();

    return () => observer.disconnect();
  }, [label]);

  const style = {
    "--label-width": `${labelWidth}px`,
  } as CSSProperties;

  return (
    <div className="floating-input" style={style}>
      <input
        {...inputProps}
        id={id}
        className={`floating-input__control ${className ?? ""}`}
        placeholder=" "
      />

      <label ref={labelRef} htmlFor={id} className="floating-input__label">
        {label}
      </label>

      <span className="floating-input__border" aria-hidden="true" />
    </div>
  );
}
