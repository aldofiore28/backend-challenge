import { isEmpty, isNil, spiltArray, and, not, isFunction } from './utils'

export const typeToCast = Object.freeze({
  integer: (value) => parseInt(value, 10),
  array: (value) =>
    !Array.isArray(value) &&
    isNaN(parseInt(value, 10)) &&
    isStringifiedArray(value)
      ? value.replace(/\[|\]|\'|\"|\s/g, '').split(',')
      : value
})

/**
 * Casts a value based on a type passed in by the validation object
 * 
 * @param {any} value the value to cast (or not)
 * @param {string} type the type we expect the value to be - defaults to string if not present
 * @returns the casted value into the correct type
 */
export const castIfNeeded = (value, type = 'string') => {
  const cast = typeToCast[type]

  if (!isFunction(cast)) return value

  return typeof value !== type ? cast(value) : value
}

/**
 * Checks if a value is a stringified array
 * 
 * @param {any} value the value to check
 * @returns boolean
 */
export const isStringifiedArray = (value) => /^([\[\]])/.test(value)

/**
 * Checks if a value is a number
 * 
 * @param {any} value the value to check
 * @returns boolean
 */
export const isNumber = (value) => typeof value === 'number'

/**
 * Checks if a value is a string
 * 
 * @param {any} value the value to check
 * @returns boolean
 */
export const isString = (value) => typeof value === 'string'

/**
 * Checks if a value is an empty string
 * 
 * @param {any} value the value to check
 * @returns boolean
 */
export const isEmptyString = (value) => value.length <= 0

/**
 * Validates all the items of an array against a validation object which
 * specifies the rules
 * 
 * @param {array} arr the array to evaluate
 * @param {object} validation the validation object
 * @returns an array of undefineds if validation passes, or error generator functions if fails
 */
export const allItemsMatchType = (arr, validation) => {
  if (!Array.isArray(arr)) return []

  return arr
    .map((value, index) => {
      const { validators, path, toValidate } = fieldToValidator[
        validation.rule.items.type
      ]({
        rule: validation.rule.items,
        value,
        path: `${validation.rule.in}.${validation.rule.name}[${index}]`
      })

      return validators.map(({ validator, error }) => ({
        isValid: validator(toValidate),
        generateError: error,
        path
      }))
    })
    .flat()
}

/**
 * Check whether a value is present in the openapi json
 * 
 * @param {object} rule the rule object from the openapi json
 * @returns a function that takes a Object.entries result as input and returns a boolean
 */
export const isFieldInValidationRules =
  (rule) =>
  ([key]) =>
    Object.keys(rule.properties).includes(key)

/**
 * Generates an error for an invalid number.
 * It is a curried function because of the mechanism where the validation will return
 * a function to generate an error if validation fails, but it needs to store the location
 * of the field once it is validating it.
 * 
 * @param {string} location a path to the value
 * @returns a function that returns the error
 */
export const generateInvalidNumberError = (location) => () =>
  `${location} is not a valid number`

/**
  * Generates an error for an invalid string.
  * It is a curried function because of the mechanism where the validation will return
  * a function to generate an error if validation fails, but it needs to store the location
  * of the field once it is validating it.
  * 
  * @param {string} location a path to the value
  * @returns a function that returns the error
  */
export const generateInvalidStringError = (location) => () =>
  `${location} is not a valid string`

/**
  * Generates an error for an empty string.
  * It is a curried function because of the mechanism where the validation will return
  * a function to generate an error if validation fails, but it needs to store the location
  * of the field once it is validating it.
  * 
  * @param {string} location a path to the value
  * @returns a function that returns the error
  */
export const generateEmptyStringError = (location) => () =>
  `${location} must be non empty`

/**
  * Generates an error for an invalid array.
  * It is a curried function because of the mechanism where the validation will return
  * a function to generate an error if validation fails, but it needs to store the location
  * of the field once it is validating it.
  * 
  * @param {string} location a path to the value
  * @returns a function that returns the error
  */
export const generateInvalidArrayError = (location) => () =>
  `${location} is not a valid array`

/**
  * Generates an error for a required field.
  * It is a curried function because of the mechanism where the validation will return
  * a function to generate an error if validation fails, but it needs to store the location
  * of the field once it is validating it.
  * 
  * @param {string} location a path to the value
  * @returns a function that returns the error
  */
export const generateRequiredFieldsError = (location) => () =>
  `${location} is a required field`

/**
  * Generates an error for an non relevant field.
  * It is a curried function because of the mechanism where the validation will return
  * a function to generate an error if validation fails, but it needs to store the location
  * of the field once it is validating it.
  * 
  * @param {string} location a path to the value
  * @returns a function that returns the error
  */
export const generateNonRelevantFieldsError = (location) => () =>
  `${location} is not relevant for this request`

export const fieldToValidator = Object.freeze({
  integer: ({ rule, value, path }) => ({
    rule,
    path,
    toValidate: castIfNeeded(value, 'integer'),
    validators: [
      {
        validator: and([isNumber, not(Number.isNaN), Number.isInteger]),
        error: generateInvalidNumberError
      }
    ]
  }),
  string: ({ rule, value, path }) => ({
    path,
    rule,
    toValidate: castIfNeeded(value),
    validators: [
      {
        validator: isString,
        error: generateInvalidStringError
      },
      {
        validator: not(isEmptyString),
        error: generateEmptyStringError
      }
    ]
  }),
  array: ({ rule, value, path }) => ({
    path,
    rule,
    toValidate: castIfNeeded(value, 'array'),
    validators: [
      {
        validator: Array.isArray,
        error: generateInvalidArrayError
      },
      {
        validator: allItemsMatchType
      }
    ]
  })
})

/**
 * Processes the validation results when validating an array. This is needed because the validation
 * will check all the values of that array, generating a nested array.
 * 
 * @param {array} validationResults the result of the validation of an array
 * @returns an array with undefineds if the validation has passed, or error generator function if it failed
 */
export const processArrayValidationResults = (validationResults) =>
  validationResults
    .map(({ isValid, generateError, path }) =>
      !isValid && isFunction(generateError) ? generateError(path) : undefined
    )
    .flat()

/**
 * Processes the validation of a single field.
 * 
 * @param {boolean} validationResult the result of the validation
 * @param {function} error the error generator function
 * @param {string} path path of the validated value
 * @returns undefined or an error generator function
 */
export const processSingleFieldValidationResult = (
  validationResult,
  error,
  path
) => (!validationResult && isFunction(error) ? error(path) : undefined)

/**
 * Runs the validation for all values. It needs to distinguish arrays from primitives
 * because it will check for all the members of the array, and to do that it will need
 * to retrieve a new validation object based on the requirement of the items (rules object)
 * 
 * @param {any} toValidate value to validate
 * @param {object} val the validation object
 * @returns an array of undefineds or error generator functions
 */
export const validate = (toValidate, val) =>
  val.validators.map(({ validator, error }) => {
    const validationResult = Array.isArray(toValidate)
      ? validator(toValidate, val)
      : validator(toValidate)

    return Array.isArray(validationResult)
      ? processArrayValidationResults(validationResult)
      : processSingleFieldValidationResult(validationResult, error, val.path)
  })

/**
 * Runs the validation of the query parameters of a request. It is determined in
 * `validateRequest`.
 * 
 * @param {object} data the query object
 * @param {object} rule the rule of specific field
 * @returns an array of undefineds or error generator functions
 */
export const validateQueryParams = (data, rule) => {
  const fieldToTest = data[rule.name]

  if (!fieldToTest) return []

  const validation = fieldToValidator[rule.type]({
    rule: rule,
    value: fieldToTest,
    path: `${rule.in}.${rule.name}`
  })

  return validate(validation.toValidate, validation).flat().filter(not(isNil))
}

/**
 * Runs the validation of the body parameters of a request. It is determined in
 * `validateRequest`.
 * 
 * @param {object} data the body object
 * @param {object} rule the rule of specific field
 * @returns an array of undefineds or error generator functions
 */
export const validateBody = (data, { in: location, schema }) => {
  if (isEmpty(data)) {
    return (schema.required || []).map((required) =>
      generateRequiredFieldsError(`${location}.${required}`)
    )
  }

  const requiredErrors = (schema.required || [])
    .filter((required) => isNil(data[required]))
    .map((required) => generateRequiredFieldsError(`${location}.${required}`))

  const [relevantFields, fieldsToBlock] = spiltArray(
    Object.entries(data),
    isFieldInValidationRules(schema)
  )

  const notUsedFieldsError = fieldsToBlock.map(([key]) =>
    generateNonRelevantFieldsError(`${location}.${key}`)
  )

  const validationErrors = relevantFields
    .map(([key, value]) => {
      const propRule = schema.properties[key]

      const validation = fieldToValidator[propRule.type]({
        value,
        rule: propRule,
        path: `${location}.${key}`
      })

      return validate(validation.toValidate, validation)
    })
    .flat()

  return [...notUsedFieldsError, ...requiredErrors, ...validationErrors]
}

export const validationToLocation = Object.freeze({
  body: validateBody,
  query: validateQueryParams
})

/**
 * Determines what part of the request needs to be validated, does the final flatten of results
 * and runs all the error generator functions
 * 
 * @param {object} req request object generated by express
 * @param {array} rules all the rules for that specific request
 * @returns an array of errors strings
 */
export const validateRequest = (req, rules) => {
  return rules
    .map((rule) => validationToLocation[rule.in](req[rule.in], rule))
    .flat()
    .filter(not(isNil))
    .map((errorGenerator) => errorGenerator())
}
