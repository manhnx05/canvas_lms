import { NextRequest } from 'next/server';

// Dynamic import DOMPurify only on client side to avoid jsdom issues during build
let DOMPurify: any = null;

// Initialize DOMPurify only when needed
async function getDOMPurify() {
  if (typeof window !== 'undefined') {
    // Client side - use regular DOMPurify
    if (!DOMPurify) {
      const { default: purify } = await import('dompurify');
      DOMPurify = purify;
    }
  } else {
    // Server side - use isomorphic version with dynamic import
    if (!DOMPurify) {
      try {
        const { default: purify } = await import('isomorphic-dompurify');
        DOMPurify = purify;
      } catch {
        // Fallback if isomorphic-dompurify fails
        console.warn('DOMPurify not available, using basic sanitization');
        DOMPurify = {
          sanitize: (html: string) => html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        };
      }
    }
  }
  return DOMPurify;
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export async function sanitizeHtml(html: string): Promise<string> {
  const purify = await getDOMPurify();
  return purify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['class'],
    FORBID_SCRIPT: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit']
  });
}

/**
 * Sanitize text content by removing potentially dangerous characters
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim();
}

/**
 * Sanitize object recursively
 */
export async function sanitizeObject(obj: any): Promise<any> {
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }
  
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(sanitizeObject));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key names too
      const cleanKey = sanitizeText(key);
      sanitized[cleanKey] = await sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Middleware to sanitize request body
 */
export async function sanitizeRequestBody(req: NextRequest): Promise<any> {
  try {
    const body = await req.json();
    return await sanitizeObject(body);
  } catch {
    // If JSON parsing fails, return null
    return null;
  }
}

/**
 * Validate and sanitize file uploads
 */
export function validateFileUpload(file: {
  name: string;
  type: string;
  size: number;
}): { isValid: boolean; error?: string } {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Loại file không được hỗ trợ' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File không được lớn hơn 10MB' };
  }

  // Check for potentially dangerous file names
  const dangerousPatterns = [
    /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.com$/i, /\.pif$/i, /\.scr$/i,
    /\.vbs$/i, /\.js$/i, /\.jar$/i, /\.php$/i, /\.asp$/i, /\.jsp$/i
  ];

  if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
    return { isValid: false, error: 'Tên file không được phép' };
  }

  return { isValid: true };
}

/**
 * Generate secure filename
 */
export function generateSecureFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  
  // Remove special characters from filename
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50); // Limit length
  
  return `${timestamp}_${random}_${safeName}`;
}