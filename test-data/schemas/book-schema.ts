import { z } from 'zod';

export const BookSchema = z.strictObject({
    isbn: z.string(),
    title: z.string(),
    subTitle: z.string(),
    author: z.string(),
    publish_date: z.string(),
    publisher: z.string(),
    pages: z.number(),
    description: z.string(),
    website: z.string(),
});

export const BooksListResponseSchema = z.strictObject({
    books: z.array(BookSchema),
});

export const UserBooksResponseSchema = z.strictObject({
    userId: z.string(),
    books: z.array(BookSchema),
});

export type Book = z.infer<typeof BookSchema>;
