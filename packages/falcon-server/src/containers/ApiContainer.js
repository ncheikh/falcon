const Logger = require('@deity/falcon-logger');

/**
 * @typedef {object} ApiInstanceConfig
 * @property {string} name Api short-name (example: "api-wordpress")
 * @property {string} package Node package path (example: "@deity/falcon-wordpress-api")
 * @property {object} config Config object to be passed to Api Instance constructor
 */

/**
 * Api Engine acts as a container for API instances:
 * - manages all the instances
 * - returns the instances as dataSources (required by Apollo Server)
 * - collects all endpoints that API classes have to handle outside GraphQL
 */
module.exports = class ApiContainer {
  /**
   * Create an instance.
   * @param {ApiInstanceConfig[]} apis List of APIs configuration
   */
  constructor(apis) {
    /** @type {ApiDataSourceEndpoint[]} Endpoints collected from extensions */
    this.endpoints = [];
    /** @type {Map<string, ApiDataSource>} Array with API instances */
    this.dataSources = new Map();

    this.registerApis(apis);
  }

  /**
   * Instantiates apis based on passed configuration
   * @param {ApiInstanceConfig[]} apis List of APIs configuration
   * @return {undefined}
   */
  registerApis(apis = []) {
    apis.forEach(api => {
      const { package: pkg, name, config = {} } = api;
      try {
        const ApiClass = require(pkg); // eslint-disable-line import/no-dynamic-require
        /** @type {ApiDataSource} */
        const apiInstance = new ApiClass({ config, name });

        Logger.debug(`ApiContainer: "${apiInstance.name}" API added to the list of DataSources`);
        this.dataSources.set(apiInstance.name, apiInstance);
        if (apiInstance.getEndpoints) {
          Logger.debug(`ApiContainer: Extracting endpoints from "${apiInstance.name}" API DataSource`);
          this.endpoints.push(...apiInstance.getEndpoints());
        }
      } catch (error) {
        Logger.warn(`"${pkg}" package cannot be loaded. Make sure it is installed properly. Details: ${error.stack}`);
      }
    });
  }
};
