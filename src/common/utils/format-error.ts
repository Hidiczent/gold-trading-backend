export function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.trim().length > 0) {
      return error.message;
    }

    const withCode = error as Error & { code?: string; errors?: Error[] };
    if (withCode.code) {
      const nested = withCode.errors
        ?.map((item) => item.message)
        .filter(Boolean)
        .join('; ');
      return nested ? `${withCode.code}: ${nested}` : withCode.code;
    }

    return error.name || 'Unknown error';
  }

  return String(error);
}
