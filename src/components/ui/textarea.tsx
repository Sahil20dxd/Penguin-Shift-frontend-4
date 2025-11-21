import * as React from "react";
import { cn } from "@/lib/utils";
import { validateTextInput } from "@/utils/contentModeration";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  enableModeration?: boolean;
  onValidationError?: (error: string | null) => void;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, enableModeration = true, onValidationError, onChange, onPaste, value, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const lastValidValue = React.useRef<string>(typeof value === 'string' ? value : (props.defaultValue as string) || '');

    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      
      // Apply content moderation if enabled
      if (enableModeration) {
        const error = validateTextInput(newValue);
        if (onValidationError) {
          onValidationError(error);
        }
        // If validation fails, revert to last valid value
        if (error) {
          // Use setTimeout to ensure DOM is updated
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.value = lastValidValue.current;
              // Trigger input event to sync React state if uncontrolled
              const syntheticEvent = new Event('input', { bubbles: true });
              textareaRef.current.dispatchEvent(syntheticEvent);
            }
          }, 0);
          // Create a synthetic event with the old value for controlled components
          const syntheticEvent = {
            ...e,
            target: { ...e.target, value: lastValidValue.current },
            currentTarget: { ...e.currentTarget, value: lastValidValue.current }
          } as React.ChangeEvent<HTMLTextAreaElement>;
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

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pastedText = e.clipboardData.getData('text');
      
      // Validate pasted content
      if (enableModeration) {
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
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={textareaRef}
        onChange={handleChange}
        onPaste={handlePaste}
        {...(value !== undefined ? { value } : {})}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
