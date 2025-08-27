<h1 align="center">Stockbin - Inventory management made easy.</h1>
<p align="center">A feature-rich inventory management system, allowing you to you organize, track, and locate your assets with ease.</p>

> [!WARNING]
> **This project is currently in its beta state as I gather user feedback. Many features are still on the way! If you encounter any issues, please report them <a href='https://github.com/BrianWalczak/Stockbin/issues'>here</a> :)**

## Features
- (📦) Track inventory items and bins with custom names, descriptions, and tags.
- (✅) Add new items and bins, or edit existing records with a robust editor.
- (🔔) Set low stock thresholds for items and get notified when inventory runs low.
- (📤) Export your inventory data to JSON for integration with other services (or backups).
- (🖥️) Optimized web interface for both desktop and mobile devices.
- (👤) Secure login with email verification codes - no passwords required.
- (🔒) You're in control of your data: you may delete your account at any time.

## Getting Started
To get started with using Stockbin, you can visit the website here: https://stockbin.brian.icu/

> [!TIP]
> If you're using a supported mobile device, you can use the **Add to Home Screen** option to use Stockbin as a standalone web app.

To create an account, all you need is your email address - no password is required! You'll receive a verification code to your email in order to access your account.

## Self-Hosting
> [!NOTE]
> **Self-hosting is optional and intended for developers or advanced users who want more control. Most users won't need to self-host.**

> [!WARNING]
> **In order to self-host Stockbin, you'll need to make sure you have a valid `.env` file containing your SMTP configuration; this step is required to send login verification emails. Additionally, you can set the desired location for your database file here.**
> ```env
> FILES_LOCATION="./"
> 
> SMTP_HOSTNAME="mail.xxxxxxxxx.com"
> SMTP_PORT=465
> SMTP_SECURE=true
> 
> SMTP_USERNAME="xxxxx@xxxxxxxxxxxxxxxxxxx.com"
> SMTP_PASSWORD="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
> ```

Prefer to host your own Stockbin instance? Stockbin is open-source under the Apache 2.0 license, and is easy to set up on your own server.

To start, you can download this repository by using the following:
```bash
git clone https://github.com/BrianWalczak/Stockbin.git
cd Stockbin
```

Before you continue, make sure that Node.js is properly installed (run `node --version` to check if it exists). If you don't have it installed yet, you can download it [here](https://nodejs.org/en/download).

Next, install the required dependencies and start the server (port 3000):
```bash
npm install
node .
```

## Contributions

If you'd like to contribute to this project, please create a pull request [here](https://github.com/BrianWalczak/Stockbin/pulls). You can submit your feedback or any bugs that you find on the <a href='https://github.com/BrianWalczak/Stockbin/issues'>issues page</a>. Contributions are highly appreciated and will help us keep this project up-to-date!