export interface VerificationWindow {
  email: string;
  expiresAt: string;
}

export interface RegisteredSchool {
  schoolId: string;
  email: string;
  verification: VerificationWindow;
}

export interface VerifiedEmail {
  email: string;
  verified: true;
}

export interface VerificationSent {
  sent: true;
  expiresAt: string;
}
