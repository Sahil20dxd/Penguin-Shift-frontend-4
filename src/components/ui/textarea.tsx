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
    const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    // Cleanup debounce timer on unmount
    React.useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      
      // Always allow typing - update value immediately
      lastValidValue.current = newValue;
      
      // Call original onChange immediately for responsive UI
      if (onChange) {
        onChange(e);
      }
      
      // Apply content moderation if enabled
      if (enableModeration) {
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

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pastedText = e.clipboardData.getData('text');
      
      // Allow paste - validate after paste completes
      // Call original onPaste first
      if (onPaste) {
        onPaste(e);
      }
      
      // Validate pasted content after a short delay (to allow paste to complete)
      if (enableModeration) {
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
