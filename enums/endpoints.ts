export const Endpoints = {
    account: {
        login: '/Account/v1/Login',
        generateToken: '/Account/v1/GenerateToken',
        authorized: '/Account/v1/Authorized',
        createUser: '/Account/v1/User',
        user: (userId: string) => `/Account/v1/User/${userId}`,
    },
    bookStore: {
        books: '/BookStore/v1/Books',
        book: '/BookStore/v1/Book',
    },
} as const;

export const Routes = {
    login: '/login',
    profile: '/profile',
    books: '/books',
    bookDetail: (isbn: string) => `/books?book=${isbn}`,
    webTables: '/webtables',
    practiceForm: '/automation-practice-form',
    alerts: '/alerts',
    accordion: '/accordian',
} as const;
