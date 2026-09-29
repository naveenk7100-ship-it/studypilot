import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extracts raw text and page breakdown from supported document files.
 * Supports: PDF, DOCX, TXT, MD, CSV, JSON
 */
export async function parseDocumentFile(file) {
  const { originalname, mimetype, buffer } = file;
  const ext = originalname.split('.').pop()?.toLowerCase() || '';

  let rawText = '';
  let pages = [];
  let pageCount = 1;

  if (ext === 'pdf' || mimetype === 'application/pdf') {
    try {
      const parser = new PDFParse({ data: buffer });
      await parser.load();
      
      const info = await parser.getInfo().catch(() => ({}));
      const parsedText = await parser.getText().catch(() => '');
      
      rawText = parsedText || '';
      pageCount = info.pages || (rawText.split('\f').length) || 1;

      // Split pages by form feed if available, or chunk evenly
      const rawPages = rawText.split('\f').map(p => p.trim()).filter(Boolean);
      if (rawPages.length > 0) {
        pages = rawPages.map((text, idx) => ({ pageNumber: idx + 1, text }));
        pageCount = rawPages.length;
      } else {
        // Chunk into ~1500 char blocks as virtual pages
        const chunks = chunkText(rawText, 1500);
        pages = chunks.map((text, idx) => ({ pageNumber: idx + 1, text }));
        pageCount = pages.length || 1;
      }
    } catch (err) {
      throw new Error(`Failed to parse PDF file: ${err.message}`);
    }
  } else if (ext === 'docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value || '';
      const chunks = chunkText(rawText, 2000);
      pages = chunks.map((text, idx) => ({ pageNumber: idx + 1, text }));
      pageCount = Math.max(1, pages.length);
    } catch (err) {
      throw new Error(`Failed to parse DOCX file: ${err.message}`);
    }
  } else if (['txt', 'md', 'csv', 'json', 'rtf'].includes(ext) || mimetype.startsWith('text/')) {
    try {
      rawText = buffer.toString('utf-8');
      const chunks = chunkText(rawText, 2000);
      pages = chunks.map((text, idx) => ({ pageNumber: idx + 1, text }));
      pageCount = Math.max(1, pages.length);
    } catch (err) {
      throw new Error(`Failed to parse text document: ${err.message}`);
    }
  } else {
    throw new Error(`Unsupported file type (.${ext}). Please upload PDF, DOCX, or TXT.`);
  }

  if (!rawText.trim()) {
    throw new Error('Document appears to be empty or contains only non-extractable text/scans.');
  }

  // Generate structured study artifacts from the parsed text
  const artifacts = generateStudyArtifacts(rawText, pages, originalname);

  return {
    fileName: originalname,
    fileSize: buffer.length,
    fileType: ext.toUpperCase(),
    pageCount,
    textLength: rawText.length,
    rawText,
    pages,
    uploadedAt: new Date().toISOString(),
    status: 'processed',
    ...artifacts
  };
}

function chunkText(text, size) {
  const chunks = [];
  let index = 0;
  while (index < text.length) {
    chunks.push(text.slice(index, index + size));
    index += size;
  }
  return chunks.length ? chunks : [text];
}

/**
 * Derives comprehensive study materials directly from extracted document text
 */
