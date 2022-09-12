const mocks = {
  req: {},
  res: {
    status: jest.fn(),
    send: jest.fn()
  },
  next: jest.fn(),
}

import { readFile } from './utils'
import { validateRequest } from './validationUtils'

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  readFile: jest.fn()
}))

jest.mock('./validationUtils', () => ({
  validateRequest: jest.fn()
}))

jest.mock('express', () => ({
  req: mocks.req,
  res: mocks.res,
  next: mocks.next
}))

import { checkAgainstRules } from './express'

describe('checkAgainstRules', () => {
  beforeEach(() => {
    mocks.res.status.mockReturnValue(mocks.res)
  })

  afterEach(() => {
    mocks.res.status.mockClear()
    mocks.res.send.mockClear()
  })

  it('return 500 and an error message if reading the file throws', async () => {
    readFile.mockImplementationOnce(() => { throw new Error('an error') })

    await checkAgainstRules(mocks.req, mocks.res, mocks.next)

    expect(mocks.res.status).toHaveBeenCalledWith(500)
    expect(mocks.res.send).toHaveBeenCalledWith('There was a problem validating the request')
    expect(mocks.next).not.toHaveBeenCalled()
  })

  it('returns 400 and all the validation errors to the client', async () => {
    readFile.mockResolvedValueOnce({
      '/api/account/role': {
        get: {}
      }
    })

    const errors = [
      'an error', 'another error'
    ]

    validateRequest.mockReturnValueOnce(errors)

    mocks.req.baseUrl = '/api/account'
    mocks.req.path = '/role'
    mocks.req.method = 'GET'

    await checkAgainstRules(mocks.req, mocks.res, mocks.next)

    expect(mocks.res.status).toHaveBeenCalledWith(400)
    expect(mocks.res.send).toHaveBeenCalledWith({ errors })
    expect(mocks.next).not.toHaveBeenCalled()
  })

  it('calls next and continues the request', async () => {
    readFile.mockResolvedValueOnce({
      '/api/account/role': {
        get: {}
      }
    })

    validateRequest.mockReturnValueOnce([])

    await checkAgainstRules(mocks.req, mocks.res, mocks.next)

    expect(mocks.next).toHaveBeenCalled()
  })
})