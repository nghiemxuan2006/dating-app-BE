import mongoose from 'mongoose';
import { Account, UserInfo } from '../models/user';
import connectMongoDB from '../config/mongodb';
import logger from '../utils/wiston-log';

// Simple faker-like functions to generate realistic data
const generateRandomString = (length: number): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const generateUsername = (): string => {
    const adjectives = ['cool', 'awesome', 'funny', 'smart', 'cute', 'happy', 'brave', 'kind', 'sweet', 'clever'];
    const nouns = ['cat', 'dog', 'bird', 'star', 'moon', 'sun', 'flower', 'tree', 'ocean', 'mountain'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    return `${adjective}_${noun}_${number}`;
};

const generateEmail = (username: string): string => {
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'example.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${username}@${domain}`;
};

const generateBirthdate = (): Date => {
    const minAge = 18;
    const maxAge = 65;
    const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
    const now = new Date();
    const birthYear = now.getFullYear() - age;
    const birthMonth = Math.floor(Math.random() * 12);
    const birthDay = Math.floor(Math.random() * 28) + 1; // Safe day range
    return new Date(birthYear, birthMonth, birthDay);
};

const generateInterests = (): string[] => {
    const allInterests = [
        'traveling', 'photography', 'cooking', 'music', 'movies', 'reading', 'fitness', 'yoga',
        'hiking', 'dancing', 'art', 'gaming', 'sports', 'coffee', 'wine', 'pets', 'nature',
        'technology', 'fashion', 'food', 'adventure', 'beach', 'mountains', 'concerts',
        'museums', 'theater', 'comedy', 'meditation', 'languages', 'learning'
    ];

    const numInterests = Math.floor(Math.random() * 8) + 3; // 3-10 interests
    const shuffled = allInterests.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numInterests);
};

const generatePhotos = (): string[] => {
    const numPhotos = Math.floor(Math.random() * 6) + 1; // 1-6 photos
    const photos = [];
    for (let i = 0; i < numPhotos; i++) {
        photos.push(`https://picsum.photos/400/600?random=${Math.floor(Math.random() * 10000)}`);
    }
    return photos;
};

