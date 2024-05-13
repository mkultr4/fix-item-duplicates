const { ITEM_COLLECTION } = require("./constants");
const { getDatabase } = require("./dbClient");
const { findItems } = require("./query");
const LIMIT = 1;
/**
 * Retrieves duplicate items from the database based on the name, location, sale department, and master department.
 *
 * @return {Promise<Array>} An array of objects containing the original and duplicate item IDs.
 */
async function getNamesDuplicate() {
  const itemCollection = getDatabase().collection(ITEM_COLLECTION);
  // Define the aggregation pipeline
  const pipeline = [
    {
      $match: {
        name: { $ne: "" }, // Exclude documents where the name field is empty
      },
    },
    {
      $group: {
        _id: {
          name: "$name",
          location: "$location",
          saleDepartment: "$sale-department",
          masterDepartment: "$master-department",
        },
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        name: "$_id.name",
        location: "$_id.location",
        saleDepartment: "$_id.saleDepartment",
        masterDepartment: "$_id.masterDepartment",
        count: 1,
      },
    },
    {
      $limit: LIMIT, // Limit the output to 10 documents
    },
  ];

  // Run the aggregation query
  const result = await itemCollection
    .aggregate(pipeline, { allowDiskUse: true })
    .toArray();

  console.log(result.length + " duplicates found, with LIMIT=" + LIMIT);

  return result;
}
/**
 * Retrieves the original and duplicate IDs based on the provided name, location, sale department, and master department.
 *
 * @param {string} name - The name of the item.
 * @param {string} location - The location of the item.
 * @param {string} saleDepartment - The sale department of the item.
 * @param {string} masterDepartment - The master department of the item.
 * @return {Object} An object containing the original and duplicate item IDs.
 */
async function getOriginalIdAndDuplicateId(
  name,
  location,
  saleDepartment,
  masterDepartment
) {
  const query = {
    name: name,
    location: location,
    "sale-department": saleDepartment,
    "master-department": masterDepartment,
  };
  const items = await findItems(query);

  if (items.length <= 1) {
    return null;
  }

  const itemOriginal = items.find((item) => item._id.endsWith(".1"));
  const itemDuplicate = items.find((item) => item._id.endsWith(".2"));
  // Check ids are same without end .1 and .2
  const idOriginal = itemOriginal._id.slice(0, -2);
  const idDuplicate = itemDuplicate._id.slice(0, -2);
  if (idOriginal !== idDuplicate) {
    return null;
  }

  return {
    originalId: itemOriginal._id,
    duplicateId: itemDuplicate._id,
    name,
    location: location,
    saleDepartment,
    masterDepartment,
  };
}
/**
 * Retrieves duplicate items from the database based on the name, location, sale department, and master department.
 *
 * @return {Promise<Array>} An array of objects containing the original and duplicate item IDs.
 * @throws {Error} If there is an error retrieving the duplicates.
 */
async function getItemsDuplicate() {
  try {
    // Name, location, saleDepartment, masterDepartment
    const itemsDuplicateNames = await getNamesDuplicate();
    const itemsToReturn = [];
    // Get original id and duplicate id
    for (const item of itemsDuplicateNames) {
      if (
        !item.name ||
        !item.location ||
        !item.saleDepartment ||
        !item.masterDepartment
      )
        continue;
      const originalIdAndDuplicateId = await getOriginalIdAndDuplicateId(
        item.name,
        item.location,
        item.saleDepartment,
        item.masterDepartment
      );
      if (!originalIdAndDuplicateId) continue;

      itemsToReturn.push(originalIdAndDuplicateId);
    }
    console.log(`${itemsToReturn.length} duplicates filtered found:`);
    return itemsToReturn;
  } catch (error) {
    console.error("Failed to get duplicates:", error);
  }
}

module.exports = { getItemsDuplicate };
