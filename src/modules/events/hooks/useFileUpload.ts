import { useMutation } from "convex/react";
import type { ImagePickerAsset } from "expo-image-picker";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type UploadResponse = {
  storageId: Id<"_storage">;
};

export function useFileUpload() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const uploadAsset = async (asset: ImagePickerAsset): Promise<Id<"_storage">> => {
    const uploadUrl = await generateUploadUrl({});

    const fileResponse = await fetch(asset.uri);
    const blob = await fileResponse.blob();

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": asset.mimeType ?? blob.type ?? "application/octet-stream",
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload image to storage.");
    }

    const payload = (await uploadResponse.json()) as UploadResponse;
    return payload.storageId;
  };

  return { uploadAsset };
}
