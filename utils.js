// Function to remove a specified prefix from each item
const removePrefix = (prefix) => (item) => item.replace(prefix, "");
// Exports
module.exports = { removePrefix }