const generateLocation = (): {
    location: { type: 'Point'; coordinates: [number, number] };
    location_string: string;
} => {
    // Generate coordinates for major cities around the world
    // Each district or street will have a base lat/lng offset from the city center for more realistic data.
    const cities = [
        {
            name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060,
            districts: [
                { name: 'Manhattan', lat: 40.7831, lng: -73.9712 },
                { name: 'Brooklyn', lat: 40.6782, lng: -73.9442 },
                { name: 'Queens', lat: 40.7282, lng: -73.7949 },
                { name: 'Bronx', lat: 40.8448, lng: -73.8648 },
                { name: 'Staten Island', lat: 40.5795, lng: -74.1502 }
            ]
        },
        {
            name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278,
            districts: [
                { name: 'Camden', lat: 51.5416, lng: -0.1432 },
                { name: 'Greenwich', lat: 51.4821, lng: 0.0052 },
                { name: 'Hackney', lat: 51.5450, lng: -0.0550 },
                { name: 'Chelsea', lat: 51.4875, lng: -0.1687 },
                { name: 'Westminster', lat: 51.4975, lng: -0.1357 }
            ]
        },
        {
            name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522,
            districts: [
                { name: '1st arrondissement', lat: 48.8625, lng: 2.3361 },
                { name: '2nd arrondissement', lat: 48.8680, lng: 2.3449 },
                { name: '3rd arrondissement', lat: 48.8638, lng: 2.3615 },
                { name: '4th arrondissement', lat: 48.8546, lng: 2.3572 },
                { name: '5th arrondissement', lat: 48.8448, lng: 2.3553 }
            ]
        },
        {
            name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503,
            districts: [
                { name: 'Shibuya', lat: 35.6618, lng: 139.7041 },
                { name: 'Shinjuku', lat: 35.6938, lng: 139.7034 },
                { name: 'Chiyoda', lat: 35.6930, lng: 139.7530 },
                { name: 'Minato', lat: 35.6581, lng: 139.7516 },
                { name: 'Taito', lat: 35.7121, lng: 139.7800 }
            ]
        },
        {
            name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093,
            districts: [
                { name: 'CBD', lat: -33.8688, lng: 151.2093 },
                { name: 'Surry Hills', lat: -33.8840, lng: 151.2152 },
                { name: 'Bondi', lat: -33.8915, lng: 151.2767 },
                { name: 'Newtown', lat: -33.8981, lng: 151.1747 },
                { name: 'Parramatta', lat: -33.8150, lng: 151.0011 }
            ]
        },
        {
            name: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437,
            districts: [
                { name: 'Hollywood', lat: 34.0980, lng: -118.3295 },
                { name: 'Downtown', lat: 34.0407, lng: -118.2468 },
                { name: 'Venice', lat: 33.9850, lng: -118.4695 },
                { name: 'Beverly Hills', lat: 34.0736, lng: -118.4004 },
                { name: 'Santa Monica', lat: 34.0195, lng: -118.4912 }
            ]
        },
        {
            name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050,
            districts: [
                { name: 'Mitte', lat: 52.5206, lng: 13.4094 },
                { name: 'Kreuzberg', lat: 52.4996, lng: 13.4030 },
                { name: 'Prenzlauer Berg', lat: 52.5380, lng: 13.4244 },
                { name: 'Charlottenburg', lat: 52.5163, lng: 13.3041 },
                { name: 'Friedrichshain', lat: 52.5156, lng: 13.4546 }
            ]
        },
        {
            name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832,
            districts: [
                { name: 'Downtown', lat: 43.6540, lng: -79.3807 },
                { name: 'Scarborough', lat: 43.7731, lng: -79.2578 },
                { name: 'North York', lat: 43.7615, lng: -79.4111 },
                { name: 'Etobicoke', lat: 43.6205, lng: -79.5132 },
                { name: 'York', lat: 43.6912, lng: -79.4535 }
            ]
        },
        {
            name: 'Barcelona', country: 'Spain', lat: 41.3851, lng: 2.1734,
            districts: [
                { name: 'Eixample', lat: 41.3934, lng: 2.1614 },
                { name: 'Gràcia', lat: 41.4065, lng: 2.1537 },
                { name: 'Sants-Montjuïc', lat: 41.3722, lng: 2.1540 },
                { name: 'Ciutat Vella', lat: 41.3809, lng: 2.1737 },
                { name: 'Les Corts', lat: 41.3842, lng: 2.1319 }
            ]
        },
        {
            name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041,
            districts: [
                { name: 'Centrum', lat: 52.3728, lng: 4.8936 },
                { name: 'Noord', lat: 52.3978, lng: 4.9202 },
                { name: 'Oost', lat: 52.3626, lng: 4.9407 },
                { name: 'Zuid', lat: 52.3382, lng: 4.8720 },
                { name: 'West', lat: 52.3792, lng: 4.8572 }
            ]
        },
        // Vietnam cities
        {
            name: 'Hanoi', country: 'Vietnam', lat: 21.0285, lng: 105.8542,
            districts: [
                { name: 'Ba Dinh', lat: 21.0346, lng: 105.8142 },
                { name: 'Hoan Kiem', lat: 21.0285, lng: 105.8542 },
                { name: 'Dong Da', lat: 21.0181, lng: 105.8298 },
                { name: 'Cau Giay', lat: 21.0358, lng: 105.8007 },
                { name: 'Thanh Xuan', lat: 20.9937, lng: 105.8106 }
            ]
        },
        {
            name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.7769, lng: 106.7009,
            districts: [
                { name: 'District 1', lat: 10.7769, lng: 106.7009 },
                { name: 'District 3', lat: 10.7842, lng: 106.6848 },
                { name: 'District 5', lat: 10.7547, lng: 106.6637 },
                { name: 'Phu Nhuan', lat: 10.7992, lng: 106.6800 },
                { name: 'Binh Thanh', lat: 10.8057, lng: 106.7138 }
            ]
        },
        {
            name: 'Da Nang', country: 'Vietnam', lat: 16.0471, lng: 108.2068,
            districts: [
                { name: 'Hai Chau', lat: 16.0678, lng: 108.2208 },
                { name: 'Thanh Khe', lat: 16.0674, lng: 108.1836 },
                { name: 'Son Tra', lat: 16.1097, lng: 108.2361 },
                { name: 'Ngu Hanh Son', lat: 16.0062, lng: 108.2522 },
                { name: 'Lien Chieu', lat: 16.0721, lng: 108.1497 }
            ]
        },
        {
            name: 'Hai Phong', country: 'Vietnam', lat: 20.8449, lng: 106.6881,
            districts: [
                { name: 'Hong Bang', lat: 20.8600, lng: 106.6822 },
                { name: 'Le Chan', lat: 20.8449, lng: 106.6881 },
                { name: 'Ngo Quyen', lat: 20.8607, lng: 106.6934 },
                { name: 'Kien An', lat: 20.8302, lng: 106.6297 },
                { name: 'Hai An', lat: 20.8447, lng: 106.7262 }
            ]
        },
        {
            name: 'Can Tho', country: 'Vietnam', lat: 10.0452, lng: 105.7469,
            districts: [
                { name: 'Ninh Kieu', lat: 10.0342, lng: 105.7831 },
                { name: 'Binh Thuy', lat: 10.0707, lng: 105.7446 },
                { name: 'Cai Rang', lat: 10.0122, lng: 105.7700 },
                { name: 'O Mon', lat: 10.1167, lng: 105.6139 },
                { name: 'Thot Not', lat: 10.2090, lng: 105.5337 }
            ]
        },
        {
            name: 'Nha Trang', country: 'Vietnam', lat: 12.2388, lng: 109.1967,
            districts: [
                { name: 'Loc Tho', lat: 12.2388, lng: 109.1967 },
                { name: 'Vinh Hoa', lat: 12.2717, lng: 109.2022 },
                { name: 'Vinh Phuoc', lat: 12.2655, lng: 109.1926 },
                { name: 'Phuoc Hai', lat: 12.2214, lng: 109.1901 },
                { name: 'Vinh Truong', lat: 12.2066, lng: 109.2172 }
            ]
        },
        {
            name: 'Hue', country: 'Vietnam', lat: 16.4637, lng: 107.5909,
            districts: [
                { name: 'Phu Hoi', lat: 16.4647, lng: 107.5952 },
                { name: 'Phu Nhuan', lat: 16.4637, lng: 107.5909 },
                { name: 'Vy Da', lat: 16.4700, lng: 107.6011 },
                { name: 'Thuan Hoa', lat: 16.4712, lng: 107.5797 },
                { name: 'An Cuu', lat: 16.4542, lng: 107.6047 }
            ]
        },
        {
            name: 'Bien Hoa', country: 'Vietnam', lat: 10.9634, lng: 106.8227,
            districts: [
                { name: 'Tan Bien', lat: 10.9634, lng: 106.8227 },
                { name: 'Tan Hiep', lat: 10.9700, lng: 106.8300 },
                { name: 'Hoa An', lat: 10.9800, lng: 106.8200 },
                { name: 'Buu Long', lat: 10.9900, lng: 106.8100 },
                { name: 'Trang Dai', lat: 10.9500, lng: 106.8400 }
            ]
        },
        {
            name: 'Vung Tau', country: 'Vietnam', lat: 10.4114, lng: 107.1362,
            districts: [
                { name: 'Ward 1', lat: 10.4114, lng: 107.1362 },
                { name: 'Ward 2', lat: 10.4200, lng: 107.1400 },
                { name: 'Ward 3', lat: 10.4300, lng: 107.1500 },
                { name: 'Thang Tam', lat: 10.4200, lng: 107.1600 },
                { name: 'Nguyen An Ninh', lat: 10.4000, lng: 107.1300 }
            ]
        },
        {
            name: 'Buon Ma Thuot', country: 'Vietnam', lat: 12.6667, lng: 108.0333,
            districts: [
                { name: 'Tan Loi', lat: 12.6667, lng: 108.0333 },
                { name: 'Tan Lap', lat: 12.6700, lng: 108.0400 },
                { name: 'Tan Hoa', lat: 12.6800, lng: 108.0500 },
                { name: 'Tan An', lat: 12.6900, lng: 108.0600 },
                { name: 'Ea Tam', lat: 12.7000, lng: 108.0700 }
            ]
        }
    ];

    const streets = [
        'Nguyen Trai', 'Le Loi', 'Tran Hung Dao', 'Pham Ngu Lao', 'Nguyen Hue', 'Ba Trieu', 'Ly Thuong Kiet', 'Dien Bien Phu', 'Vo Thi Sau', 'Hai Ba Trung',
        'Pasteur', 'Le Duan', 'Tran Phu', 'Hoang Dieu', 'Ton Duc Thang', 'Nguyen Van Cu', 'Le Lai', 'Pham Van Dong', 'Nguyen Dinh Chieu', 'Tran Quoc Toan'
    ];

    const city = cities[Math.floor(Math.random() * cities.length)];
    const districtIdx = Math.floor(Math.random() * city.districts.length);
    const district = city.districts[districtIdx];
    const streetIdx = Math.floor(Math.random() * streets.length);
    const street = streets[streetIdx];
    const streetNumber = Math.floor(Math.random() * 200) + 1;

    // Use the district's lat/lng as the base
    const baseLat = district.lat;
    const baseLng = district.lng;

    // Streets: small offset within the district
    const streetAngle = (2 * Math.PI * streetIdx) / streets.length;
    const streetRadius = 0.001 + Math.random() * 0.001; // 100-200m from district center
    const streetLat = baseLat + Math.cos(streetAngle) * streetRadius;
    const streetLng = baseLng + Math.sin(streetAngle) * streetRadius;

    // Add a tiny random offset for the house number
    const lat = +(streetLat + (Math.random() - 0.5) * 0.0002).toFixed(6);
    const lng = +(streetLng + (Math.random() - 0.5) * 0.0002).toFixed(6);

    return {
        location: {
            type: 'Point',
            coordinates: [lng, lat]
        },
        location_string: `${streetNumber} ${street}, ${district.name}, ${city.name}, ${city.country}`
    };
};

