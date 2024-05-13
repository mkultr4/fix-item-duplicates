const {
  AGGREGATE_POS_DATA_COLLECTION,
  CHECK_ITEM_COLLECTION,
  ITEM_COLLECTION,
} = require("./constants");
const { getDatabase } = require("./dbClient");

/**
 * Finds check items that match the given query.
 *
 * @param {Object} query - The query object used to filter the check items.
 * @return {Promise<Array>} A promise that resolves to an array of check items that match the query.
 */
async function findAggregate(query) {
  // Aggregate Pos Data Collection
  const aggregatePosDataCollection = getDatabase().collection(
    AGGREGATE_POS_DATA_COLLECTION
  );

  const result = await aggregatePosDataCollection.find(query).toArray();
  // Return result
  return result;
}

/**
 * Asynchronously finds check items in the database that match the given query.
 *
 * @param {Object} query - The query object to match against the check items.
 * @return {Promise<Array>} A promise that resolves to an array of check items that match the query.
 */
async function findCheckItems(query) {
  // Check Items Collection
  const checkItemCollection = getDatabase().collection(CHECK_ITEM_COLLECTION);
  const result = await checkItemCollection.find(query).toArray();
  // Return result
  return result;
}

/**
 * Asynchronously finds items in the database that match the given query.
 *
 * @param {Object} query - The query object to match against the items.
 * @return {Promise<Array>} A promise that resolves to an array of items that match the query.
 */
async function findItems(query) {
  // Check Items Collection
  const itemCollection = getDatabase().collection(ITEM_COLLECTION);
  const result = await itemCollection.find(query).toArray();
  // Return result
  return result;
}
module.exports = { findAggregate, findCheckItems, findItems };
