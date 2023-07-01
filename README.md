<br>
<div class="badges" align="center">

# Community Helper

[![Author](https://img.shields.io/badge/Author-ABADIMA-6b46d4?style=for-the-badge)](https://github.com/abadima)\
[![Author](https://img.shields.io/badge/Gamearoo%20Development-7F007C?style=for-the-badge)](https://discord.gg/apZQ8jeCHc)

</div>

Welcome to the guide for the **Community Helper**! This bot is designed to assist your community with
various features and utilizes a database to store and retrieve data. This guide will walk you through the installation
and setup process to get your bot up and running smoothly.

## Prerequisites

Before proceeding with the installation, verify that you have the following:

- [NodeJS LTS](https://nodejs.org/en/download) installed
- [Discord Bot Token](https://discord.com/developers/applications) ready
- MongoDB database ready ([Get Started](https://www.mongodb.com))
- An API key for RAM API

## Installation

To install and set up the Community helper, follow the steps below:

1. Clone the repository to your local machine:

   ```shell
   git clone https://github.com/Gamearoo-s-Development/Community-Helper.git
    ```
2. Navigate to the project directory:

   ```shell
   cd Community-Helper
   ```
3. Install the required dependencies:

   ```shell
    npm install && npm update
    ```
4. Create a `.env` file in the project root directory
5. Open the `.env` file and add the following environment variables:

```dotenv
TOKEN=YOUR_DISCORD_BOT_TOKEN
MONGO=YOUR_MONGODB_URI
RAM_API=YOUR_RAM_API_PRO_KEY
```

Make sure to replace all variables with your own values.

# Starting Community Helper

To start the bot, run the following command in the project root directory:

```shell
npm start
```

The bot should now be online and ready to use!

# Commands

The following commands are available for use:

### Admin Only

* `/todo create <task>` - Creates a new todo item
* `/todo delete <task-id>` - Deletes a todo item
* `/todo edit <task-id> <new-task>` - Edits a todo item
* `/todo move <task-id> <new-category>` - Moves a todo item to a different category
* `/todo settings <setting(s)> <value>` - Changes settings (MUST RUN FIRST)
* `/reject suggestion <message-id> <reason>` - Rejects a suggestion and cancels vote

### Everyone

* `/suggest <suggestion>` - Creates a new suggestion

# Additional Resources

* [Discord.js Documentation](https://old.discordjs.dev/#/docs/discord.js/main/general/welcome)
* [MongoDB Documentation](https://docs.mongodb.com/)
* [RAM API Documentation](https://api.rambot.xyz/docs/v13/)