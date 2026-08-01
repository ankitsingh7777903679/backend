export const apiResponse = {
  success: (data: unknown = null, message = "Success", pagination?: unknown) => ({
    success: true,
    message,
    data,
    ...(pagination ? { pagination } : {}),
  }),

  error: (message: string, errors?: unknown) => ({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  }),
};
