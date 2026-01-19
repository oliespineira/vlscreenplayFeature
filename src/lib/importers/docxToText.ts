import mammoth from "mammoth";

/**
 * Extracts plain text from a DOCX file
 */
export async function docxToText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
