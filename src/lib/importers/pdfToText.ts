/**
 * Extracts plain text from a PDF file
 */
export async function pdfToText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // handle server and browser separately
  // browser: use the default build + remote worker
  // server: use the legacy build and disable workers
  const isServer = typeof window === "undefined";

  const pdfjsLib = isServer
    ? await import("pdfjs-dist/legacy/build/pdf.mjs")
    : await import("pdfjs-dist");

  if (!isServer) {
    const version = (pdfjsLib as any).version;
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
  }

  const loadingTask = (pdfjsLib as any).getDocument(
    isServer
      ? { data: new Uint8Array(arrayBuffer), disableWorker: true }
      : { data: arrayBuffer }
  );
  const pdf = await loadingTask.promise;

  const textParts: string[] = [];
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const pageText = textContent.items
      .map((item: any) => (item as { str: string }).str)
      .join(" ");
    
    textParts.push(pageText);
  }
  
  // Join pages with double newlines
  const extractedText = textParts.join("\n\n");
  
  return extractedText;
}
