const { CHECK_ITEM_COLLECTION } = require("./constants");
const { getDatabase } = require("./dbClient");
const { findCheckItems } = require("./query");

async function updateCheckItems(itemInfo) {
  try {
    const checkItemsToUpdate = await findCheckItems({
      item: `/v1.0/item/${itemInfo.duplicateId}`,
    });
    console.log(`Find ${checkItemsToUpdate.length} check items to update`);
    if (checkItemsToUpdate.length > 0) {
      const checkItemsCollections = getDatabase().collection(
        CHECK_ITEM_COLLECTION
      );
      const query = { item: `/v1.0/item/${itemInfo.duplicateId}` };
      const update = { $set: { item: `/v1.0/item/${itemInfo.originalId}` } };
      const result = await checkItemsCollections.updateMany(query, update);
      console.log(
        `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
      );
    }
  } catch (error) {
    console.error("Failed to update check items:", error);
  }
}

module.exports = { updateCheckItems };
