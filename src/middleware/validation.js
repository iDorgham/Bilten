const { body, query, param, validationResult } = require('express-validator');

/**
 * Middleware to validate recommendation requests
 */
const validateRecommendationRequest = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('includeTrending')
    .optional()
    .isBoolean()
    .withMessage('includeTrending must be a boolean'),
  query('includeSimilar')
    .optional()
    .isBoolean()
    .withMessage('includeSimilar must be a boolean'),
  query('includePopular')
    .optional()
    .isBoolean()
    .withMessage('includePopular must be a boolean'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Middleware to validate recommendation interaction
 */
const validateRecommendationInteraction = [
  body('eventId')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer'),
  body('action')
    .isIn(['view', 'click', 'purchase', 'wishlist', 'share'])
    .withMessage('Action must be one of: view, click, purchase, wishlist, share'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Middleware to validate event ID parameter
 */
const validateEventId = [
  param('eventId')
    .isInt({ min: 1 })
    .withMessage('Event ID must be a positive integer'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Middleware to validate search parameters
 */
const validateSearchParams = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  query('location')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Location must be between 1 and 100 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Middleware to validate user preferences update
 */
const validateUserPreferences = [
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
  body('categories.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each category must be between 1 and 50 characters'),
  body('priceRange')
    .optional()
    .isObject()
    .withMessage('Price range must be an object'),
  body('priceRange.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  body('priceRange.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  body('locations')
    .optional()
    .isArray()
    .withMessage('Locations must be an array'),
  body('locations.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each location must be between 1 and 100 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Generic validation middleware
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  };
};

module.exports = {
  validateRecommendationRequest,
  validateRecommendationInteraction,
  validateEventId,
  validateSearchParams,
  validateUserPreferences,
  validate
};
