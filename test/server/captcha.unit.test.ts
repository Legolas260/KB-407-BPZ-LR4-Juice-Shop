/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { captchas } from '../../routes/captcha'
import { CaptchaModel } from '../../models/captcha'

void it('calculates all generated CAPTCHA expressions with arithmetic precedence', async () => {
  const operators = ['*', '+', '-']
  const build = mock.method(CaptchaModel, 'build', () => ({ save: async () => {} }))
  const random = mock.method(Math, 'random')
  try {
    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        for (let c = 1; c <= 10; c++) {
          for (let first = 0; first < 3; first++) {
            for (let second = 0; second < 3; second++) {
              const values = [(a - 0.5) / 10, (b - 0.5) / 10, (c - 0.5) / 10, (first + 0.5) / 3, (second + 0.5) / 3]
              random.mock.mockImplementation(() => values.shift()!)
              const expression = `${a}${operators[first]}${b}${operators[second]}${c}`
              const expected = expression.match(/[+-]?[^+-]+/g)!
                .map(term => term.split('*').map(Number).reduce((x, y) => x * y))
                .reduce((x, y) => x + y)
              const req: any = { app: { locals: { captchaId: 1 } } }
              const res: any = { json: mock.fn() }
              await captchas()(req, res)
              assert.equal(res.json.mock.calls[0].arguments[0].captcha, expression)
              assert.equal(res.json.mock.calls[0].arguments[0].answer, String(expected), expression)
              random.mock.resetCalls()
              build.mock.resetCalls()
            }
          }
        }
      }
    }
  } finally {
    random.mock.restore()
    build.mock.restore()
  }
})
