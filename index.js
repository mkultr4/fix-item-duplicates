const { updateCheckItems } = require("./updateCheckItems");
const { updateAggregatePosData } = require("./updateAggregatePosData");
const { connectToDatabase, closeConnection } = require("./dbClient");
const { mergeItems } = require("./mergeItems");
const { checkInfo } = require("./checkInfo");
const { getItemsDuplicate } = require("./getItemsDuplicate");

/**
 * Main function
 */
async function main() {
  try {
    // Connect to database
    await connectToDatabase();
    // 1. Find Duplicate names
    const itemsDuplicate = await getItemsDuplicate();
    for (const itemInfo of itemsDuplicate) {
      console.log(
        `Duplicate name: ${itemInfo.name} - originalID: ${itemInfo.originalId} - duplicateID: ${itemInfo.duplicateId}`
      );
      // 1.1 Update Check Items
      await updateCheckItems(itemInfo);
      // 1.2 Update Aggregate Pos Data
      await updateAggregatePosData(itemInfo);
      // 1.3 Merge Items original with duplicated
      await mergeItems(itemInfo);
      // 1.4 Check INFO
      await checkInfo(itemInfo);
    }
  } catch (error) {
    console.error("Failed to update data:", error);
  } finally {
    closeConnection();
    console.log("Disconnected from MongoDB");
  }
}

main()
  .then(() => console.log("Operation complete"))
  .catch(console.error);
