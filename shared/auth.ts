import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password is too long"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
});

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  onboardingCompleted: z.boolean(),
  createdAt: z.string(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;

export const authResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string().optional(),
  user: authUserSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
