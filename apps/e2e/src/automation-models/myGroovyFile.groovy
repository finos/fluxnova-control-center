#!/usr/bin/env groovy

/**
 * Groovy Syntax Highlighting Test File
 * This file demonstrates various Groovy syntax elements
 * @author Test User
 * @version 1.0.0
 */

// Package and imports
package com.example.test

import groovy.transform.CompileStatic
import groovy.transform.TypeChecked
import groovy.json.JsonSlurper
import java.util.concurrent.*

// Annotations
@CompileStatic
@TypeChecked
class GroovyExample {

    // Fields with different access modifiers
    private String name
    protected int count = 0
    public static final String CONSTANT = "CONSTANT_VALUE"

    // Properties (automatic getter/setter)
    String description
    boolean enabled = true

    // Constructor
    GroovyExample(String name) {
        this.name = name
    }

    // Method with typed parameters
    String greet(String greeting = "Hello") {
        return "${greeting}, ${name}!"
    }

    // Method with closure parameter
    def processItems(List items, Closure processor) {
        items.collect { item ->
            processor(item)
        }
    }
}

// Script-level code (Groovy allows code outside classes)

// GString (interpolated strings)
def userName = "John Doe"
def age = 30
def message = "User ${userName} is ${age} years old"
def multiline = """
    This is a multiline
    string with ${userName}
    and ${age}
"""

// Slashy strings (alternative string syntax, good for regex)
def pattern = /\d{3}-\d{3}-\d{4}/
def path = /C:\Users\Documents\file.txt/

// Lists and ranges
def list = [1, 2, 3, 4, 5]
def range = 1..10
def exclusiveRange = 1..<10
def stringList = ['apple', 'banana', 'cherry']

// Maps
def person = [
    firstName: 'Jane',
    lastName: 'Smith',
    age: 25,
    'full-name': 'Jane Smith'  // Keys with special characters
]

// Accessing map properties
println person.firstName
println person['full-name']

// Closures with different syntaxes
def simpleClosure = { it * 2 }
def multiParamClosure = { a, b -> a + b }
def closureWithDefaults = { x, y = 10 -> x + y }

// Closure with explicit parameter
def squared = list.collect { num ->
    num ** 2  // Power operator
}

// Control structures
if (age > 18) {
    println "Adult"
} else if (age > 13) {
    println "Teenager"
} else {
    println "Child"
}

// Switch with multiple types
switch (userName) {
    case "John Doe":
        println "Found John"
        break
    case ~/Jane.*/:  // Regex pattern matching
        println "Found Jane"
        break
    case { it.length() > 5 }:  // Closure condition
        println "Long name"
        break
    default:
        println "Unknown"
}

// Safe navigation operator
def result = person?.address?.street  // Won't throw NPE

// Elvis operator
def displayName = person.nickname ?: person.firstName

// Spread operator
def numbers = [1, 2, 3]
def moreNumbers = [0, *numbers, 4, 5]

// Spread-dot operator
def names = [
    [firstName: 'John', lastName: 'Doe'],
    [firstName: 'Jane', lastName: 'Smith']
]
def firstNames = names*.firstName

// Method reference operator
def methods = ['toLowerCase', 'toUpperCase']
def transformer = String.&toUpperCase

// Loops
for (i in 1..5) {
    println i
}

list.each { item ->
    println item
}

list.eachWithIndex { item, idx ->
    println "${idx}: ${item}"
}

while (count < 5) {
    count++
}

// Regular expressions
def text = "The price is 29.99"
def matcher = text =~ /\d+\.\d+/  // Find operator
def exactMatch = text ==~ /The.*\d+\.\d+/  // Match operator

if (matcher) {
    println "Found: ${matcher[0]}"
}

// Exception handling
try {
    def value = 10 / 0
} catch (ArithmeticException e) {
    println "Arithmetic error: ${e.message}"
} catch (Exception e) {
    println "General error: ${e.message}"
} finally {
    println "Cleanup"
}

// Trait definition
trait Auditable {
    String createdBy
    Date createdDate

    void audit(String user) {
        this.createdBy = user
        this.createdDate = new Date()
    }
}

// Class with trait
class Document implements Auditable {
    String title
    String content
}

// Annotation definition
@interface CustomAnnotation {
    String value() default ""
    int priority() default 0
}

// Using custom annotation
@CustomAnnotation(value = "test", priority = 1)
class AnnotatedClass {
    // Class body
}

// Groovy's built-in DSL capabilities
def builder = new groovy.json.JsonBuilder()
builder {
    name userName
    age age
    address {
        street "123 Main St"
        city "New York"
        zipCode "10001"
    }
    hobbies(['reading', 'coding', 'gaming'])
}

// File operations (Groovy style)
def file = new File('example.txt')
// file.text = "Some content"  // Write
// def content = file.text      // Read

// Collection operations with functional style
def filtered = list.findAll { it > 2 }
def summed = list.sum()
def grouped = list.groupBy { it % 2 == 0 ? 'even' : 'odd' }

// Method with named parameters (using map)
def createUser(Map params) {
    println "Creating user: ${params.name}, email: ${params.email}"
}

createUser(name: 'Bob', email: 'bob@example.com')

// Metaprogramming - adding methods at runtime
String.metaClass.shout = { ->
    delegate.toUpperCase() + "!!!"
}

// Now all strings have this method
// println "hello".shout()  // HELLO!!!

// Category usage
use(TimeCategory) {
    def tomorrow = 1.day.from.now
    def nextWeek = 7.days.from.now
}

// Command chain syntax (no parentheses needed)
// show user details   // Instead of show(user).details()

// Numbers in different formats
def integer = 42
def longNumber = 42L
def bigInteger = 42G
def floatingPoint = 3.14
def doubleNumber = 3.14d
def bigDecimal = 3.14g
def hexNumber = 0xFF
def octalNumber = 077
def binaryNumber = 0b1010

// Boolean values
def trueValue = true
def falseValue = false

// Null value
def nullValue = null

// Comments
/* Multi-line comment
   with multiple lines
   for testing syntax highlighting */
// Single-line comment

// GroovyDoc comment
/**
 * Calculate factorial
 * @param n The number
 * @return The factorial
 */
def factorial(int n) {
    n <= 1 ? 1 : n * factorial(n - 1)
}

// Script assert
assert 1 + 1 == 2
assert [1, 2, 3].size() == 3

// Return statement (optional in Groovy)
def multiply(a, b) {
    a * b  // Implicit return
}

println "Groovy syntax highlighting test complete!"

