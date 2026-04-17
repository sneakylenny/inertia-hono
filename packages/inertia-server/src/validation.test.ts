import type { StandardSchemaV1 } from '@standard-schema/spec'
import { describe, expect, it } from 'vitest'
import { issueDotPath, toInertiaErrors } from './validation.js'

function issue(
  message: string,
  path?: StandardSchemaV1.Issue['path'],
): StandardSchemaV1.Issue {
  return { message, path }
}

describe('issueDotPath', () => {
  it('returns empty string for missing or empty path', () => {
    expect(issueDotPath(issue('x'))).toBe('')
    expect(issueDotPath(issue('x', []))).toBe('')
  })

  it('joins string segments with dots', () => {
    expect(issueDotPath(issue('x', ['user', 'name']))).toBe('user.name')
  })

  it('supports PathSegment objects', () => {
    expect(
      issueDotPath(issue('x', [{ key: 'user' }, { key: 'email' }])),
    ).toBe('user.email')
  })

  it('renders array indexes as numeric dot segments', () => {
    expect(issueDotPath(issue('x', ['items', 0, 'name']))).toBe('items.0.name')
    expect(
      issueDotPath(issue('x', [{ key: 'items' }, { key: 1 }, { key: 'name' }])),
    ).toBe('items.1.name')
  })

  it('mixes raw keys and PathSegment objects', () => {
    expect(issueDotPath(issue('x', ['a', { key: 'b' }, 2]))).toBe('a.b.2')
  })

  it('uses symbol descriptions when the key is a symbol', () => {
    const sym = Symbol('hidden')
    expect(issueDotPath(issue('x', [{ key: sym }]))).toBe('hidden')
  })
})

describe('toInertiaErrors', () => {
  it('maps field-level issues to dotted keys', () => {
    const errors = toInertiaErrors([
      issue('Name is required', ['name']),
      issue('Street is required', ['address', 'street']),
    ])
    expect(errors).toEqual({
      'name': 'Name is required',
      'address.street': 'Street is required',
    })
  })

  it('keeps the first message per path (later duplicates are ignored)', () => {
    const errors = toInertiaErrors([
      issue('first', ['name']),
      issue('second', ['name']),
    ])
    expect(errors).toEqual({ name: 'first' })
  })

  it('drops pathless issues when any field-level issue exists', () => {
    const errors = toInertiaErrors([
      issue('Top-level failure'),
      issue('Name is required', ['name']),
    ])
    expect(errors).toEqual({ name: 'Name is required' })
  })

  it('returns a fallback entry when every issue is pathless', () => {
    const errors = toInertiaErrors([issue('Invalid JSON body')])
    expect(errors).toEqual({ form: 'Invalid JSON body' })
  })

  it('honors fallbackKey and fallbackMessage options', () => {
    const errors = toInertiaErrors([issue('')], {
      fallbackKey: 'text',
      fallbackMessage: 'Please provide a value.',
    })
    expect(errors).toEqual({ text: '' })

    const fallback = toInertiaErrors([], { fallbackKey: 'text' })
    expect(fallback).toEqual({})
  })

  it('renders array index paths via dot notation', () => {
    const errors = toInertiaErrors([
      issue('Email is required', ['users', 0, 'email']),
      issue('Email is invalid', [{ key: 'users' }, { key: 1 }, { key: 'email' }]),
    ])
    expect(errors).toEqual({
      'users.0.email': 'Email is required',
      'users.1.email': 'Email is invalid',
    })
  })

  it('returns an empty object when there are no issues', () => {
    expect(toInertiaErrors([])).toEqual({})
  })
})
