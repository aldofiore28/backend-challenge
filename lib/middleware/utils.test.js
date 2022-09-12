const mocks = {
  httpVerbs: ['GET', 'POST', 'POST', 'PUT', 'DELETE']
}

jest.mock('fs', () => ({
  __esModule: true,
  default: {
    readFile: jest.fn().mockResolvedValue("{\"paths\":\"a path\"}")
  }
}))

jest.mock('util', () => ({
  __esModule: true,
  default: {
    promisify: jest.fn((fn) => async () => fn())
  }
}))

import {
  isEmpty,
  isNil,
  removeHttpVerbFromRules,
  spiltArray,
  and,
  not,
  readFile,
  isFunction
} from './utils'

describe('middleware > express', () => {
  describe('isEmpty', () => {
    it("returns true only for 'empty' object and array", () => {
      ;[[], {}, undefined, null, '', NaN].forEach((value) => {
        expect(isEmpty(value)).toBe(true)
      })
    })

    it('returns false for truthy value', () => {
      ;[1, 'a string', [1, 2, 3], { a: 1 }].forEach((value) => {
        expect(isEmpty(value)).toBe(false)
      })
    })
  })

  describe('isNil', () => {
    it('returns true only for explicit and unexplicit nil', () => {
      ;[undefined, null].forEach((value) => {
        expect(isNil(value)).toBe(true)
      })
    })

    it('returns false for any other value', () => {
      [[], {}, 1, 'a string', [1, 2, 3], { a: 1 }, '', NaN].forEach(
        (value) => {
          expect(isNil(value)).toBe(false)
        }
      )
    })
  })

  describe('isFunction', () => {
    it('returns true if a function is passed in', () => {
      expect(isFunction(() => 1)).toBe(true)
    })

    it('returns false for any other value', () => {
      [[], {}, 1, 'a string', [1, 2, 3], { a: 1 }, '', NaN, null, undefined].forEach(
        (value) => {
          expect(isFunction(value)).toBe(false)
        }
      )
    })
  })

  describe('removeHttpVerbFromRules', () => {
    const rules = {
      aRule: true
    }

    mocks.httpVerbs.forEach((verb) => {
      it(`returns the rules with the ${verb} as the key`, () => {
        const rulesWithVerbWrapper = {
          [verb.toLocaleLowerCase()]: rules
        }

        expect(
          removeHttpVerbFromRules(rulesWithVerbWrapper, verb)
        ).toStrictEqual(rules)
      })
    })

    it('returns {} if rules are an invalid input', () => {
      expect(removeHttpVerbFromRules({}, 'GET')).toStrictEqual({})
      expect(removeHttpVerbFromRules(undefined, 'GET')).toStrictEqual({})
    })

    it('returns {} if no method can be matched with the one wrapping the rules', () => {
      const rulesWithVerbWrapper = {
        get: rules
      }

      expect(removeHttpVerbFromRules(rulesWithVerbWrapper, '')).toStrictEqual(
        {}
      )
      expect(
        removeHttpVerbFromRules(rulesWithVerbWrapper, undefined)
      ).toStrictEqual({})
    })
  })

  describe('readFile', () => {
    it('reads the file contents and returns only the paths object', async () => {
      const fileName = 'a file name'

      const result = await readFile(fileName)

      expect(result).toStrictEqual('a path')
    })
  })

  describe('splitArray', () => {
    it('will split an array into an array with 2 arrays based on a predicate function', () => {
      const array = [1, 2, 3, 4, 5, 6]
      const predicate = (elem) => elem <= 3

      const [pass, fail] = spiltArray(array, predicate)
      expect(pass).toStrictEqual([1, 2, 3])
      expect(fail).toStrictEqual([4, 5, 6])
    })

    it('all items can pass the predicate', () => {
      const array = [1, 2, 3, 4, 5, 6]
      const predicate = (elem) => elem < 300

      const [pass, fail] = spiltArray(array, predicate)
      expect(pass).toStrictEqual([1, 2, 3, 4, 5, 6])
      expect(fail).toStrictEqual([])
    })

    it('all items can fail the predicate', () => {
      const array = [1, 2, 3, 4, 5, 6]
      const predicate = (elem) => elem < -300

      const [pass, fail] = spiltArray(array, predicate)
      expect(pass).toStrictEqual([])
      expect(fail).toStrictEqual([1, 2, 3, 4, 5, 6])
    })

    it('returns 2 empty array if an empty array is passed', () => {
      const array = []
      const predicate = (elem) => elem < -300

      const [pass, fail] = spiltArray(array, predicate)
      expect(pass).toStrictEqual([])
      expect(fail).toStrictEqual([])
    })
  })

  describe('and', () => {
    it('returns true if all the predicates return true', () => {
      const predicate1 = (number) => number > 3
      const predicate2 = (number) => number > 4
      const predicate3 = (number) => number > 5
      const result = and([predicate1, predicate2, predicate3])

      expect(result(10)).toBe(true)
    })

    it('returns false if any of the predicates return false', () => {
      const predicate1 = (number) => number > 3
      const predicate2 = (number) => number > 12
      const predicate3 = (number) => number > 5
      const result = and([predicate1, predicate2, predicate3])

      expect(result(10)).toBe(false)
    })

    it('returns true by default', () => {
      const result = and([])

      expect(result(10)).toBe(true)
    })
  })

  describe('not', () => {
    it('negates a predicate', () => {
      const predicate = (number) => number > 3
      expect(predicate(4)).toBe(true)
      const negatedPredicate = not(predicate)
      expect(negatedPredicate(4)).toBe(false)
    })
  })
})
