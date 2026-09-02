import { z } from 'zod';
import { BookSchema } from './book-schema';

export const GenerateTokenResponseSchema = z.strictObject({
    token: z.string(),
    expires: z.string(),
    status: z.string(),
    result: z.string(),
});

// The real /Account/v1/Login response — no `status`/`result` (those belong to
// GenerateToken) and `token`/`expires` stay null until GenerateToken has been
// called at least once for this user.
export const LoginResponseSchema = z.strictObject({
    userId: z.string(),
    username: z.string(),
    password: z.string(),
    token: z.string().nullable(),
    expires: z.string().nullable(),
    created_date: z.string(),
    isActive: z.boolean(),
});

export const CreateUserResponseSchema = z.strictObject({
    userID: z.string(),
    username: z.string(),
    books: z.array(z.unknown()),
});

// GET /Account/v1/User/{userId} — the authenticated user with their current book collection.
export const UserWithBooksResponseSchema = z.strictObject({
    userId: z.string(),
    username: z.string(),
    books: z.array(BookSchema),
});

export type GenerateTokenResponse = z.infer<typeof GenerateTokenResponseSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type UserWithBooksResponse = z.infer<typeof UserWithBooksResponseSchema>;
