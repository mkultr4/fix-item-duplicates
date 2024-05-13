// Change
const MONGODB_URL = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.1.1";
const DATABASE_NAME = "tipzyy_fix_duplicates";
// No change
const ITEM_COLLECTION = "item";
const CHECK_ITEM_COLLECTION = "check-item";
const AGGREGATE_POS_DATA_COLLECTION = "aggregate-pos-data";

module.exports = {
  MONGODB_URL,
  DATABASE_NAME,
  ITEM_COLLECTION,
  CHECK_ITEM_COLLECTION,
  AGGREGATE_POS_DATA_COLLECTION,
};
