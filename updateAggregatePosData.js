const { AGGREGATE_POS_DATA_COLLECTION } = require("./constants");
const { getDatabase } = require("./dbClient");
const { findAggregate } = require("./query");
const { DATA_TYPES, TYPES } = require("./types");
// Duplicate global
let duplicates = [];
/**
 * Retrieves the aggregate position data for duplicates based on the provided item information.
 *
 * @param {Object} itemInfo - The item information containing the duplicate ID and location.
 * @param {string} itemInfo.duplicateId - The ID of the duplicate item.
 * @param {string} itemInfo.location - The location of the item.
 * @return {Promise<Array>} A promise that resolves to an array of aggregate position data for duplicates.
 */
async function getAggregatePosDataDuplicates(itemInfo) {
  const aggregatePosDataDuplicate = await findAggregate({
    reference: `/v1.0/item/${itemInfo.duplicateId}`,
    location: itemInfo.location,
  });
  return aggregatePosDataDuplicate;
}
/**
 * Update aggregate post data, based on bgn-timestamp, end-timestamp, data-type, and type.
 * @param {Object} aggregatePosData The aggregate post data object to update.
 * @param {string} type The type of aggregation to agrupate (e.g., 'monthly', 'yearly', 'daily').
 */
async function updateAggregatePosDataItem(aggregatePosData, type) {
  // Extract relevant properties
  const {
    "data-type": dataType,
    user,
    "bgn-timestamp": bgnTimestamp,
    "end-timestamp": endTimestamp,
    children,
  } = aggregatePosData;

  // Get from duplucates references
  let duplicatesFilter = duplicates.filter(
    (duplicate) =>
      duplicate["data-type"] === dataType &&
      duplicate["user"] === user &&
      duplicate["type"] === type &&
      (type === TYPES.YTD ||
        (duplicate["bgn-timestamp"] >= bgnTimestamp &&
          duplicate["end-timestamp"] <= endTimestamp)) &&
          !children.includes(`/v1.0/aggregate-pos-data/${duplicate._id}`)

  );
  // Sum total
  const newValue = duplicatesFilter.reduce(
    (accumulator, currentValue) => accumulator + currentValue.value,
    0
  );
  // Rounded Total
  let roundedTotal = newValue + aggregatePosData.value;
  // Rounding the total to two decimal places
  if (dataType === DATA_TYPES.TOTAL_REVENUE_ITEMS) {
    roundedTotal = Number(parseFloat(roundedTotal.toFixed(2)));
    // Ensuring the value is stored as a double
    roundedTotal = roundedTotal + 0.0;
  }
  // New Childrens
  const newChildrens = duplicatesFilter
    .filter((child) => !child.isDeleted && !children.includes(child._id))
    .map((child) => `/v1.0/aggregate-pos-data/${child._id}`);
  // Update
  const update = {
    $set: {
      value: roundedTotal,
    },
    $addToSet: {
      children: { $each: newChildrens },
    },
  };
  await getDatabase()
    .collection(AGGREGATE_POS_DATA_COLLECTION)
    .updateOne({ _id: aggregatePosData._id }, update);
}

/**
 * Updates duplicate aggregate pos data based on the given type and item info.
 *
 * @param {string} type - The type of aggregate pos data.
 * @param {Object} itemInfo - The item information containing duplicateId.
 * @return {Promise<void>} A promise that resolves when the update is complete.
 */
async function updateAggregatePosDataDuplicated(type, itemInfo) {
  // Find
  const aggregatePostDataDuplicate = await findAggregate({
    reference: `/v1.0/item/${itemInfo.duplicateId}`,
    type: type,
  });
  console.log(
    `Find ${aggregatePostDataDuplicate.length} aggregate ${type} duplicate`
  );
  // First check if exist in item no duplicated
  const toDelete = [];
  for (const aggregateDup of aggregatePostDataDuplicate) {
    // Destructuring
    const {
      "data-type": dataType,
      user,
      "bgn-timestamp": bgnTimestamp,
      "end-timestamp": endTimestamp,
    } = aggregateDup;
    // Find
    const aggregatePosDataExist = await findAggregate({
      reference: `/v1.0/item/${itemInfo.originalId}`,
      type: type,
      "data-type": dataType,
      "bgn-timestamp": bgnTimestamp,
      "end-timestamp": endTimestamp,
      user,
    });
    if (aggregatePosDataExist.length > 0) {
      toDelete.push(aggregateDup);
    } else {
      // Update reference to item no duplicated
      const update = {
        $set: {
          reference: `/v1.0/item/${itemInfo.originalId}`,
        },
      };
      await getDatabase()
        .collection(AGGREGATE_POS_DATA_COLLECTION)
        .updateOne({ _id: aggregateDup._id }, update);
    }
  }
  // Delete existing duplicates
  const idsToDelete = toDelete.map((aggregate) => aggregate._id);
  // Update Duplicate reference
  duplicates = duplicates.map((duplicate) => {
    if (idsToDelete.includes(duplicate._id)) {
      return { ...duplicate, isDeleted: true };
    }
    return duplicate;
  });

  await getDatabase()
    .collection(AGGREGATE_POS_DATA_COLLECTION)
    .deleteMany({ _id: { $in: idsToDelete } });
}
/**
 * Updates the aggregate position data for a daily item.
 *
 * @param {Object} aggregateDup - The duplicate aggregate position data.
 * @param {Object} itemInfo - Information about the item.
 * @return {Promise<void>} - A promise that resolves when the update is complete.
 */
