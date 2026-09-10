"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const seedData_1 = require("./seedData");
async function run() {
    try {
        await (0, seedData_1.seedDatabase)(true);
        console.log('Seed runner completed successfully.');
        process.exit(0);
    }
    catch (error) {
        console.error('Seed runner failed:', error);
        process.exit(1);
    }
}
run();
