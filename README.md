# Fix Items Duplicates

This script helps to fix duplicate items in your MongoDB database.

## Configuration

Before running the script, ensure you have configured the constants in `constants.js`.

### Constants Configuration

In `constants.js`, configure the following constants:

- `MONGODB_URL`: The URI of your MongoDB database.
- `DATABASE_NAME`: The name of your MongoDB database.

Example `constants.js`:

```javascript
const MONGODB_URL = "mongodb://localhost:27017/mydatabase";
const DATABASE_NAME = "mydatabase";
```

## Running the Script

Before running the script, ensure you have installed the dependencies:

```shell
npm install
```

To fix the items duplicates, run the following command:

```shell
node index.js
```

## Important Note

Make sure to backup your database before running the script, as it will delete the duplicated item permanently.