async function updateAggregatePosDataDailyItem(aggregateDup, itemInfo) {
  // 
  const { "bgn-timestamp": bgnTimestamp, "end-timestamp": endTimestamp, "data-type": dataType, user } = aggregateDup
  // Query
  const query = {
    reference: `/v1.0/item/${itemInfo.originalId}`,
    type: TYPES.DAILY,
    "data-type": dataType,
    "bgn-timestamp": bgnTimestamp,
    "end-timestamp": endTimestamp,
    user
  };
  // First search if exist an item for the bgn-date to update or update only reference
  const aggregateNoDuplicatedNumbers = await findAggregate(query);
  if (aggregateNoDuplicatedNumbers.length > 0) {
    const orginialAggregate = aggregateNoDuplicatedNumbers[0];
    // Rounded Total
    let roundedTotal = orginialAggregate.value + aggregateDup.value;
    // Rounding the total to two decimal places
    if (dataType === DATA_TYPES.TOTAL_REVENUE_ITEMS) {
      roundedTotal = parseFloat(roundedTotal.toFixed(2));
      roundedTotal = roundedTotal + 0.0;
    }
    // Update duplicate aggregate pos data with the item id no duplicated
    const update = {
      $set: {
        value: roundedTotal,
      },
      $addToSet: {
        children: { $each: [...aggregateDup.children] },
      },
    };

    // Update aggregate pos data
    await getDatabase()
      .collection(AGGREGATE_POS_DATA_COLLECTION)
      .updateOne({ _id: orginialAggregate._id }, update);
    // Delete duplicate aggregate pos data
    await getDatabase()
      .collection(AGGREGATE_POS_DATA_COLLECTION)
      .deleteOne({ _id: aggregateDup._id });

    duplicates = duplicates.map((duplicate) => {
      if (duplicate._id === aggregateDup._id) {
        return {
          ...duplicate,
          isDeleted: true,
        };
      }
      return duplicate;
    });
  } else {
    // Update duplicate aggregate pos data with the item id no duplicated
    const update = {
      $set: {
        reference: `/v1.0/item/${itemInfo.originalId}`,
      },
    };
    await getDatabase()
      .collection(AGGREGATE_POS_DATA_COLLECTION)
      .updateOne({ _id: aggregateDup._id }, update);
  }
}
// Main function update daily
async function dailyAggregatePosData(itemInfo) {
  // Find aggregate pos data duplicated
  const aggregateDuplicateDaily = duplicates.filter(
    (aggregate) => aggregate.type === TYPES.DAILY
  );
  console.log(
    `Find ${aggregateDuplicateDaily.length} aggregate duplicate daily`
  );

  if (aggregateDuplicateDaily.length > 0) {
    for (const aggregateDup of aggregateDuplicateDaily) {
      await updateAggregatePosDataDailyItem(aggregateDup, itemInfo);
    }
  }
}
// Main function update monthly
async function monthlyAggregatePosData(itemInfo) {
  // Update Aggregate Pos Data Monthly Duplicated
  await updateAggregatePosDataDuplicated(TYPES.MONTHLY, itemInfo);

  const aggregateMonthly = await findAggregate({
    reference: `/v1.0/item/${itemInfo.originalId}`,
    type: TYPES.MONTHLY,
  });
  console.log(`Find ${aggregateMonthly.length} aggregate monthly`);

  if (aggregateMonthly.length > 0) {
    for (const aggregatePosData of aggregateMonthly) {
      await updateAggregatePosDataItem(aggregatePosData, TYPES.DAILY);
    }
  }
}
// Main function update ytd
async function ytdAggregatePosData(itemInfo) {
  // Update ytd duplicated
  await updateAggregatePosDataDuplicated(TYPES.YTD, itemInfo);

  const aggregateYtd = await findAggregate({
    reference: `/v1.0/item/${itemInfo.originalId}`,
    type: TYPES.YTD,
  });
  console.log(`Find ${aggregateYtd.length} aggregate ytd`);
  if (aggregateYtd.length > 0) {
    for (const aggregatePosData of aggregateYtd) {
      await updateAggregatePosDataItem(aggregatePosData, TYPES.MONTHLY);
    }
  }
}
// Main function update lifetime
async function lifetimeAggregatePosData(itemInfo) {
  // Update Aggregate Pos Data Lifetime Duplicated
  await updateAggregatePosDataDuplicated(TYPES.LIFETIME, itemInfo);

  const aggregatePosDataLifetime = await findAggregate({
    reference: `/v1.0/item/${itemInfo.originalId}`,
    type: TYPES.LIFETIME,
  });
  console.log(`Find ${aggregatePosDataLifetime.length} aggregate lifetime`);
  if (aggregatePosDataLifetime.length > 0) {
    for (const aggregatePosData of aggregatePosDataLifetime) {
      await updateAggregatePosDataItem(aggregatePosData, TYPES.YTD, itemInfo);
    }
  }
}

async function updateAggregatePosData(itemInfo) {
  try {
    // Duplicate references
    duplicates = await getAggregatePosDataDuplicates(itemInfo);
    duplicates = duplicates.map((aggregate) => ({
      ...aggregate,
      isDeleted: false,
    }));
    // Daily
    await dailyAggregatePosData(itemInfo);
    // Monthly
    await monthlyAggregatePosData(itemInfo);
    // Ytd
    await ytdAggregatePosData(itemInfo);
    // Lifetime
    await lifetimeAggregatePosData(itemInfo);
  } catch (error) {
    console.error("Failed to update aggregate pos data:", error);
  }
}

module.exports = { updateAggregatePosData };
