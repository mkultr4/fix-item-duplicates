const { findAggregate } = require("./query");
const { TYPES, DATA_TYPES } = require("./types");
const fs = require("fs");

/**
 * Calculates the total aggregate position data based on the input data and type.
 *
 * @param {Object} aggreatePosData - The aggregate position data object.
 * @param {string} type - The type of aggregation to calculate (e.g., 'monthly', 'yearly', 'daily').
 * @return {number} The rounded total of the aggregate position data.
 */
async function getAggregatePosDataTotal(aggreatePosData, type) {
  const dataType = aggreatePosData["data-type"];
  const query = {
    reference: aggreatePosData["reference"],
    type: type,
    "data-type": dataType,
    user: aggreatePosData["user"],
    type: type,
  };
  const aggregatePosData = await findAggregate(query);
  // Sum total
  const newValue = aggregatePosData.reduce(
    (accumulator, currentValue) => accumulator + currentValue.value,
    0
  );
  // Rounded Total
  let roundedTotal = newValue;
  // Rounding the total to two decimal places
  if (dataType === DATA_TYPES.TOTAL_REVENUE_ITEMS) {
    roundedTotal = parseFloat(roundedTotal.toFixed(2));
  }
  return roundedTotal;
}

/**
 * Checks the lifetime totals for each user and data type in the aggregatePosDataLifetime.
 *
 * @param {Object} itemInfo - An object containing the originalId of the item.
 * @return {Promise<void>} - A promise that resolves when the totals have been checked.
 */
async function checkInfo(itemInfo) {
  // Lifetime
  const aggregatePosDataLifetime = await findAggregate({
    reference: `/v1.0/item/${itemInfo.originalId}`,
    type: TYPES.LIFETIME,
  });

  // Group by user
  const groupedByUser = aggregatePosDataLifetime.reduce((acc, item) => {
    const key = item.user;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
  const date = new Date();
  // Log data
  const logFilePath = `./log-${date.getTime()}.txt`; // Specify your log file path here

  const logData = [];
  logData.push(`\nSummary totals:`);
  logData.push(`Original ID: ${itemInfo.originalId}`);
  logData.push(`Duplicated ID: ${itemInfo.duplicateId}`);
  logData.push(`Item Name: ${itemInfo.name}`);
  logData.push(`Item Location: ${itemInfo.location}`);
  logData.push(`Item Sale Department: ${itemInfo.saleDepartment}`);
  logData.push(`Item Master Department: ${itemInfo.masterDepartment}`);
  logData.push(`----------`);

  const users = Object.keys(groupedByUser);
  for (const user of users) {
    const items = groupedByUser[user];
    logData.push(`User ${user} lifetime totals:`);
    logData.push(`----------`);
    for (const item of items) {
      const totalYtd = await getAggregatePosDataTotal(item, TYPES.YTD);
      const totalMonthly = await getAggregatePosDataTotal(item, TYPES.MONTHLY);
      const totalDaily = await getAggregatePosDataTotal(item, TYPES.DAILY);
      logData.push(`* Data type ${item["data-type"]}:`);
      logData.push(`** YTD: ${totalYtd}`);
      logData.push(`** Monthly: ${totalMonthly}`);
      logData.push(`** Daily: ${totalDaily}`);
      logData.push(`** Lifetime: ${item.value}`);
      logData.push(`----------`);
      if (
        totalYtd !== item.value ||
        totalMonthly !== item.value ||
        totalDaily !== item.value
      ) {
        logData.push(`ERROR: Lifetime totals do not match`);
      }
    }
  }

  // Write all accumulated log data to a file
  fs.appendFile(logFilePath, logData.join("\n"), (err) => {
    if (err) {
      console.error("Failed to write to log file:", err);
    }
  });
}

module.exports = { checkInfo };
