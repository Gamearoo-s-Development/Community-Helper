import {client} from "../index.js";


/**
 * Inserts a document into the database
 * @param {string} collectionName
 * @param {Object} query
 * @returns {Promise<Object>}
 */
export function dbInsertOne(collectionName, query) {
	const collection = client.mongo.collection(collectionName);
	return collection.insertOne(query).catch(handleError);
}

/**
 * Deletes a document into the database
 * @param {string} collectionName
 * @param {Object} query
 * @returns {Promise<Object>}
 */
export function dbDeleteOne(collectionName, query) {
	const collection = client.mongo.collection(collectionName);
	return collection.deleteOne(query).catch(handleError);
}

/**
 * Finds many documents in the database
 * @param {string} collectionName - The name of the collection to update
 * @param {Object} query - The query to find the document with
 * @returns {Promise<Object>}
 */
export function dbFindMany(collectionName, query) {
	const collection = client.mongo.collection(collectionName);
	return collection.find(query).toArray().catch(handleError);
}

/**
 * Finds a document in the database
 * @param {string} collectionName - The name of the collection to update
 * @param {Object} query - The query to find the document with
 * @returns {Promise<Object>}
 */
export function dbFindOne(collectionName, query) {
	const collection = client.mongo.collection(collectionName);
	return collection.findOne(query);
}

/**
 * Updates a document in the database
 * @param {string} collectionName - The name of the collection to update
 * @param {Object} query - The query to find the document with
 * @param {Object} update - The update to apply to the document
 * @param {Object?} options - The options for the update operation (upsert)
 * @returns {Promise<Object>}
 */
export function dbUpdateOne(collectionName, query, update, options) {
	const collection = client.mongo.collection(collectionName);
	collection.updateOne(query, update, options).catch(handleError);
	return collection.findOne(query).catch(handleError);
}

function handleError(error) {
	throw error;
}