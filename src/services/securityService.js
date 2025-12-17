// Security Service for Alpha Edge Platform
// Implements comprehensive security measures for client-side application

class SecurityService {
  constructor() {
    this.auditLog = [];
    this.rateLimitStore = new Map();
    this.encryptionKey = this.generateEncryptionKey();
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedFileTypes = ['text/csv', 'text/html', 'text/plain', 'application/csv'];
    this.suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /document\./i,
      /window\./i,
      /alert\(/i,
      /confirm\(/i,
      /prompt\(/i
    ];
  }

  // Generate encryption key for sensitive data
  generateEncryptionKey() {
    // In production, this should use a secure key derivation
    const key = localStorage.getItem('alpha_edge_encryption_key');
    if (key) return key;

    const newKey = this.generateRandomKey();
    localStorage.setItem('alpha_edge_encryption_key', newKey);
    return newKey;
  }

  generateRandomKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array));
  }

  // File Security - Comprehensive malware scanning and validation
  async validateFile(file) {
    this.logSecurityEvent('file_validation_started', { fileName: file.name, fileSize: file.size });

    try {
      // Basic file validation
      if (!file) {
        throw new Error('No file provided');
      }

      // File size check
      if (file.size > this.maxFileSize) {
        throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`);
      }

      // File type validation
      if (!this.allowedFileTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
        throw new Error(`File type not allowed. Allowed types: ${this.allowedFileTypes.join(', ')}`);
      }

      // Read file content for security analysis
      const content = await this.readFileContent(file);

      // Content security analysis
      await this.analyzeFileContent(content, file.name);

      // Malware signature check (basic implementation)
      const malwareCheck = await this.basicMalwareScan(content);
      if (!malwareCheck.safe) {
        throw new Error('File contains potentially malicious content');
      }

      this.logSecurityEvent('file_validation_passed', { fileName: file.name });
      return { valid: true, content };

    } catch (error) {
      this.logSecurityEvent('file_validation_failed', {
        fileName: file.name,
        error: error.message
      });
      throw error;
    }
  }

  async readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  async analyzeFileContent(content, fileName) {
    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        throw new Error(`File contains suspicious content pattern: ${pattern}`);
      }
    }

    // Check for embedded scripts in HTML files
    if (fileName.toLowerCase().endsWith('.html')) {
      const scriptTags = content.match(/<script[^>]*>[\s\S]*?<\/script>/gi);
      if (scriptTags && scriptTags.length > 0) {
        throw new Error('HTML file contains script tags which are not allowed');
      }
    }

    // Validate CSV structure if it's a CSV file
    if (fileName.toLowerCase().endsWith('.csv') || content.includes(',')) {
      this.validateCSVStructure(content);
    }
  }

  validateCSVStructure(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file appears to be empty');
    }

    // Check for consistent column count
    const firstLineColumns = lines[0].split(',').length;
    for (let i = 1; i < Math.min(lines.length, 10); i++) {
      const columns = lines[i].split(',').length;
      if (Math.abs(columns - firstLineColumns) > 2) { // Allow some flexibility
        throw new Error('CSV file has inconsistent column structure');
      }
    }
  }

  async basicMalwareScan(content) {
    // Basic malware detection patterns
    const malwarePatterns = [
      /virus/i,
      /trojan/i,
      /malware/i,
      /exploit/i,
      /shell/i,
      /exec/i,
      /system\(/i,
      /cmd/i,
      /powershell/i,
      /base64/i,
      /eval/i,
      /function.*\(\)/i
    ];

    const suspiciousScore = malwarePatterns.reduce((score, pattern) => {
      return score + (pattern.test(content) ? 1 : 0);
    }, 0);

    return {
      safe: suspiciousScore < 3, // Allow some false positives
      score: suspiciousScore,
      patterns: malwarePatterns.filter(p => p.test(content))
    };
  }

  // Input Validation and Sanitization
  sanitizeInput(input, type = 'text') {
    if (typeof input !== 'string') return input;

    let sanitized = input;

    switch (type) {
      case 'text':
        // Remove HTML tags and scripts
        sanitized = sanitized.replace(/<[^>]*>/g, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
        break;

      case 'number':
        // Only allow numeric characters and decimal point
        sanitized = sanitized.replace(/[^0-9.-]/g, '');
        break;

      case 'email':
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitized)) {
          throw new Error('Invalid email format');
        }
        break;

      case 'filename':
        // Remove path separators and dangerous characters
        sanitized = sanitized.replace(/[\/\\:*?"<>|]/g, '');
        break;
    }

    return sanitized.trim();
  }

  validateTradeData(trade) {
    const requiredFields = ['symbol', 'direction', 'volume', 'net_profit'];
    const errors = [];

    for (const field of requiredFields) {
      if (!trade[field] && trade[field] !== 0) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate direction
    if (trade.direction && !['Buy', 'Sell'].includes(trade.direction)) {
      errors.push('Invalid direction: must be Buy or Sell');
    }

    // Validate numeric fields
    const numericFields = ['volume', 'net_profit', 'balance'];
    for (const field of numericFields) {
      if (trade[field] && isNaN(parseFloat(trade[field]))) {
        errors.push(`Invalid numeric value for ${field}`);
      }
    }

    // Validate dates
    if (trade.close_time) {
      const date = new Date(trade.close_time);
      if (isNaN(date.getTime())) {
        errors.push('Invalid date format for close_time');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Data Encryption for sensitive information
  encrypt(data) {
    try {
      const encrypted = btoa(JSON.stringify(data));
      // Simple XOR encryption with key
      let result = '';
      for (let i = 0; i < encrypted.length; i++) {
        result += String.fromCharCode(encrypted.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
      }
      return btoa(result);
    } catch (error) {
      console.error('Encryption failed:', error);
      return data; // Fallback to unencrypted
    }
  }

  decrypt(encryptedData) {
    try {
      // If data is not a string or empty, return as-is
      if (!encryptedData || typeof encryptedData !== 'string') {
        return encryptedData;
      }
      
      // Check if data is already valid JSON (not encrypted)
      try {
        return JSON.parse(encryptedData);
      } catch {
        // Not JSON, proceed with decryption
      }
      
      // Try to decode base64
      const decoded = atob(encryptedData);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
      }
      return JSON.parse(atob(result));
    } catch (error) {
      console.warn('Decryption failed, returning raw data:', error.message);
      // Return null or empty object instead of corrupted data
      try {
        // Try to parse as plain JSON as last resort
        return JSON.parse(encryptedData);
      } catch {
        return null; // Return null to indicate corrupted data
      }
    }
  }

  // Rate Limiting
  checkRateLimit(action, userId, limit = 10, windowMs = 60000) {
    const key = `${action}_${userId}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.rateLimitStore.has(key)) {
      this.rateLimitStore.set(key, []);
    }

    const timestamps = this.rateLimitStore.get(key);
    // Remove old timestamps
    const validTimestamps = timestamps.filter(ts => ts > windowStart);
    validTimestamps.push(now);

    this.rateLimitStore.set(key, validTimestamps);

    if (validTimestamps.length > limit) {
      this.logSecurityEvent('rate_limit_exceeded', { action, userId, count: validTimestamps.length });
      return false;
    }

    return true;
  }

  // Audit Logging
  logSecurityEvent(event, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.auditLog.push(logEntry);

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }

    // In production, send to server
    console.log('Security Event:', logEntry);
  }

  getAuditLog() {
    return this.auditLog;
  }

  // Content Security Policy helpers
  generateCSP() {
    return {
      'default-src': "'self'",
      'script-src': "'self'",
      'style-src': "'self' 'unsafe-inline'",
      'img-src': "'self' data: https:",
      'font-src': "'self'",
      'connect-src': "'self'",
      'object-src': "'none'",
      'base-uri': "'self'",
      'form-action': "'self'"
    };
  }

  // Session Security
  generateSecureToken() {
    return this.generateRandomKey();
  }

  validateSession() {
    // Basic session validation
    const sessionStart = localStorage.getItem('session_start');
    if (!sessionStart) return false;

    const sessionAge = Date.now() - parseInt(sessionStart);
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

    if (sessionAge > maxSessionAge) {
      this.logSecurityEvent('session_expired');
      return false;
    }

    return true;
  }

  startSession() {
    localStorage.setItem('session_start', Date.now().toString());
    this.logSecurityEvent('session_started');
  }
}

// Export singleton instance
export const securityService = new SecurityService();
