import {
  allItemsMatchType,
  castIfNeeded,
  fieldToValidator,
  generateInvalidNumberError,
  generateInvalidStringError,
  generateEmptyStringError,
  generateInvalidArrayError,
  generateRequiredFieldsError,
  generateNonRelevantFieldsError,
  isEmptyString,
  isFieldInValidationRules,
  isNumber,
  isString,
  processArrayValidationResults,
  processSingleFieldValidationResult,
  validate,
  validateBody,
  validateQueryParams,
  validateRequest,
  isStringifiedArray
} from './validationUtils'

describe('middleware > validationUtils', () => {
  describe('castIfNeeded', () => {
    it('casts a value to a given type', () => {
      expect(castIfNeeded('1', 'integer')).toEqual(1)
      expect(castIfNeeded('["hello", "hi"]', 'array')).toEqual(['hello', 'hi'])
    })

    it('returns the initial value if there is no cast function found', () => {
      expect(castIfNeeded('1', 'superobject')).toEqual('1')
    })

    it('returns the initial value if no cast needs to happen', () => {
      expect(castIfNeeded(1, 'integer')).toEqual(1)
    })
  })

  describe('isStringifiedArray', () => {
    it('returns true for a stringified array', () => {
      expect(isStringifiedArray(JSON.stringify([1]))).toBe(true)
    })

    it('returns false for other strings', () => {
      expect(isStringifiedArray('a string')).toBe(false)
      expect(isStringifiedArray('')).toBe(false)
      expect(isStringifiedArray(`a template`)).toBe(false)
    })
  })

  describe('isNumber', () => {
    it('returns true for any number', () => {
      [37, 3.14, Infinity, NaN].forEach((value) => {
        expect(isNumber(value)).toBe(true)
      })
    })

    it('returns false for any other value', () => {
      [[], {}, 'a string', [1, 2, 3], { a: 1 }, '', null, undefined].forEach(
        (value) => {
          expect(isNumber(value)).toBe(false)
        }
      )
    })
  })

  describe('isString', () => {
    it('returns true for any string', () => {
      ['', 'a string', `template literal`, '1'].forEach((value) => {
        expect(isString(value)).toBe(true)
      })
    })

    it('returns false for any other value', () => {
      [1, 1.1, [], {}, [1, 2, 3], { a: 1 }, null, undefined].forEach(
        (value) => {
          expect(isString(value)).toBe(false)
        }
      )
    })
  })

  describe('isEmptyString', () => {
    it('returns true for an empty string', () => {
      expect(isEmptyString('')).toBe(true)
    })

    it('returns false for any other string', () => {
      ;['a string', `template`, '1'].forEach((value) => {
        expect(isEmptyString(value)).toBe(false)
      })
    })
  })

  describe('allItemsMatchType', () => {
    it('returns an array validation object after checking each element in an array against the validators', () => {
      const data = ['key', 'value']

      const validation = {
        rule: {
          items: {
            type: 'string'
          },
          in: 'somewhere',
          name: 'key'
        }
      }

      const result = allItemsMatchType(data, validation)

      result.forEach(({ isValid, generateError }) => {
        expect(isValid).toBe(true)
        expect(generateError).toBeInstanceOf(Function)
      })
    })

    it('returns an array validation object after checking each element in an array against the validators - failure', () => {
      const data = [1, 2]

      const validation = {
        rule: {
          items: {
            type: 'string'
          },
          in: 'somewhere',
          name: 'key'
        }
      }

      const [isString, , isString2] = allItemsMatchType(data, validation)

      expect(isString.isValid).toBe(false)
      expect(isString2.isValid).toBe(false)
    })

    it('returns an empty array if the value being evaluated is not an array', () => {
      const data = 1

      const validation = {
        rule: {
          items: {
            type: 'string'
          },
          in: 'somewhere',
          name: 'key'
        }
      }

      expect(allItemsMatchType(data, validation).length).toBe(0)
    })
  })

  describe('isFieldInValidationRules', () => {
    it('returns true if a field is present in the props of the validation rules', () => {
      const key = 'aField'
      const data = [key, 'any value']
      const rules = {
        properties: {
          [key]: {},
          anotherField: {}
        }
      }

      expect(isFieldInValidationRules(rules)(data)).toBe(true)
    })

    it('returns false if a field is not present in the props of the validation rules', () => {
      const key = 'aField'
      const data = [key, 'any value']
      const rules = {
        properties: {
          aRandomField: {},
          anotherField: {}
        }
      }

      expect(isFieldInValidationRules(rules)(data)).toBe(false)
    })
  })

  describe('processArrayValidationResults', () => {
    it('generates an array of error generation functions if validation has not passed', () => {
      const errorFunction = (arg) => () => 'an error'
      const validationResult = {
        isValid: false,
        generateError: errorFunction,
        path: 'a path'
      }

      const [result] = processArrayValidationResults([validationResult])

      expect(result).toBeInstanceOf(Function)
    })

    it('generates an array of undefined if validation has passed', () => {
      const errorFunction = (arg) => () => 'an error'
      const validationResult = {
        isValid: true,
        generateError: errorFunction,
        path: 'a path'
      }

      const [result] = processArrayValidationResults([validationResult])

      expect(result).toBeUndefined()
    })
  })

  describe('processSingleFieldValidationResult', () => {
    it('returns an error generation functions if validation has not passed', () => {
      const errorFunction = (arg) => () => 'an error'
      const validationResult = false
      const path = 'a path'

      const result = processSingleFieldValidationResult(
        validationResult,
        errorFunction,
        path
      )

      expect(result).toBeInstanceOf(Function)
    })

    it('generates an array of undefined if validation has passed', () => {
      const errorFunction = (arg) => () => 'an error'
      const validationResult = true
      const path = 'a path'

      const result = processSingleFieldValidationResult(
        validationResult,
        errorFunction,
        path
      )

      expect(result).toBeUndefined()
    })
  })

  describe('validate', () => {
    it('validates a specific value against a validation object and returns an array of undefineds if all validation passed', () => {
      const value = 'a string'
      const validation = fieldToValidator.string({
        rule: {},
        value,
        path: 'a path'
      })

      const [isString, isEmptyString] = validate(value, validation)

      expect(isString).toBeUndefined()
      expect(isEmptyString).toBeUndefined()
    })

    it('validates a specific value against a validation object and returns an array of error generator functions if all validation did not pass', () => {
      const value = 1
      const validation = fieldToValidator.string({
        rule: {},
        value,
        path: 'a path'
      })

      const [isString, isEmptyString] = validate(value, validation)

      expect(isString).toBeInstanceOf(Function)
      // this will pass because number is not an empty string, but the string error should be enough to
      // indicate that 1 is not valid
      expect(isEmptyString).toBeUndefined()
    })

    it('validates an array against a validation object and returns an array of undefineds if all validation passed', () => {
      const value = ['a location']
      const rule = {
        type: 'array',
        in: 'somewhere',
        name: 'something',
        items: {
          type: 'string'
        }
      }
      const validation = fieldToValidator.array({ rule, value, path: 'a path' })

      const [isArray, [isItemAString, isItemAEmptyString]] = validate(
        value,
        validation
      )

      expect(isArray).toBeUndefined()
      expect(isItemAString).toBeUndefined()
      expect(isItemAEmptyString).toBeUndefined()
    })

    it('validates an array against a validation object and returns an array of error generator functions if all validation did not pass', () => {
      const value = [1]
      const rule = {
        type: 'array',
        in: 'somewhere',
        name: 'something',
        items: {
          type: 'string'
        }
      }
      const validation = fieldToValidator.array({ rule, value, path: 'a path' })

      const [isArray, [isItemAString, isItemAEmptyString]] = validate(
        value,
        validation
      )

      // still an array
      expect(isArray).toBeUndefined()
      expect(isItemAString).toBeInstanceOf(Function)
      // not an empty string
      expect(isItemAEmptyString).toBeUndefined()
    })
  })

  describe('validateQueryParams', () => {
    it('returns an empty array if validation has passed', () => {
      const key = 'aField'
      const data = {
        [key]: 'a value'
      }

      const rules = {
        type: 'string',
        in: 'query',
        name: key
      }

      expect(validateQueryParams(data, rules).length).toBe(0)
    })

    it('returns an array of error generator functions per validation function that failed', () => {
      const key = 'aField'
      const data = {
        [key]: 1
      }

      const rules = {
        type: 'string',
        in: 'query',
        name: key
      }

      // in this case, only isString should fail
      const result = validateQueryParams(data, rules)

      expect(result.length).toBe(1)
      expect(result[0]).toBeInstanceOf(Function)
    })

    it('returns an empty array if there are no data to validate for that rule', () => {
      const key = 'aField'
      const data = {
        superfield: 1
      }

      const rules = {
        type: 'string',
        in: 'query',
        name: key
      }

      // in this case, only isString should fail
      const result = validateQueryParams(data, rules)

      expect(result.length).toBe(0)
    })
  })

  describe('validateBody', () => {
    it('returns empty array if there are no data and no required fields', () => {
      const data = {}
      const rules = {
        schema: {
          properties: {}
        }
      }

      expect(validateBody(data, rules).length).toBe(0)
    })

    it('returns an array of error generator functions if there are no data but required fields', () => {
      const data = {}
      const rules = {
        schema: {
          required: ['field', 'another field']
        }
      }

      const result = validateBody(data, rules)

      expect(result.length).toBe(rules.schema.required.length)
      result.forEach((val) => {
        expect(val).toBeInstanceOf(Function)
      })
    })

    it('returns an array of error generator functions if not all required fields are present in the data set', () => {
      const key = 'a key'
      const data = {
        [key]: 'a value'
      }

      const rules = {
        in: 'body',
        schema: {
          required: [key, 'another_field'],
          properties: {
            [key]: {
              type: 'string'
            },
            another_field: {
              type: 'string'
            }
          }
        }
      }

      const [requiredFieldMissing] = validateBody(data, rules)

      expect(requiredFieldMissing()).toBe(
        'body.another_field is a required field'
      )
    })

    it('returns an array of error generator functions if an unused field is in the body', () => {
      const data = {
        aField: 'a value',
        another_field: 'a value',
        thisIsNotNeeded: 'hello'
      }

      const rules = {
        in: 'body',
        schema: {
          properties: {
            aField: {
              type: 'string'
            },
            another_field: {
              type: 'string'
            }
          }
        }
      }

      const [nonUsedField] = validateBody(data, rules)

      expect(nonUsedField()).toBe(
        'body.thisIsNotNeeded is not relevant for this request'
      )
    })

    it('returns an array of undefineds if all validation pass', () => {
      const data = {
        aField: 'a value',
        another_field: 'a value'
      }

      const rules = {
        in: 'body',
        schema: {
          properties: {
            aField: {
              type: 'string'
            },
            another_field: {
              type: 'string'
            }
          }
        }
      }

      validateBody(data, rules).forEach((error) => {
        expect(error).toBeUndefined()
      })
    })

    it('returns an array of error generator functions for each failed validation', () => {
      const data = {
        aField: 1,
        another_field: 'a value'
      }

      const rules = {
        in: 'body',
        schema: {
          properties: {
            aField: {
              type: 'string'
            },
            another_field: {
              type: 'string'
            }
          }
        }
      }

      const [isString] = validateBody(data, rules)

      expect(isString()).toBe('body.aField is not a valid string')
    })
  })

  describe('validateRequest', () => {
    describe('body', () => {
      it('return an empty array if no validation has failed', () => {
        const request = {
          body: {
            aField: 'a value',
            another_field: 'a value'
          }
        }

        const rule = {
          in: 'body',
          schema: {
            properties: {
              aField: {
                type: 'string'
              },
              another_field: {
                type: 'string'
              }
            }
          }
        }

        expect(validateRequest(request, [rule]).length).toBe(0)
      })

      it('return an array of errors if the validation has failed', () => {
        const request = {
          body: {
            aField: 1,
            another_field: 'a value',
            thisIsUseless: 'a value'
          }
        }

        const rule = {
          in: 'body',
          schema: {
            required: ['aField', 'aRequiredField'],
            properties: {
              aField: {
                type: 'string'
              },
              another_field: {
                type: 'string'
              },
              aRequiredField: {
                type: 'string'
              }
            }
          }
        }

        const [relevantError, requiredError, validationError] = validateRequest(
          request,
          [rule]
        )

        expect(relevantError).toBe(
          'body.thisIsUseless is not relevant for this request'
        )
        expect(requiredError).toBe('body.aRequiredField is a required field')
        expect(validationError).toBe('body.aField is not a valid string')
      })
    })

    describe('query', () => {
      it('return an empty array if no validation has failed', () => {
        const request = {
          query: {
            aField: 'a value',
            another_field: [1, 2]
          }
        }

        const stringRule = {
          in: 'query',
          name: 'aField',
          type: 'string'
        }

        const arrayRule = {
          in: 'query',
          name: 'another_field',
          type: 'array',
          items: {
            type: 'integer'
          }
        }

        expect(validateRequest(request, [stringRule, arrayRule]).length).toBe(0)
      })

      it('return an array of errors if the validation has failed', () => {
        const request = {
          query: {
            aField: 123,
            another_field: ['a string', 2, 'another string']
          }
        }

        const stringRule = {
          in: 'query',
          name: 'aField',
          type: 'string'
        }

        const arrayRule = {
          in: 'query',
          name: 'another_field',
          type: 'array',
          items: {
            type: 'integer'
          }
        }

        const [isStringError, firstItemInvalid, thirdItemInvalid] =
          validateRequest(request, [stringRule, arrayRule])

        expect(isStringError).toBe('query.aField is not a valid string')
        expect(firstItemInvalid).toBe(
          'query.another_field[0] is not a valid number'
        )
        expect(thirdItemInvalid).toBe(
          'query.another_field[2] is not a valid number'
        )
      })
    })
  })

  describe('generateInvalidNumberError', () => {
    it('it is a curried function that returns the error after passing the location', () => {
      const location = 'a location'

      const error = generateInvalidNumberError(location)
      expect(error).toBeInstanceOf(Function)

      const errorMessage = error()
      expect(errorMessage).not.toBeInstanceOf(Function)
      expect(errorMessage).toBe(`${location} is not a valid number`)
    })
  })

  describe('generateInvalidStringError', () => {
    it('it is a curried function that returns the error after passing the location', () => {
      const location = 'a location'

      const error = generateInvalidStringError(location)
      expect(error).toBeInstanceOf(Function)

      const errorMessage = error()
      expect(errorMessage).not.toBeInstanceOf(Function)
      expect(errorMessage).toBe(`${location} is not a valid string`)
    })
  })

  describe('generateEmptyStringError', () => {
    it('it is a curried function that returns the error after passing the location', () => {
      const location = 'a location'

      const error = generateEmptyStringError(location)
      expect(error).toBeInstanceOf(Function)

      const errorMessage = error()
      expect(errorMessage).not.toBeInstanceOf(Function)
      expect(errorMessage).toBe(`${location} must be non empty`)
    })
  })

  describe('generateInvalidArrayError', () => {
    it('it is a curried function that returns the error after passing the location', () => {
      const location = 'a location'

      const error = generateInvalidArrayError(location)
      expect(error).toBeInstanceOf(Function)

      const errorMessage = error()
      expect(errorMessage).not.toBeInstanceOf(Function)
      expect(errorMessage).toBe(`${location} is not a valid array`)
    })
  })

  describe('generateRequiredFieldsError', () => {
    it('it is a curried function that returns the error after passing the location', () => {
      const location = 'a location'

      const error = generateRequiredFieldsError(location)
      expect(error).toBeInstanceOf(Function)

      const errorMessage = error()
      expect(errorMessage).not.toBeInstanceOf(Function)
      expect(errorMessage).toBe(`${location} is a required field`)
    })
  })

  describe('generateNonRelevantFieldsError', () => {
    it('it is a curried function that returns the error after passing the location', () => {
      const location = 'a location'

      const error = generateNonRelevantFieldsError(location)
      expect(error).toBeInstanceOf(Function)

      const errorMessage = error()
      expect(errorMessage).not.toBeInstanceOf(Function)
      expect(errorMessage).toBe(`${location} is not relevant for this request`)
    })
  })
})
