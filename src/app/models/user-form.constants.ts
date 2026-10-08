export const USER_FORM_CONSTANTS = {
  // Patterns
  PHONE_PATTERN: '[0-9]{10}',
  PASSWORD_PATTERN: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$',
  ALPHANUMERIC_SPACE_PATTERN: '^[a-zA-Z0-9 ]+$',

  // Roles
  ROLES: {
    ORGANISATION_ADMIN: 'ORGANISATION-ADMIN',
    ACCOUNT_ADMIN: 'ACCOUNT-ADMIN',
    BRANCH_ADMIN: 'BRANCH-ADMIN',
    CLIENT: 'CLIENT',
    FINANCE_ADMIN: 'FINANCE-ADMIN',
  },

  // Status
  STATUS: {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
  },

  // Routes
  ROUTES: {
    DASHBOARD: 'doqfy/dashboard',
    USER_LISTING: '/doqfy/management/user-listing',
  },

  // Messages
  MESSAGES: {
    SUCCESS: {
      USER_CREATED: 'User created!',
      USER_UPDATED: 'User Details updated successfully!',
      USER_EDITED: 'User Edited successfully.',
      USERS_CREATED: 'Users created!',
    },
    ERROR: {
      USER_CREATION_FAILED: 'User creation failed!',
      ERROR: 'Error',
      UNEXPECTED_RESPONSE: 'Unexpected response format from server.',
    },
    WARNING: {
      NEW_USER: 'New user',
      FILL_DETAILS: 'Please fill user details before adding New',
      CANNOT_REMOVE: 'Cannot Remove',
      MIN_ONE_ACCOUNT_BRANCH: 'At least one account-branch pair is required.',
      INVALID_DETAILS: 'Invalid Details!',
      ENTER_VALID_DETAILS: 'Kindly enter the valid details.',
    },
  },

  // Form Field Names
  FORM_FIELDS: {
    FIRST_NAME: 'firstName',
    LAST_NAME: 'lastName',
    EMAIL: 'email',
    CONTACT: 'contact',
    ROLE: 'role',
    STATUS: 'status',
    BRANCH: 'branch',
    ACCOUNT: 'account',
    PASSWORD: 'password',
    CPASSWORD: 'cpassword',
    ACCOUNT_BRANCH_ARRAY: 'accountBranchArray',
    ADD_NEW_USER_DETAILS: 'addnewUserDetails',
  },

  // Validation Lengths
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 8,
    CONTACT_LENGTH: 10,
    MIN_CONTACT_LENGTH: 10,
    MAX_CONTACT_LENGTH: 10,
  },

  // Key Codes
  KEY_CODES: {
    BACKSPACE: 8,
    HYPHEN: 45,
  },

  // Timing
  TIMING: {
    REDIRECT_DELAY: 2000,
  },
};
