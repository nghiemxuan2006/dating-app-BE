import fs from 'fs';
import path from 'path';

const join = path.join;
const basename = path.basename(__filename);

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (
            file.indexOf('.') !== 0 &&
            file !== basename &&
            file.endsWith('.js') &&
            !file.endsWith('.test.js')
        );
    })
    .forEach(async file => {
        await import(join(__dirname, file));
    });
