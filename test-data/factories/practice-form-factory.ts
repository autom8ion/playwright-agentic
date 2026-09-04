import { faker } from '@faker-js/faker';
import type { PracticeFormData } from '../../pages/PracticeFormPage';

/**
 * The State→City react-selects on the Practice Form are chained (the city list
 * depends on which state was picked), so the pair is generated together rather
 * than independently. Confirmed live against demoqa's real dropdown contents —
 * "Merrut" (Uttar Pradesh) and "Jaiselmer" (Rajasthan) are the app's own
 * spellings, not typos introduced here.
 */
const STATE_CITY_MAP: Record<string, string[]> = {
    NCR: ['Delhi', 'Gurgaon', 'Noida'],
    'Uttar Pradesh': ['Agra', 'Lucknow', 'Merrut'],
    Haryana: ['Karnal', 'Panipat'],
    Rajasthan: ['Jaipur', 'Jaiselmer'],
};

const GENDERS = ['Male', 'Female', 'Other'] as const;
const HOBBIES = ['Sports', 'Reading', 'Music'] as const;
const SUBJECTS = ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'Accounting', 'Economics'];

export function generatePracticeFormData(): PracticeFormData {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const [state, cities] = faker.helpers.arrayElement(Object.entries(STATE_CITY_MAP));
    const city = faker.helpers.arrayElement(cities);

    return {
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }),
        gender: faker.helpers.arrayElement(GENDERS),
        mobileNumber: faker.string.numeric(10),
        subject: faker.helpers.arrayElement(SUBJECTS),
        hobby: faker.helpers.arrayElement(HOBBIES),
        address: faker.location.streetAddress(),
        state,
        city,
        picture: {
            name: faker.system.commonFileName('png'),
            mimeType: 'image/png',
            buffer: Buffer.from(faker.string.alphanumeric(64)),
        },
    };
}
