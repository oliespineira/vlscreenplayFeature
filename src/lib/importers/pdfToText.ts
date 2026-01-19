/**
 * Extracts plain text from a PDF file
 */
export async function pdfToText(file: File): Promise<string> {
  // Dynamic import to avoid SSR issues
  const pdfjsLib = await import("pdfjs-dist");
  
  // Set worker source for Next.js compatibility
  const version = pdfjsLib.version;
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
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
