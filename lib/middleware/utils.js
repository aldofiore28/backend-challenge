import fs from 'fs'
import path from 'path'
import utils from 'util'

const readFilePromise = utils.promisify(fs.readFile)


/**
 * Check if a value is considered empty. It will pass
 * for all falsy values
 * 
 * @param {object} obj a value to evaluate
 * @returns boolean
 */
export const isEmpty = (obj) =>
  [Object, Array].includes((obj || {}).constructor) &&
  !Object.entries(obj || {}).length

/**
 * Checks if a value is null or undefined
 * 
 * @param {any} value a value to evaluate
 * @returns boolean
 */
export const isNil = (value) => value === null || value === undefined

/**
 * Checks if a value is a function
 * 
 * @param {any} value a value to evaluate
 * @returns boolean
 */
export const isFunction = (value) => value instanceof Function

/**
 * Removes the outer object with the http method as a key.
 * 
 * @param {object} rules a rules object parsed from the openapi.json
 * @param {*} requestMethod the method of the request
 * @returns the object contained by the http method key
 */
export const removeHttpVerbFromRules = (rules, requestMethod) => {
  if (!requestMethod) return {}

  return (rules && rules[requestMethod.toLowerCase()]) || {}
}

/**
 * Reads a file from the project root promisified
 * 
 * @param {string} fileName a filename
 * @returns promise -> parsed JSON of the file content
 */
export const readFile = async (fileName) => {
  const { paths: rules } = JSON.parse(
    await readFilePromise(path.join(__dirname, fileName), 'utf-8')
  )
  
  return rules
}

/**
 * Splits one array into one array of two arrays based on a predicate function.
 * 
 * @param {array} arr the array to divide
 * @param {function} divider the predicate function which decides how to divide
 * @returns an array of 2 arrays, first being the ones that passed the predicate, then the ones that failed
 */
export const spiltArray = (arr, divider) =>
  arr.reduce(
    ([pass, fail], elem) =>
      divider(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]],
    [[], []]
  )

/**
 * A curried function that behaves like &&
 * 
 * @param {array of functions} fns all the predicates you want to evaluate
 * @returns a function that will return true if all predicates pass
 */
export const and = (fns) => (item) =>
  fns.reduce((result, fn) => result && fn(item), true)

/**
 * A curried function that negates a function
 * 
 * @param {function} fn function to negate
 * @returns a function that will be negated
 */
export const not = (fn) => (value) => !fn(value)
