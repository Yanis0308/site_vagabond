import { Image } from "react-native-compressor";

import { logger } from "./logger";

const DEFAULT_CONFIG = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 1,
} as const;

export async function compressImage(uri: string): Promise<string> {
  try {
    logger(
      `Compressing image with config:`,
      JSON.stringify(DEFAULT_CONFIG, null, 2),
    );

    const startTime = Date.now();

    const compressedUri = await Image.compress(uri, {
      compressionMethod: "manual",
      ...DEFAULT_CONFIG,
      input: "uri",
      output: "jpg",
      returnableOutputType: "uri",
    });

    const endTime = Date.now();
    const compressionTime = (endTime - startTime) / 1000;

    logger(`Image compressed successfully in ${compressionTime.toFixed(2)}s`);

    return compressedUri;
  } catch (error) {
    logger("Error compressing image, using original:", error);
    // If compression fails, return original URI
    return uri;
  }
}
