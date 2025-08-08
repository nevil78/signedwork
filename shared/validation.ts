import { z } from "zod";

// PAN Card Format: AAAAA9999A (5 letters + 4 digits + 1 letter)
export const panValidation = z
  .string()
  .min(10, "PAN must be 10 characters")
  .max(10, "PAN must be 10 characters")
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format. Format: AAAAA9999A");

// CIN Format: L/U + 5 digits + 2 letters + 4 digits + 3 letters + 6 digits + 1 digit
export const cinValidation = z
  .string()
  .min(21, "CIN must be 21 characters")
  .max(21, "CIN must be 21 characters")
  .regex(/^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}[0-9]$/, "Invalid CIN format");

// Validation functions
export const validatePAN = (pan: string): boolean => {
  try {
    panValidation.parse(pan.toUpperCase());
    return true;
  } catch {
    return false;
  }
};

export const validateCIN = (cin: string): boolean => {
  try {
    cinValidation.parse(cin.toUpperCase());
    return true;
  } catch {
    return false;
  }
};

// Format validation with detailed error messages
export const validateRegistrationNumber = (type: string, number: string) => {
  const upperNumber = number.toUpperCase();
  
  if (type === "PAN") {
    if (!upperNumber) return { isValid: false, error: "PAN number is required" };
    if (upperNumber.length !== 10) return { isValid: false, error: "PAN must be exactly 10 characters" };
    if (!validatePAN(upperNumber)) {
      return { 
        isValid: false, 
        error: "Invalid PAN format. Expected format: AAAAA9999A (e.g., ABCDE1234F)" 
      };
    }
    return { isValid: true, error: null };
  }
  
  if (type === "CIN") {
    if (!upperNumber) return { isValid: false, error: "CIN number is required" };
    if (upperNumber.length !== 21) return { isValid: false, error: "CIN must be exactly 21 characters" };
    if (!validateCIN(upperNumber)) {
      return { 
        isValid: false, 
        error: "Invalid CIN format. Expected format: L/U + 5 digits + 2 letters + 4 digits + 3 letters + 6 digits + 1 digit" 
      };
    }
    return { isValid: true, error: null };
  }
  
  return { isValid: false, error: "Registration type must be either PAN or CIN" };
};

// Company verification status types
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export const verificationStatusLabels: Record<VerificationStatus, string> = {
  unverified: "Not Verified",
  pending: "Verification Pending",
  verified: "Verified",
  rejected: "Verification Rejected"
};

export const verificationStatusColors: Record<VerificationStatus, string> = {
  unverified: "gray",
  pending: "yellow",
  verified: "green",
  rejected: "red"
};