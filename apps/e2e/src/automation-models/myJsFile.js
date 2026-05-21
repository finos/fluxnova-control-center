/**
 * JavaScript Syntax Highlighting Test File
 * This file demonstrates various JS syntax elements
 * @author Test User
 * @version 1.0.0
 */

// Import statements
import { Component } from 'react';
import * as utils from './utils';
import defaultExport, { namedExport } from 'module';

// Constants and variables with different types
const API_URL = 'https://api.example.com';
const MAX_RETRIES = 3;
let counter = 0;
var legacy = 'old style';

// Template literals
const greeting = `Hello, ${API_URL}!`;
const multiline = `
  This is a
  multiline string
  with ${MAX_RETRIES} retries
`;

// Regular expressions
const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const urlPattern = /https?:\/\/[^\s]+/g;

// Object literal with various property types
const config = {
  name: 'TestApp',
  version: 1.5,
  enabled: true,
  items: [1, 2, 3, 4, 5],
  nested: {
    property: 'value',
    number: 42,
  },
  // Method shorthand
  start() {
    console.log('Starting...');
  },
  // Arrow function property
  stop: () => console.log('Stopping...'),
  // Computed property
  ['dynamic' + 'Key']: 'dynamic value',
};

// Class declaration with extends and super
class BaseClass {
  constructor(name) {
    this.name = name;
    this._private = 'private field';
  }

  // Getter and setter
  get displayName() {
    return this.name.toUpperCase();
  }

  set displayName(value) {
    this.name = value;
  }

  // Static method
  static create(name) {
    return new BaseClass(name);
  }
}

// Extended class with inheritance
class ExtendedClass extends BaseClass {
  #privateField = 'truly private';

  constructor(name, type) {
    super(name);
    this.type = type;
  }

  // Async method
  async fetchData(id) {
    try {
      const response = await fetch(`${API_URL}/data/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw new Error(`Failed to fetch: ${error.message}`);
    }
  }
}

// Generator function
function* generateSequence(start, end) {
  for (let i = start; i <= end; i++) {
    yield i;
  }
}

// Arrow functions with different syntaxes
const simple = (x) => x * 2;
const multiParam = (a, b) => a + b;
const block = (x) => {
  const result = x * 2;
  return result + 1;
};

// Async/await and Promises
async function processData(items) {
  const promises = items.map(async (item) => {
    return await transformItem(item);
  });

  return Promise.all(promises)
    .then((results) => results.filter((r) => r !== null))
    .catch((err) => {
      console.warn('Processing failed:', err);
      return [];
    });
}

// Destructuring examples
const { name, version, ...rest } = config;
const [first, second, ...remaining] = [1, 2, 3, 4, 5];

// Spread operator
const merged = { ...config, ...rest };
const combined = [...remaining, 6, 7, 8];

// Control flow statements
function controlFlow(value) {
  if (value > 10) {
    return 'high';
  } else if (value > 5) {
    return 'medium';
  } else {
    return 'low';
  }
}

// Switch statement
function switchTest(type) {
  switch (type) {
    case 'start':
      console.log('Starting');
      break;
    case 'stop':
      console.log('Stopping');
      break;
    default:
      console.log('Unknown');
  }
}

// Loops
for (let i = 0; i < 10; i++) {
  console.log(i);
}

for (const item of combined) {
  console.log(item);
}

for (const key in config) {
  console.log(key, config[key]);
}

while (counter < 5) {
  counter++;
}

do {
  counter--;
} while (counter > 0);

// Ternary operator and logical operators
const status = counter > 0 ? 'active' : 'inactive';
const result = (config.enabled && config.version > 1.0) || false;
const fallback = config.missing ?? 'default value';

// Tagged template literal
function highlight(strings, ...values) {
  return strings.reduce((acc, str, i) => {
    return acc + str + (values[i] || '');
  }, '');
}

const tagged = highlight`Value: ${counter}, Status: ${status}`;

// Export statements
export { config, BaseClass };
export default ExtendedClass;
export const exportedFunction = () => 'exported';

// Numbers in different formats
const decimal = 123.456;
const hex = 0xff;
const octal = 0o77;
const binary = 0b1010;
const exponential = 1.23e-4;
const bigInt = 9007199254740991n;

// Special values
const nullValue = null;
const undefinedValue = undefined;
const nanValue = NaN;
const infinity = Infinity;

// Comments
/* Multi-line comment
   with multiple lines
   for testing */
// Single-line comment

// JSDoc comment with types
/**
 * Calculate the sum of two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The sum
 */
function sum(a, b) {
  return a + b;
}
