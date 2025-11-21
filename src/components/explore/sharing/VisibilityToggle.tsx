// src/components/explore/sharing/VisibilityToggle.tsx

import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Globe, Lock } from "lucide-react";

type VisibilityToggleProps = {
  isPublic: boolean;
  playlistId: number | string;
  onChange: (playlistId: number | string, checked: boolean) => void;
  disabled?: boolean;
};

/**

VisibilityToggle:

Switch to mark a playlist as public or private.

Calls onChange with playlistId + new checked value.
*/
export default function VisibilityToggle({
  isPublic,
  playlistId,
  onChange,
  disabled,
}: VisibilityToggleProps) {
  const id = "visibility-" + String(playlistId);

  return (
    <div className="flex items-center gap-3">
      <Switch
        id={id}
        checked={isPublic}
        onCheckedChange={(checked) => onChange(playlistId, Boolean(checked))}
        disabled={disabled}
        aria-label={
          "Toggle public visibility for playlist " + String(playlistId)
        }
      />
      <Label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
        {isPublic ? (
          <>
            <Globe className="w-4 h-4 text-green-600" aria-hidden="true" />
            <span className="text-green-700 font-medium">Public</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 text-gray-500" aria-hidden="true" />
            <span className="text-gray-600">Private</span>
          </>
        )}
      </Label>
    </div>
  );
}
