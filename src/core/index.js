/**
 * ApiBench-Mini Core API Barrel Module
 */

const stats = require('./stats');
const benchEngine = require('./bench-engine');

module.exports = {
  ...stats,
  ...benchEngine
};
