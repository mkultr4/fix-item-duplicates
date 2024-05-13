const { getDatabase } = require("./dbClient");
const { findItems } = require("./query");

async function mergeItems(itemInfo) {
  // Query
  const query = {
    _id: { $in: [itemInfo.originalId, itemInfo.duplicateId] },
  };
  // Find Items
  const items = await findItems(query);
  // Filter
  const itemOriginal = items.find((item) => item._id === itemInfo.originalId);
  const itemDuplicated = items.find(
    (item) => item._id === itemInfo.duplicateId
  );
  // Create a new object to hold the merged data
  const mergedItem = { ...itemOriginal };
  // Iterate over keys in itemOriginal and itemDuplicated
  for (const key in itemOriginal) {
    if (itemOriginal.hasOwnProperty(key)) {
      // Check if the value associated with the key is an array in both original and duplicated items
      if (
        Array.isArray(itemOriginal[key]) &&
        Array.isArray(itemDuplicated[key])
      ) {
        // Merge arrays removing duplicates
        mergedItem[key] = [
          ...new Set([...itemOriginal[key], ...itemDuplicated[key]]),
        ];
      } else if (Array.isArray(itemOriginal[key])) {
        // If only itemOriginal[key] is an array, copy it as is
        mergedItem[key] = [...itemOriginal[key]];
      }
    }
  }
  // Update item
  const update = {
    $set: mergedItem,
  };
  const result = await getDatabase().collection("item").updateOne(
    {
      _id: itemInfo.originalId,
    },
    update
  );
  console.log(
    `Updated ${result.matchedCount} document(s) with ${result.modifiedCount} document(s) modified.`
  );
  // Delete item duplicated
  const resultDelete = await getDatabase().collection("item").deleteOne({
    _id: itemInfo.duplicateId,
  });
  console.log(`Deleted ${resultDelete.deletedCount} document(s).`);
}

module.exports = { mergeItems };