const generateGender = (): 'male' | 'female' | 'other' => {
    const genders: ('male' | 'female' | 'other')[] = ['male', 'female', 'other'];
    const weights = [0.45, 0.45, 0.1]; // 45% male, 45% female, 10% other
    const random = Math.random();
    let sum = 0;

    for (let i = 0; i < weights.length; i++) {
        sum += weights[i];
        if (random <= sum) {
            return genders[i];
        }
    }
    return 'other';
};

const generateAgeRange = (birthdate: Date): { min: number; max: number } => {
    const currentAge = new Date().getFullYear() - birthdate.getFullYear();
    const minAge = Math.max(18, currentAge - 10);
    const maxAge = Math.min(65, currentAge + 15);
    return { min: minAge, max: maxAge };
};

const generatePassword = (): string => {
    // In a real app, this would be hashed
    return 'password123'; // Simple password for testing
};

async function generateFakeData(numUsers: number = 50) {
    try {
        logger.info(`Starting to generate ${numUsers} fake users...`);

        // Clear existing data
        await Account.deleteMany({});
        await UserInfo.deleteMany({});
        logger.info('Cleared existing data');

        const accounts = [];
        const userInfos = [];

        for (let i = 0; i < numUsers; i++) {
            const username = generateUsername();
            const email = generateEmail(username);
            const password = generatePassword();
            const birthdate = generateBirthdate();
            const gender = generateGender();
            const locationData = generateLocation();

            // Create account
            const account = new Account({
                username,
                email,
                password
            });

            accounts.push(account);

            // Create user info
            const userInfo = new UserInfo({
                account: account._id,
                gender,
                gender_preference: generateGender(),
                birthdate,
                interests: generateInterests(),
                photos: generatePhotos(),
                age_range: generateAgeRange(birthdate),
                location: locationData.location,
                location_string: locationData.location_string
            });

            userInfos.push(userInfo);

            if ((i + 1) % 10 === 0) {
                logger.info(`Generated ${i + 1}/${numUsers} users`);
            }
        }

        // Save all accounts
        await Account.insertMany(accounts);
        logger.info('Saved all accounts');

        // Save all user infos
        await UserInfo.insertMany(userInfos);
        logger.info('Saved all user infos');

        logger.info(`Successfully generated ${numUsers} fake users!`);

        // Log some statistics
        const maleCount = userInfos.filter(u => u.gender === 'male').length;
        const femaleCount = userInfos.filter(u => u.gender === 'female').length;
        const otherCount = userInfos.filter(u => u.gender === 'other').length;

        logger.info(`Gender distribution: ${maleCount} male, ${femaleCount} female, ${otherCount} other`);

    } catch (error) {
        logger.error('Error generating fake data:', error);
        throw error;
    }
}

async function main() {
    try {
        await connectMongoDB();

        const numUsers = process.argv[2] ? parseInt(process.argv[2]) : 50;

        if (isNaN(numUsers) || numUsers <= 0) {
            logger.error('Please provide a valid number of users to generate');
            process.exit(1);
        }

        await generateFakeData(numUsers);

        logger.info('Fake data generation completed successfully!');
        process.exit(0);

    } catch (error) {
        logger.error('Error in main function:', error);
        process.exit(1);
    }
}

// Run the script if called directly
if (require.main === module) {
    main();
}

export { generateFakeData };
