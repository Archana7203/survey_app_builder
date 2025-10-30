import dns from 'dns/promises';

/**
 * Validates email format and checks if domain has MX records
 * @param email - Email address to validate
 * @returns Promise<boolean> - true if email is valid and domain has MX records
 */
export const validateEmailWithDNS = async (email: string): Promise<boolean> => {
  try {
    // Basic email format validation
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Extract domain from email
    const domain = email.split('@')[1];
    if (!domain) {
      return false;
    }

    // Check for MX records
    try {
      const mxRecords = await dns.resolveMx(domain);
      // Valid if at least one MX record exists
      return mxRecords.length > 0;
    } catch (dnsError: any) {
      // If MX lookup fails, try A record as fallback (some domains use A records for email)
      try {
        await dns.resolve4(domain);
        return true; // Domain exists even without MX records
      } catch (aRecordError) {
        return false; // Domain doesn't exist
      }
    }
  } catch (error) {
    return false;
  }
};

/**
 * Validates email and returns detailed result
 */
export const validateEmailWithDNSDetailed = async (
  email: string
): Promise<{ valid: boolean; hasMX: boolean; domainExists: boolean; error?: string }> => {
  try {
    // Basic email format validation
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        hasMX: false,
        domainExists: false,
        error: 'Invalid email format',
      };
    }

    // Extract domain from email
    const domain = email.split('@')[1];
    if (!domain) {
      return {
        valid: false,
        hasMX: false,
        domainExists: false,
        error: 'Invalid email domain',
      };
    }

    let hasMX = false;
    let domainExists = false;

    // Check for MX records
    try {
      const mxRecords = await dns.resolveMx(domain);
      hasMX = mxRecords.length > 0;
      domainExists = true;
    } catch (mxError) {
      // If MX lookup fails, try A record as fallback
      try {
        await dns.resolve4(domain);
        domainExists = true;
        hasMX = false; // No MX but domain exists
      } catch (aRecordError) {
        domainExists = false;
        return {
          valid: false,
          hasMX: false,
          domainExists: false,
          error: 'Domain does not exist',
        };
      }
    }

    return {
      valid: hasMX || domainExists, // Valid if has MX or domain exists
      hasMX,
      domainExists,
    };
  } catch (error: any) {
    return {
      valid: false,
      hasMX: false,
      domainExists: false,
      error: error.message || 'Validation failed',
    };
  }
};
