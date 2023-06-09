import { euroValue, getCustomerFullname, getCustomerStreet, getParseableDate } from './utils';

import { Order } from 'um-types';

describe('euroValue', () => {
  test('undefined', () => {
    expect(euroValue(undefined)).toBe('');
  });

  test('empty string', () => {
    expect(euroValue('')).toBe('');
  });

  test('integer', () => {
    expect(euroValue('12')).toBe('12,00\xa0€');
    expect(euroValue(1295)).toBe('1.295,00\xa0€');
  });

  test('float', () => {
    expect(euroValue('12,24')).toBe('12,24\xa0€');
    expect(euroValue(1295.99)).toBe('1.295,99\xa0€');
  });
});

describe('getParseableDate', () => {
  test('undefined', () => {
    expect(getParseableDate(undefined)).toBe('');
  });
  test('print-format', () => {
    expect(getParseableDate('10.12.2022')).toBe('2022-12-10');
  });
  test('already parseable', () => {
    expect(getParseableDate('2022-12-10')).toBe('2022-12-10');
  });
});

describe('getCustomerFullname', () => {
  test('null', () => {
    expect(getCustomerFullname(null)).toBe('');
  });

  test('customer full', () => {
    expect(
      getCustomerFullname({ customer: { firstName: 'Max', lastName: 'Meier', salutation: 'Herr' } } as Order),
    ).toBe('Herr Max Meier');
  });
});

describe('getCustomerStreet', () => {
  test('empty', () => {
    expect(getCustomerStreet(null)).toBe('');
    expect(getCustomerStreet({} as Order)).toBe('');
    expect(getCustomerStreet({ to: {} } as Order)).toBe('');
  });

  test('no comma', () => {
    expect(getCustomerStreet({ to: { address: 'Street 2' } } as Order)).toBe('Street 2');
  });

  test('has street', () => {
    expect(getCustomerStreet({ to: { address: 'Street 2, 80804 Muenchen' } } as Order)).toBe('Street 2');
  });

  test('has street, with country', () => {
    expect(getCustomerStreet({ to: { address: 'Street 2, 80804 Muenchen, Deutschland' } } as Order)).toBe('Street 2');
  });
});