export function generateStudyArtifacts(rawText, pages, fileName) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const paragraphs = rawText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 40);

  // 1. Executive Summary
  const summaryPoints = [];
  if (paragraphs.length > 0) {
    summaryPoints.push(paragraphs[0]);
    if (paragraphs.length > 2) {
      summaryPoints.push(paragraphs[Math.floor(paragraphs.length / 2)]);
    }
    if (paragraphs.length > 4) {
      summaryPoints.push(paragraphs[paragraphs.length - 1]);
    }
  } else {
    summaryPoints.push(rawText.slice(0, 400));
  }
  const summary = summaryPoints.join('\n\n');

  // 2. Important Concepts
  const conceptSet = new Set();
  const headings = lines.filter(l => (
    l.length < 80 &&
    (l.match(/^(chapter|section|\d+\.|\b[A-Z\s]{4,}\b)/i) || l.endsWith(':'))
  ));

  headings.slice(0, 10).forEach(h => {
    const clean = h.replace(/^(chapter|section|\d+\.|\s*[:-])/i, '').trim();
    if (clean.length > 3) conceptSet.add(clean);
  });

  if (conceptSet.size < 4) {
    // extract prominent noun phrases or capital words
    const matches = rawText.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g) || [];
    matches.slice(0, 8).forEach(m => {
      if (m.length > 5 && !m.includes('Page') && !m.includes('Chapter')) {
        conceptSet.add(m);
      }
    });
  }
  const concepts = Array.from(conceptSet).slice(0, 8);
  if (concepts.length === 0) concepts.push('Core Fundamentals', 'Theoretical Framework', 'Applied Methodologies');

  // 3. Definitions
  const definitions = [];
  paragraphs.forEach(p => {
    const defMatch = p.match(/([A-Z][A-Za-z0-9\s_-]{2,30})\s+(?:is defined as|refers to|means|is an?|denotes)\s+([^.]+?\.)/i);
    if (defMatch && definitions.length < 8) {
      definitions.push({
        term: defMatch[1].trim(),
        definition: defMatch[2].trim()
      });
    }
  });

  if (definitions.length < 3) {
    // Heuristic fallbacks from text
    lines.forEach(l => {
      if (l.includes(':') && l.split(':')[0].length < 35 && l.split(':')[1].length > 20 && definitions.length < 6) {
        const parts = l.split(':');
        definitions.push({
          term: parts[0].trim(),
          definition: parts.slice(1).join(':').trim()
        });
      }
    });
  }

  // 4. Key Formulas / Rules
  const formulas = [];
  const formulaPatterns = rawText.match(/([A-Za-z0-9_()]+(?:\s*[=+\-*/^]\s*[A-Za-z0-9_()]+){2,})/g) || [];
  formulaPatterns.slice(0, 6).forEach(f => {
    if (f.includes('=') && f.length > 5 && f.length < 60) {
      formulas.push(f.trim());
    }
  });

  // 5. Important Questions
  const questions = [];
  const questionMatches = rawText.match(/([^.?!;]+?\?)/g) || [];
  questionMatches.slice(0, 8).forEach(q => {
    const clean = q.trim();
    if (clean.length > 20 && clean.length < 150) {
      questions.push({
        question: clean,
        context: 'Directly extracted from document inquiry sections.'
      });
    }
  });

  if (questions.length < 3) {
    concepts.slice(0, 4).forEach(c => {
      questions.push({
        question: `How does ${c} contribute to the primary thesis or structure of this document?`,
        context: `Key conceptual query for ${c}.`
      });
    });
  }

  // 6. Flashcards
  const flashcards = [];
  definitions.forEach(d => {
    flashcards.push({
      id: 'fc-' + Math.random().toString(36).substring(2, 9),
      front: `What is ${d.term}?`,
      back: d.definition,
      source: fileName,
      topic: concepts[0] || 'General'
    });
  });

  concepts.slice(0, 4).forEach((c, idx) => {
    if (flashcards.length < 8) {
      flashcards.push({
        id: 'fc-' + Math.random().toString(36).substring(2, 9),
        front: `Explain the significance of "${c}" in this material.`,
        back: `Represents a foundational concept in the text that governs the related principles and analytical steps.`,
        source: fileName,
        topic: c
      });
    }
  });

  // 7. MCQs (Multiple Choice Questions)
  const mcqs = [];
  definitions.slice(0, 4).forEach((d, i) => {
    mcqs.push({
      id: 'mcq-' + (i + 1),
      question: `According to the document, which term is described as: "${d.definition.slice(0, 100)}..."?`,
      options: [
        d.term,
        `Alternative Factor ${i + 1}`,
        `Secondary Parameter ${i + 1}`,
        `Baseline Condition ${i + 1}`
      ].sort(() => Math.random() - 0.5),
      correctAnswer: d.term,
      explanation: `The document explicitly defines ${d.term} with these exact characteristics.`
    });
  });

  if (mcqs.length === 0) {
    mcqs.push({
      id: 'mcq-1',
      question: `What is the primary topic of this study material?`,
      options: [
        concepts[0] || fileName,
        'Unrelated Case Study',
        'Historical Anecdote',
        'Generic Summary'
      ],
      correctAnswer: concepts[0] || fileName,
      explanation: `Extracted directly from the core concept analysis of the text.`
    });
  }

  // 8. Chapters / Topic Breakdown
  const chapters = headings.slice(0, 6).map((h, i) => ({
    title: h,
    estimatedPage: Math.min(pages.length, i + 1),
    summary: `Covers key discussions pertaining to ${h}.`
  }));

  return {
    summary,
    concepts,
    definitions: definitions.slice(0, 8),
    formulas: formulas.slice(0, 6),
    questions: questions.slice(0, 6),
    flashcards: flashcards.slice(0, 10),
    mcqs: mcqs.slice(0, 5),
    chapters: chapters.length > 0 ? chapters : [{ title: 'Overview & Main Content', estimatedPage: 1, summary: 'Full document scope' }]
  };
}
