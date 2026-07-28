import { extractReceiptFields } from "./receiptFieldExtractor";

export async function createReceiptOcr(onProgress: (progress: number) => void) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(["eng", "vie"], 1, {
    logger: (message) => {
      if (message.status === "recognizing text") {
        onProgress(message.progress ?? 0);
      }
    },
  });

  return {
    async recognize(file: File) {
      const result = await worker.recognize(file);
      return extractReceiptFields(result.data.text, result.data.confidence);
    },
    terminate: () => worker.terminate(),
  };
}

export type ReceiptOcr = Awaited<ReturnType<typeof createReceiptOcr>>;
