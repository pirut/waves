type ClerkApiErrorItem = {
  code?: string;
  longMessage?: string;
  message?: string;
};

type ClerkApiErrorShape = {
  errors?: ClerkApiErrorItem[];
};

export type ClerkErrorDetails = {
  code?: string;
  message: string;
};

const IDENTIFIER_EXISTS_CODES = new Set([
  "form_identifier_exists",
  "identifier_already_exists",
  "identifier_already_signed_up",
]);

const EMAIL_VERIFICATION_CODES = new Set([
  "email_address_not_verified",
  "form_identifier_not_verified",
  "identifier_not_verified",
]);

const ALREADY_SIGNED_IN_CODES = new Set([
  "already_signed_in",
  "session_already_exists",
  "session_exists",
]);

export function extractClerkErrorDetails(
  error: unknown,
  fallbackMessage: string,
): ClerkErrorDetails {
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray((error as ClerkApiErrorShape).errors) &&
    (error as ClerkApiErrorShape).errors &&
    (error as ClerkApiErrorShape).errors!.length > 0
  ) {
    const firstError = (error as ClerkApiErrorShape).errors![0];
    const message = firstError.longMessage ?? firstError.message ?? fallbackMessage;

    return {
      code: firstError.code,
      message,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || fallbackMessage,
    };
  }

  return {
    message: fallbackMessage,
  };
}

export function isIdentifierAlreadyInUseError(code?: string) {
  if (!code) {
    return false;
  }

  return IDENTIFIER_EXISTS_CODES.has(code);
}

export function isLikelyEmailVerificationIssue(details: ClerkErrorDetails) {
  if (details.code && EMAIL_VERIFICATION_CODES.has(details.code)) {
    return true;
  }

  const lowerMessage = details.message.toLowerCase();
  return lowerMessage.includes("verify") && lowerMessage.includes("email");
}

export function isAlreadySignedInError(details: ClerkErrorDetails) {
  if (details.code && ALREADY_SIGNED_IN_CODES.has(details.code)) {
    return true;
  }

  return details.message.toLowerCase().includes("already signed in");
}
