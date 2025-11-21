import * as React from "react"
import { cn } from "@/lib/utils"
import { validateTextInput } from "@/utils/contentModeration"

interface InputProps extends React.ComponentProps<"input"> {
  enableModeration?: boolean;
  onValidationError?: (error: string | null) => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, enableModeration = true, onValidationError, onChange, onPaste, value, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const lastValidValue = React.useRef<string>(typeof value === 'string' ? value : (props.defaultValue as string) || '');

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      // Apply content moderation if enabled (skip for password and email fields)
      if (enableModeration && type !== 'password' && type !== 'email' && type !== 'checkbox' && type !== 'radio') {
        const error = validateTextInput(newValue);
        if (onValidationError) {
          onValidationError(error);
        }
        // If validation fails, revert to last valid value
        if (error) {
          // Use setTimeout to ensure DOM is updated
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.value = lastValidValue.current;
              // Trigger input event to sync React state if uncontrolled
              const syntheticEvent = new Event('input', { bubbles: true });
              inputRef.current.dispatchEvent(syntheticEvent);
            }
          }, 0);
          // Create a synthetic event with the old value for controlled components
          const syntheticEvent = {
            ...e,
            target: { ...e.target, value: lastValidValue.current },
            currentTarget: { ...e.currentTarget, value: lastValidValue.current }
          } as React.ChangeEvent<HTMLInputElement>;
          if (onChange) {
            onChange(syntheticEvent);
          }
          return;
        }
        // Update last valid value
        lastValidValue.current = newValue;
      } else {
        lastValidValue.current = newValue;
      }
      
      // Call original onChange
      if (onChange) {
        onChange(e);
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData.getData('text');
      
      // Validate pasted content
      if (enableModeration && type !== 'password' && type !== 'email') {
        const error = validateTextInput(pastedText);
        if (error) {
          e.preventDefault();
          if (onValidationError) {
            onValidationError(error);
          }
          return;
        }
      }
      
      // Call original onPaste
      if (onPaste) {
        onPaste(e);
      }
    };

    // Update lastValidValue when value prop changes
    React.useEffect(() => {
      if (typeof value === 'string') {
        lastValidValue.current = value;
      }
    }, [value]);

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={inputRef}
        onChange={handleChange}
        onPaste={handlePaste}
        {...(value !== undefined ? { value } : {})}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
