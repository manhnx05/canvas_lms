import { NextRequest, NextResponse } from 'next/server';
import { getEnv, isProduction } from '@/src/lib/env';

export interface SecurityOptions {
  contentSecurityPolicy?: boolean;
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?: boolean;
  crossOriginResourcePolicy?: boolean;
  originAgentCluster?: boolean;
  referrerPolicy?: boolean;
  strictTransportSecurity?: boolean;
  xContentTypeOptions?: boolean;
  xDnsPrefetchControl?: boolean;
  xDownloadOptions?: boolean;
  xFrameOptions?: boolean;
  xPermittedCrossDomainPolicies?: boolean;
  xXssProtection?: boolean;
}

export function createSecurityHeaders(options: SecurityOptions = {}) {
  const {
    contentSecurityPolicy = true,
    crossOriginEmbedderPolicy = false,
    crossOriginOpenerPolicy = true,
    crossOriginResourcePolicy = true,
    originAgentCluster = true,
    referrerPolicy = true,
    strictTransportSecurity = isProduction(),
    xContentTypeOptions = true,
    xDnsPrefetchControl = true,
    xDownloadOptions = true,
    xFrameOptions = true,
    xPermittedCrossDomainPolicies = true,
    xXssProtection = true,
  } = options;

  return (req: NextRequest, response: NextResponse): NextResponse => {
    const headers = new Headers(response.headers);

    // Content Security Policy
    if (contentSecurityPolicy) {
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for React
        "style-src 'self' 'unsafe-inline'", // Allow inline styles
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.gemini.google.com https://*.neon.tech",
        "media-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
      ].join('; ');
      
      headers.set('Content-Security-Policy', csp);
    }

    // Cross-Origin Embedder Policy
    if (crossOriginEmbedderPolicy) {
      headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    }

    // Cross-Origin Opener Policy
    if (crossOriginOpenerPolicy) {
      headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    }

    // Cross-Origin Resource Policy
    if (crossOriginResourcePolicy) {
      headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    }

    // Origin Agent Cluster
    if (originAgentCluster) {
      headers.set('Origin-Agent-Cluster', '?1');
    }

    // Referrer Policy
    if (referrerPolicy) {
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // Strict Transport Security (HTTPS only)
    if (strictTransportSecurity && isProduction()) {
      headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // X-Content-Type-Options
    if (xContentTypeOptions) {
      headers.set('X-Content-Type-Options', 'nosniff');
    }

    // X-DNS-Prefetch-Control
    if (xDnsPrefetchControl) {
      headers.set('X-DNS-Prefetch-Control', 'off');
    }

    // X-Download-Options
    if (xDownloadOptions) {
      headers.set('X-Download-Options', 'noopen');
    }

    // X-Frame-Options
    if (xFrameOptions) {
      headers.set('X-Frame-Options', 'DENY');
    }

    // X-Permitted-Cross-Domain-Policies
    if (xPermittedCrossDomainPolicies) {
      headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    }

    // X-XSS-Protection
    if (xXssProtection) {
      headers.set('X-XSS-Protection', '1; mode=block');
    }

    // Remove potentially sensitive headers
    headers.delete('X-Powered-By');
    headers.delete('Server');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

// Default security middleware
export const securityHeaders = createSecurityHeaders();

// Input sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// SQL injection prevention (basic)
export function validateSqlInput(input: string): boolean {
  const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)|(--)|(\/\*)|(\*\/)|(\bOR\b.*=.*)|(\bAND\b.*=.*)/i;
  return !sqlInjectionPattern.test(input);
}

// XSS prevention
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}