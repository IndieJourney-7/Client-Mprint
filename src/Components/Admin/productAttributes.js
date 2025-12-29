// productAttributes.js - Product Attribute Templates
// This file defines pre-configured attribute templates for different product categories
// Each template contains options with id, name, and price structure

/**
 * Attribute Templates by Category
 * Structure: { categorySlug: { attributeName: [options] } }
 * Each option has: { id, name, price } or { quantity, price, unitPrice }
 */
export const attributeTemplates = {
  'visiting-cards': {
    delivery_speed: [
      { id: 'standard', name: 'Standard', price: 0 },
      { id: 'same-day', name: 'Same Day Delivery - Mumbai, Bengaluru, Hyderabad & Kolkata', price: 100 }
    ],
    shape: [
      { id: 'rectangle', name: 'Rectangle', price: 0 },
      { id: 'square', name: 'Square', price: 10 },
      { id: 'rounded', name: 'Rounded Corners', price: 15 },
      { id: 'oval', name: 'Oval', price: 20 }
    ],
    size: [
      { id: '5.08x8.89', name: '5.08 cm × 8.89 cm (Standard)', price: 0 },
      { id: '7.62x10.16', name: '7.62 cm × 10.16 cm (Large)', price: 30 },
      { id: 'custom', name: 'Custom Size', price: 50 }
    ],
    material: [
      { id: 'white-paper', name: 'White Paper', price: 0 },
      { id: 'premium-paper', name: 'Premium Paper', price: 20 },
      { id: 'plastic', name: 'Plastic', price: 40 },
      { id: 'silver-foil', name: 'Silver Foil', price: 80 },
      { id: 'gold-foil', name: 'Gold Foil', price: 100 }
    ],
    quantity: [
      { quantity: 6, price: 60, unitPrice: 10.00 },
      { quantity: 8, price: 72, unitPrice: 9.00 },
      { quantity: 10, price: 80, unitPrice: 8.00 },
      { quantity: 12, price: 90, unitPrice: 7.50 },
      { quantity: 24, price: 160, unitPrice: 6.67 },
      { quantity: 50, price: 300, unitPrice: 6.00 },
      { quantity: 100, price: 500, unitPrice: 5.00 }
    ]
  },
  't-shirts': {
    delivery_speed: [
      { id: 'standard', name: 'Standard', price: 0 },
      { id: 'express', name: 'Express Delivery', price: 50 }
    ],
    size: [
      { id: 's', name: 'Small', price: 0 },
      { id: 'm', name: 'Medium', price: 0 },
      { id: 'l', name: 'Large', price: 0 },
      { id: 'xl', name: 'XL', price: 20 },
      { id: 'xxl', name: 'XXL', price: 40 }
    ],
    color: [
      { id: 'black', name: 'Black', value: '#000000', price: 0 },
      { id: 'white', name: 'White', value: '#FFFFFF', price: 0 },
      { id: 'red', name: 'Red', value: '#EF4444', price: 0 },
      { id: 'blue', name: 'Blue', value: '#3B82F6', price: 0 }
    ],
    quantity: [
      { quantity: 1, price: 299, unitPrice: 299 },
      { quantity: 5, price: 1250, unitPrice: 250 },
      { quantity: 10, price: 2200, unitPrice: 220 }
    ]
  },
  // Add more categories here as needed
  'stationery': {
    delivery_speed: [
      { id: 'standard', name: 'Standard', price: 0 },
      { id: 'express', name: 'Express Delivery', price: 50 }
    ],
    size: [
      { id: 'a4', name: 'A4', price: 0 },
      { id: 'a5', name: 'A5', price: 10 },
      { id: 'letter', name: 'Letter Size', price: 15 }
    ],
    material: [
      { id: 'standard-paper', name: 'Standard Paper', price: 0 },
      { id: 'premium-paper', name: 'Premium Paper', price: 20 }
    ],
    quantity: [
      { quantity: 50, price: 250, unitPrice: 5.00 },
      { quantity: 100, price: 400, unitPrice: 4.00 },
      { quantity: 500, price: 1500, unitPrice: 3.00 }
    ]
  }
};

/**
 * Apply attribute template to product via API
 * @param {string|number} productId - Product ID
 * @param {string} categorySlug - Category slug (e.g., 'visiting-cards')
 * @param {string} apiBaseUrl - Base API URL
 * @returns {Promise<Object>} API response
 */
export async function applyAttributeTemplate(productId, categorySlug, apiBaseUrl) {
  const template = attributeTemplates[categorySlug];
  
  if (!template) {
    throw new Error(`No template found for category: ${categorySlug}`);
  }

  try {
    const response = await fetch(`${apiBaseUrl}/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        attributes: template
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update product attributes' }));
      throw new Error(error.message || 'Failed to update product attributes');
    }

    return await response.json();
  } catch (error) {
    console.error('Error applying attribute template:', error);
    throw error;
  }
}

/**
 * Get list of available category slugs
 * @returns {string[]} Array of category slugs
 */
export function getAvailableCategories() {
  return Object.keys(attributeTemplates);
}

/**
 * Check if a category has an attribute template
 * @param {string} categorySlug - Category slug to check
 * @returns {boolean} True if template exists
 */
export function hasTemplate(categorySlug) {
  return attributeTemplates.hasOwnProperty(categorySlug);
}

/**
 * Get template for a specific category
 * @param {string} categorySlug - Category slug
 * @returns {Object|null} Template object or null if not found
 */
export function getTemplate(categorySlug) {
  return attributeTemplates[categorySlug] || null;
}

/**
 * Get attribute options for a specific category and attribute
 * @param {string} categorySlug - Category slug
 * @param {string} attributeName - Attribute name (e.g., 'size', 'color')
 * @returns {Array|null} Array of options or null if not found
 */
export function getAttributeOptions(categorySlug, attributeName) {
  const template = attributeTemplates[categorySlug];
  if (!template) return null;
  return template[attributeName] || null;
}

/**
 * Helper function to safely display attribute value
 * USE THIS when rendering attributes in components!
 * @param {*} value - Attribute value (could be object or string)
 * @returns {string} Safe displayable string
 */
export function getDisplayValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  // If it's an object with a 'name' property, return the name
  if (typeof value === 'object' && value.name) {
    return value.name;
  }
  
  // If it's an object without name, stringify it
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  // Otherwise return as string
  return String(value);
}

/**
 * Helper function to safely get price from attribute
 * @param {*} value - Attribute value
 * @returns {number} Price value
 */
export function getPrice(value) {
  if (value === null || value === undefined) {
    return 0;
  }
  
  if (typeof value === 'object' && value.price !== undefined) {
    return parseFloat(value.price);
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  return 0;
}

// Default export
export default {
  attributeTemplates,
  applyAttributeTemplate,
  getAvailableCategories,
  hasTemplate,
  getTemplate,
  getAttributeOptions,
  getDisplayValue,
  getPrice
};
