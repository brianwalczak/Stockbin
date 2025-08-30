const { getUsers, getUser, updateUser, deleteUser, getRecord, insertRecord, updateRecord, deleteRecord, recordExists } = require('./db.js');
const { DateTime } = require('luxon');
const session = require('express-session');
const nodemailer = require('nodemailer');
const express = require('express');
const chalk = require('chalk');
const path = require('path');
const http = require('http');
const app = express();
const appVersion = '0.1.3';
const emailCodes = [];

require('dotenv').config({ quiet: true });
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOSTNAME,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
    }
});

app.use(session({
    name: 'state',
    secret: crypto.randomUUID(),
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    }
}));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'static')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function isValidDate(d) {
    return d instanceof Date && !isNaN(d.getTime());
}

app.use(async (req, res, next) => {
    try {
        res.locals.user = req?.session?.user;

        next();
    } catch (err) {
        next(err);
    }
});

const requireAuth = (userData = false) => {
    return async (req, res, next) => {
        try {
            if (!req?.session || !req?.session?.user) {
                if (req.method === 'POST') {
                    return res.json({ success: false, reason: 'Whoops! It looks like you are not logged in.' });
                } else {
                    return res.redirect('/login');
                }
            }

            if (userData) {
                let data = await getUser(req.session.user);

                if(!data) {
                    data = { id: req.session.user };
                }

                if(!data.items) {
                    data.items = [];
                }

                res.locals.data = data;
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

app.get('/', requireAuth(true), async (req, res) => {
    if (res.locals.data?.items && res.locals.data?.timezone) {
        res.locals.data.items.forEach(item => {
            if (item.expires) {
                item.expiresUTC = DateTime.fromISO(item.expires, { zone: res.locals.data.timezone }).toUTC().toMillis();
            }
        });
    }

    res.render('index', { activePage: 'home' });
});

app.get('/login', (req, res) => {
    if(req.session && req.session.user) {
        return res.redirect('/');
    }

    res.render('login', { activePage: 'login' });
});

app.get('/logout', (req, res) => {
    if(req.session) req.session.destroy();

    res.redirect('/login');
});

app.get('/create', requireAuth(true), async (req, res) => {
    res.render('edit', { activePage: 'create', editing: null });
});

app.get('/edit/:id', requireAuth(true), async (req, res) => {
    const itemId = req.params.id;
    const item = res.locals.data.items.find(i => i.id === itemId);
    if (!item) return res.redirect('/inventory');

    res.render('edit', { activePage: 'edit', editing: item });
});

app.get('/inventory', requireAuth(true), async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const type = req.query?.type?.toLowerCase() ?? 'all';
        const itemsPerPage = 10;

        if(type && (type !== 'item' && type !== 'bin' && type !== 'all')) return res.redirect('/inventory');

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        let filteredItems = (type && type !== 'all') ? res.locals.data.items.filter(item => item.type === type) : res.locals.data.items;
        
        // Add search query filtering
        if(req.query?.q && req.query.q.length > 0) {
            const q = req.query.q.toLowerCase();
            filteredItems = filteredItems.filter(item => item.name.toLowerCase().includes(q));
        }

        // Add tags filtering
        if(req.query?.tags && req.query.tags.length > 0) {
            const tag = req.query.tags.toLowerCase();
            filteredItems = filteredItems.filter(item => item.tags && item.tags.some(t => t.includes(tag)));
        }

        const totalPages = Math.max(Math.ceil(filteredItems.length / itemsPerPage), 1);
        const params = new URLSearchParams();

        params.set('type', type);
        if (req.query?.q && req.query.q.length > 0) params.set('q', req.query.q);
        if (req.query?.tags && req.query.tags.length > 0) params.set('tags', req.query.tags);

        if (page < 1 || page > totalPages) {
            params.set('page', page < 1 ? 1 : totalPages);
            return res.redirect(`/inventory/?${params.toString()}`);
        }

        const results = filteredItems.slice(startIndex, endIndex);
        results.sort((a, b) => (b.updatedAt ? new Date(b.updatedAt) : 0) - (a.updatedAt ? new Date(a.updatedAt) : 0));

        res.render('inventory', { activePage: 'inventory', page, results, totalPages, type, params });
    } catch(err) {
        console.error(`${chalk.red('[SERVER]')} Error when processing request:`, err);
        res.render('inventory', { activePage: 'inventory', page: 1, results: [], totalPages: 1, type: 'all', params: new URLSearchParams('?type=all') });
    }
});

app.get('/view/:id', requireAuth(true), async (req, res) => {
    const itemId = req.params.id;
    const item = res.locals.data.items.find(i => i.id === itemId);
    if (!item) return res.redirect('/inventory');

    res.render('view', { activePage: 'view', viewing: item });
});

app.get('/settings', requireAuth(true), async (req, res) => {
    res.render('settings', { activePage: 'settings', version: appVersion });
});


// -- API: Settings -- //
app.get('/api/export', requireAuth(true), async (req, res) => {
    try {
        res.setHeader('Content-Disposition', 'attachment; filename="export.json"');
        res.setHeader('Content-Type', 'application/json');

        res.send(JSON.stringify(res.locals.data.items, null, 2));
    } catch (err) {
        res.json({ success: false, reason: 'Whoops! An unexpected error occurred.' });
    }
});

app.post('/api/user/update', requireAuth(false), async (req, res) => {
    try {
        const { timezone } = req.body;

        if (timezone && (!Intl.supportedValuesOf("timeZone").includes(timezone))) {
            return res.json({ success: false, reason: 'Whoops! An invalid timezone was provided.' });
        }

        await updateUser(req.session.user, { timezone });
        return res.json({ success: true });
    } catch (err) {
        return res.json({ success: false, reason: 'Whoops! Your account can\'t be updated right now.' });
    }
});

app.post('/api/delete/:id', requireAuth(true), async (req, res) => {
    try {
        const item = res.locals.data.items.find(i => i.id === req.params.id);

        if(item.type === 'bin') {
            // find all items with the same bin ID
            const itemsInBin = res.locals.data.items.filter(i => i.bin === item.id);

            for(const binItem of itemsInBin) {
                await deleteRecord(req.session.user, binItem.id);
            }
        }

        await deleteRecord(req.session.user, req.params.id);
        return res.json({ success: true });
    } catch (err) {
        return res.json({ success: false, reason: 'Whoops! This item can\'t be deleted right now.' });
    }
});

app.post('/api/user/delete', requireAuth(false), async (req, res) => {
    try {
        await deleteUser(req.session.user);
        req.session.destroy();

        return res.json({ success: true });
    } catch (err) {
        return res.json({ success: false, reason: 'Whoops! Your account can\'t be deleted right now.' });
    }
});

// -- API: Create/Edit -- //
app.post('/api/editor{/:id}', requireAuth(false), async (req, res) => {
    const editing = req.params?.id ?? null;
    
    try {
        // Check if a valid type is provided
        if(!req.body.type || (req.body.type !== 'item' && req.body.type !== 'bin')) {
            return res.json({ success: false, reason: 'Your request has been malformed. Please try again.' });
        }

        // For editing a record, check if it exists
        if(editing && !(await recordExists(req.session.user, editing))) {
            return res.json({ success: false, reason: 'Whoops! It looks like the item you\'re trying to edit does not exist.' });
        }

        // Check if the ID provided already exists
        const idChanged = (editing ? editing !== req.body.id : true);
        if(!req.body.id || (idChanged && (await recordExists(req.session.user, req.body.id)))) {
            return res.json({ success: false, reason: `Whoops! It looks like an item with this ${req.body.type === 'item' ? 'UPC' : 'bin ID'} already exists.` });
        }
        
        let record = {};
        switch (req.body.type) {
            case 'item': {
                const { type, name, id, quantity, location } = req.body;

                if (!name || !id || !quantity || !location) {
                    return res.json({ success: false, reason: 'Your request has been malformed. Please provide all required fields.' });
                }

                // Check if item name is a valid length
                if(name.length > 256 || name.length <= 1) {
                    return res.json({ success: false, reason: 'Whoops! Your item name must be between 2 and 256 characters.' });
                }

                // Check if item quantity is a valid number
                if(isNaN(quantity) || Number(quantity) <= 0) {
                    return res.json({ success: false, reason: 'Whoops! You must provide a valid item quantity.' });
                }

                // Check if item ID is a valid length
                if(id.length > 256 || id.length <= 1) {
                    return res.json({ success: false, reason: 'Whoops! Your UPC must be between 2 and 256 characters.' });
                }

                // Check if location is valid and exists
                const locationExists = await getRecord(req.session.user, location);
                if(!locationExists || locationExists?.type !== 'bin') {
                    return res.json({ success: false, reason: 'Whoops! It looks like your bin location no longer exists.' });
                }

                // Check for optional values
                if(req.body.description && (typeof req.body.description !== 'string' || req.body.description.length > 512)) {
                    return res.json({ success: false, reason: 'Whoops! Your item description must have a maximum length of 512 characters.' });
                } else if(req.body.tags && (typeof req.body.tags !== 'string' || req.body.tags.length > 512)) {
                    return res.json({ success: false, reason: 'Whoops! Your item tags must have a maximum length of 512 characters.' });
                } else if(req.body.threshold && (isNaN(req.body.threshold) || Number(req.body.threshold) <= 0)) {
                    return res.json({ success: false, reason: 'Whoops! You must provide a valid low stock threshold.' });
                } else if(req.body.expires && !isValidDate(new Date(req.body.expires))) {
                    return res.json({ success: false, reason: 'Whoops! You must provide a valid expiration date.' });
                }

                record = { type, name, id, updatedAt: Date.now(), quantity: Number(quantity), bin: location, description: (req.body.description && req.body.description.length > 0) ? req.body.description : null, tags: (req.body.tags && req.body.tags.length > 0) ? req.body.tags.toLowerCase().split(',').map(tag => tag.trim()) : [], threshold: (req.body.threshold && !isNaN(req.body.threshold)) ? Number(req.body.threshold) : null, expires: (req.body.expires && req.body.expires.length > 0) ? req.body.expires : null };
                break;
            }
            case 'bin': {
                const { type, name, id } = req.body;

                if (!name || !id) {
                    return res.json({ success: false, reason: 'Your request has been malformed. Please provide all required fields.' });
                }

                // Check if item name is a valid length
                if(name.length > 256 || name.length <= 1) {
                    return res.json({ success: false, reason: 'Whoops! Your item name must be between 2 and 256 characters.' });
                }

                // Check if item ID is a valid length
                if(id.length > 256 || id.length <= 1) {
                    return res.json({ success: false, reason: 'Whoops! Your UPC must be between 2 and 256 characters.' });
                }

                // Check for optional values
                if(req.body.description && (typeof req.body.description !== 'string' || req.body.description.length > 512)) {
                    return res.json({ success: false, reason: 'Whoops! Your item description must have a maximum length of 512 characters.' });
                } else if(req.body.location && (typeof req.body.location !== 'string' || req.body.location.length > 256)) {
                    return res.json({ success: false, reason: 'Whoops! Your item location must have a maximum length of 256 characters.' });
                }

                record = { type, name, id, updatedAt: Date.now(), description: (req.body.description && req.body.description.length > 0) ? req.body.description : null, location: (req.body.location && req.body.location.length > 0) ? req.body.location : null };
                break;
            }
        }

        if(record) {
            try {
                if(record.expires) {
                    // First-time users, pull timezone from their form if not exists
                    const user = await getUser(req.session.user);

                    if(!user.timezone) {
                        if(req.body?.timezone) {
                            await updateUser(req.session.user, { timezone: req.body.timezone });
                        } else {
                            return res.json({ success: false, reason: 'Whoops! Please select a timezone in your settings.' });
                        }
                    }
                }
            } catch {};

            if(editing) {
                await updateRecord(req.session.user, editing, record);
            } else {
                await insertRecord(req.session.user, record);
            }

            res.json({ success: true, id: record.id, data: record });
        } else {
            res.json({ success: false, reason: 'Whoops! An unknown error occurred.' });
        }
    } catch(err) {
        console.error(`${chalk.red('[SERVER]')} Error when processing request:`, err);
        res.json({ success: false, reason: 'Whoops! An unknown error occurred.' });
    }
});

// -- API: Login/Authentication -- //
app.post('/api/requestCode', async (req, res) => {
    try {
        if(req.session && req.session.user) {
            res.json({ success: false, reason: "You're already logged in! Please refresh the page." });
        } else {
            const { email } = req.body;
            if (!email) return res.json({ success: false, reason: 'Whoops! An invalid email address has been provided.' });

            const existing = emailCodes.findIndex(attempt => attempt.email === email);
            if (existing !== -1) emailCodes.splice(existing, 1);

            const expiresAt = Date.now() + (60000 * 5); // 5 minutes from now
            const request = { email, code: (Math.floor(Math.random() * 900000) + 100000).toString(), expiresAt };
            
            try {
                await transporter.sendMail({
                    from: `"Stockbin" <${process.env.SMTP_USERNAME}>`,
                    to: email,
                    subject: "Your verification code is " + request.code,
                    text: "Hello there,\n\nTo safely login to your account, please enter the following verification code: " + request.code + ".\nIf you didn't request this verification code, you may discard this email.\n\nThank you for using Stockbin."
                });
            } catch (error) {
                return res.json({ success: false, reason: 'Whoops! An error occurred when sending your code.' });
            }
            
            emailCodes.push(request);
            res.json({ success: true, expiresAt });
        }
    } catch(err) {
        console.error(`${chalk.red('[SERVER]')} Error when processing request:`, err);
        res.json({ success: false, reason: 'Whoops! We\'re unable to process your request at this time.' });
    }
});

app.post('/api/verifyCode', (req, res) => {
    try {
        if(req.session && req.session.user) {
            res.json({ success: false, reason: "You're already logged in! Please refresh the page." });
        } else {
            const { email, code } = req.body;
            var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
            if (!email || !code) return res.json({ success: false, reason: 'Whoops! An invalid email address or code has been provided.' });

            const existing = emailCodes.findIndex(attempt => attempt.email === email);
            if (existing == -1) return res.json({ success: false, reason: 'Whoops! An invalid email address has been provided.' });

            if(emailCodes[existing].code === code) {
                if(Date.now() > emailCodes[existing].expiresAt) {
                    emailCodes.splice(existing, 1);

                    return res.json({ success: false, reason: 'Whoops! Your request has expired, please request a new code.' });
                } else {
                    emailCodes.splice(existing, 1);
                    req.session.user = email;

                    return res.json({ success: true });
                }
            } else {
                return res.json({ success: false, reason: "Whoops! The code you entered doesn't match our records." });
            }
        }
    } catch(err) {
        console.error(`${chalk.red('[SERVER]')} Error when processing request:`, err);
        res.json({ success: false, reason: 'Whoops! We\'re unable to process your request at this time.' });
    }
});

try {
    http.createServer(app).listen(3000, async () => {
        console.log(`${chalk.green('[SERVER]')} Successfully started the server on port 3000.`);
    });
} catch(err) {
    console.error(`${chalk.red('[SERVER]')} An error occurred when starting server:`, err);
}