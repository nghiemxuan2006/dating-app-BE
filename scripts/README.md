# Fake Data Generation Scripts

This directory contains scripts to generate fake data for the dating app backend.

## Scripts

### 1. Database Data Generation (`generate-fake-data.ts`)

This script connects to your MongoDB database and directly inserts fake data.

**Usage:**
```bash
# Generate 50 users (default)
npm run generate-data

# Generate a specific number of users
npm run generate-data 100
```

**What it does:**
- Connects to your MongoDB database
- Clears existing Account and UserInfo collections
- Generates fake accounts with realistic usernames, emails, and passwords
- Generates corresponding user info with:
  - Random gender and gender preferences
  - Realistic birthdates (ages 18-65)
  - Random interests from a curated list
  - Random photos using placeholder images
  - Geographic locations around major cities
  - Age range preferences based on user's age

### 2. JSON Data Generation (`generate-json-data.ts`)

This script generates JSON files that you can manually import into your database.

**Usage:**
```bash
# Generate 50 users (default)
npm run generate-json

# Generate a specific number of users
npm run generate-json 100
```

**Output:**
- `data/accounts.json` - Account data
- `data/userinfos.json` - UserInfo data

## Generated Data Details

### Account Data
- **Username**: Combination of adjective + noun + number (e.g., "cool_cat_123")
- **Email**: Based on username with random domain
- **Password**: "password123" (for testing purposes)

### User Info Data
- **Gender**: 45% male, 45% female, 10% other
- **Age**: Random between 18-65 years
- **Interests**: 3-10 random interests from curated list
- **Photos**: 1-6 placeholder images from picsum.photos
- **Location**: Random coordinates around major cities worldwide
- **Age Range**: Preference range based on user's age (±10-15 years)

## Sample Data

Example generated account:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "happy_star_456",
  "email": "happy_star_456@gmail.com",
  "password": "password123",
  "createdAt": "2025-09-22T10:30:00.000Z",
  "updatedAt": "2025-09-22T10:30:00.000Z"
}
```

Example generated user info:
```json
{
  "account": "507f1f77bcf86cd799439011",
  "gender": "female",
  "gender_preference": "male",
  "birthdate": "1995-03-15T00:00:00.000Z",
  "interests": ["traveling", "photography", "music", "fitness", "coffee"],
  "photos": [
    "https://picsum.photos/400/600?random=1234",
    "https://picsum.photos/400/600?random=5678"
  ],
  "age_range": {
    "min": 20,
    "max": 35
  },
  "location": {
    "type": "Point",
    "coordinates": [-74.0060, 40.7128]
  },
  "createdAt": "2025-09-22T10:30:00.000Z",
  "updatedAt": "2025-09-22T10:30:00.000Z"
}
```

## Prerequisites

Make sure your MongoDB connection is configured in `config/mongodb.ts` and your environment variables are set up properly.

## Notes

- The database generation script will **clear existing data** before inserting new data
- All passwords are set to "password123" for testing purposes
- Photo URLs use placeholder images from picsum.photos
- Locations are randomly distributed around major cities worldwide
- The scripts use custom faker functions to avoid external dependencies
