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
    const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // Cleanup debounce timer on unmount
    React.useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      // Always allow typing - update value immediately
      lastValidValue.current = newValue;
      
      // Call original onChange immediately for responsive UI
      if (onChange) {
        onChange(e);
      }
      
      // Apply content moderation if enabled (skip for password and email fields)
      if (enableModeration && type !== 'password' && type !== 'email' && type !== 'checkbox' && type !== 'radio') {
        // Clear previous debounce timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Debounce validation - wait 500ms after user stops typing
        debounceTimerRef.current = setTimeout(() => {
          const error = validateTextInput(newValue);
          if (onValidationError) {
            onValidationError(error);
          }
        }, 500);
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData.getData('text');
      
      // Allow paste - validate after paste completes
      // Call original onPaste first
      if (onPaste) {
        onPaste(e);
      }
      
      // Validate pasted content after a short delay (to allow paste to complete)
      if (enableModeration && type !== 'password' && type !== 'email') {
        setTimeout(() => {
          const error = validateTextInput(pastedText);
          if (onValidationError) {
            onValidationError(error);
          }
        }, 100);
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
