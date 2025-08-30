const loki = require('lokijs');
const chalk = require('chalk');
const path = require('path');
let resolver;

require('dotenv').config({ quiet: true });
const database_ready = new Promise(resolve => (resolver = resolve));
const database = new loki(process.env.FILES_LOCATION ? path.join(process.env.FILES_LOCATION, 'data.db') : path.join(__dirname, "./data.db"), {
    autoload: true,
    autoloadCallback: () => {
        if(!database.getCollection('users')) {
            database.addCollection('users', { indices: ['id'], unique: ['id'] });
        }

        resolver();
    },
    autosave: true,
    autosaveInterval: 5000
});

const getUsers = async () => {
    try {
        await database_ready;
        return database.getCollection('users');
    } catch(error) {
        console.error(`${chalk.red('[DATABASE]')} Error getting users from database:`, error);
        return null;
    }
};

const getUser = async (userId) => {
    try {
        const users = await getUsers();
        return users.by('id', userId);
    } catch {
        return null;
    }
};

async function updateUser(userId, data) {
    try {
        const users = await getUsers();
        const user = users.by('id', userId);

        if (!user) {
            users.insert({ id: userId, items: [], ...data });
        } else {
            users.update({ ...user, ...data });
        }

        return true;
    } catch(error) {
        console.error(`${chalk.red('[DATABASE]')} Error updating user account in database:`, error);
        return false;
    }
}

async function deleteUser(userId) {
    try {
        const users = await getUsers();
        const user = users.by('id', userId);

        if(user) users.remove(user);
        return true;
    } catch {
        return false;
    }
}

async function getRecord(userId, itemId) {
    try {
        const user = await getUser(userId);

        return user?.items?.find(item => item.id === itemId) || null;
    } catch {
        return null;
    }
}

async function insertRecord(userId, data) {
    try {
        const users = await getUsers();
        const user = users.by('id', userId);

        if (!user) {
            users.insert({ id: userId, items: [data] });
        } else {
            user.items = user.items || [];

            user.items.push(data);
            users.update(user);
        }

        return true;
    } catch(error) {
        console.error(`${chalk.red('[DATABASE]')} Error inserting record into database:`, error);
        return false;
    }
}

async function updateRecord(userId, itemId, data) {
    try {
        const users = await getUsers();
        const user = users.by('id', userId);
        if (!user || !user.items) return false;

        const index = user.items.findIndex(item => item.id === itemId);
        if (index === -1) return false;

        user.items[index] = { ...user.items[index], ...data };
        users.update(user);

        return true;
    } catch(error) {
        console.error(`${chalk.red('[DATABASE]')} Error updating record in database:`, error);
        return false;
    }
}

async function deleteRecord(userId, itemId) {
    try {
        const users = await getUsers();
        const user = users.by('id', userId);
        if (!user || !user.items) return false;

        user.items = user.items.filter(item => item.id !== itemId);
        users.update(user);

        return true;
    } catch(error) {
        console.error(`${chalk.red('[DATABASE]')} Error deleting record from database:`, error);
        return false;
    }
}

async function recordExists(userId, itemId) {
    try {
        const user = await getUser(userId);
        if (!user || !user.items) return false;

        return user.items.some(item => item.id === itemId);
    } catch {
        return false;
    }
}

console.log(`${chalk.blue('[DATABASE]')} Database connections established successfully.`);
process.on('SIGINT', async () => {
    try {
        // quick little fix to make sure it saves before exiting
        await new Promise(resolve => database.saveDatabase(resolve));
        process.exit(0);
    } catch (err) {
        console.error(`${chalk.red('[DATABASE]')} Error saving the database:`, err);
        process.exit(1);
    }
});

module.exports = { getUsers, getUser, updateUser, deleteUser, getRecord, insertRecord, updateRecord, deleteRecord, recordExists };