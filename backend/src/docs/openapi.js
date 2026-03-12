'use strict'

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Noesis API',
    description:
      'REST API for Noesis — a habit-tracking and journaling application.\n\n' +
      '## Authentication\n' +
      'Protected endpoints require a `Bearer` JWT in the `Authorization` header.\n' +
      'Obtain tokens via `POST /auth/login` or `POST /auth/refresh`.',
    version: '1.0.0'
  },
  servers: [{ url: '/api', description: 'API' }],
  tags: [
    { name: 'System', description: 'Health and status' },
    {
      name: 'Authentication',
      description: 'Register, login, and token management'
    },
    { name: 'Habits', description: 'Habit CRUD and completion tracking' },
    { name: 'Streak', description: 'Streak statistics for a habit' },
    { name: 'Journal', description: 'Personal journal entries' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token issued by `POST /auth/login` or `POST /auth/refresh`.'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Something went wrong' }
        }
      },
      MessageResponse: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      UserSummary: {
        type: 'object',
        description: 'Minimal user object returned with tokens',
        properties: {
          id: { type: 'integer', example: 1 },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          }
        }
      },
      Tokens: {
        type: 'object',
        required: ['accessToken', 'refreshToken'],
        properties: {
          accessToken: {
            type: 'string',
            description: 'Short-lived JWT for API requests'
          },
          refreshToken: {
            type: 'string',
            description: 'Long-lived opaque token for rotation'
          }
        }
      },
      Habit: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          user_id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Morning run' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      HabitWithCompletion: {
        allOf: [
          { $ref: '#/components/schemas/Habit' },
          {
            type: 'object',
            properties: {
              completed_today: {
                type: 'boolean',
                example: false,
                description: 'Whether the habit has been logged for today'
              }
            }
          }
        ]
      },
      HabitLog: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          habit_id: { type: 'integer', example: 1 },
          completed_on: {
            type: 'string',
            format: 'date',
            example: '2026-03-13'
          }
        }
      },
      Streak: {
        type: 'object',
        properties: {
          habitId: { type: 'integer', example: 1 },
          currentStreak: {
            type: 'integer',
            example: 5,
            description: 'Consecutive days ending today or yesterday'
          },
          longestStreak: { type: 'integer', example: 14 },
          totalCompletions: { type: 'integer', example: 42 },
          lastCompletedDate: {
            type: 'string',
            format: 'date',
            nullable: true,
            example: '2026-03-13'
          }
        }
      },
      JournalEntry: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          user_id: { type: 'integer', example: 1 },
          content: { type: 'string', example: 'Today was a productive day...' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 42 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          totalPages: { type: 'integer', example: 3 }
        }
      }
    },
    responses: {
      BadRequest: {
        description: 'Invalid request body or parameters',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      Unauthorized: {
        description: 'Missing or invalid access token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Access token required' }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      TooManyRequests: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'Too many requests, please try again later.'
            }
          }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        operationId: 'healthCheck',
        tags: ['System'],
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    app: { type: 'string', example: 'Noesis' },
                    env: { type: 'string', example: 'development' },
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },

    '/auth/register': {
      post: {
        summary: 'Register a new user',
        operationId: 'register',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  },
                  password: {
                    type: 'string',
                    minLength: 8,
                    example: 'securepass123'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'User registered successfully. A welcome email is sent.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          409: {
            description: 'Email already in use',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { success: false, message: 'Email already in use' }
              }
            }
          },
          429: { $ref: '#/components/responses/TooManyRequests' }
        }
      }
    },

    '/auth/login': {
      post: {
        summary: 'Login and receive tokens',
        operationId: 'login',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  },
                  password: { type: 'string', example: 'securepass123' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful. A login-alert email is sent.',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean', example: true }
                      }
                    },
                    { $ref: '#/components/schemas/Tokens' },
                    {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/UserSummary' }
                      }
                    }
                  ]
                }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { success: false, message: 'Invalid credentials' }
              }
            }
          },
          429: { $ref: '#/components/responses/TooManyRequests' }
        }
      }
    },

    '/auth/refresh': {
      post: {
        summary: 'Rotate refresh token and get a new access token',
        description:
          'The provided refresh token is invalidated and replaced with a new one (token rotation).',
        operationId: 'refresh',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', example: 'a1b2c3...' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'New token pair issued',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean', example: true }
                      }
                    },
                    { $ref: '#/components/schemas/Tokens' }
                  ]
                }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: {
            description: 'Invalid or expired refresh token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          429: { $ref: '#/components/responses/TooManyRequests' }
        }
      }
    },

    '/auth/logout': {
      post: {
        summary: 'Logout and revoke refresh token',
        operationId: 'logout',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', example: 'a1b2c3...' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Logged out successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { success: true, message: 'Logged out successfully' }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          429: { $ref: '#/components/responses/TooManyRequests' }
        }
      }
    },

    '/auth/forgot-password': {
      post: {
        summary: 'Request a password reset email',
        description:
          'Always returns 200 regardless of whether the email is registered, ' +
          'to prevent user enumeration. The reset link is valid for 1 hour.',
        operationId: 'forgotPassword',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Reset email dispatched if the address is registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: {
                  success: true,
                  message: 'If that email is registered, a reset link has been sent.'
                }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          429: { $ref: '#/components/responses/TooManyRequests' }
        }
      }
    },

    '/auth/reset-password': {
      post: {
        summary: 'Reset password using a token',
        description: 'The token is single-use. All active sessions are revoked on success.',
        operationId: 'resetPassword',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: {
                    type: 'string',
                    description: '64-hex-char raw token from the reset email link',
                    example: 'd4e5f6...'
                  },
                  password: {
                    type: 'string',
                    minLength: 8,
                    example: 'newpassword123'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Password updated. All refresh tokens revoked.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: {
                  success: true,
                  message: 'Password updated successfully. Please log in.'
                }
              }
            }
          },
          400: {
            description: 'Invalid / expired / already-used token or weak password',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          429: { $ref: '#/components/responses/TooManyRequests' }
        }
      }
    },

    '/habits': {
      post: {
        summary: 'Create a habit',
        operationId: 'createHabit',
        tags: ['Habits'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: {
                    type: 'string',
                    maxLength: 255,
                    example: 'Morning run'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Habit created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    habit: { $ref: '#/components/schemas/Habit' }
                  }
                }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          429: { $ref: '#/components/responses/TooManyRequests' }
        }
      },
      get: {
        summary: 'List habits',
        description:
          "Returns all habits for the authenticated user with today's completion status.",
        operationId: 'getHabits',
        tags: ['Habits'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Habit list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    habits: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/HabitWithCompletion'
                      }
                    }
                  }
                }
              }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          429: { $ref: '#/components/responses/TooManyRequests' }
        }
      }
    },

    '/habits/{id}': {
      delete: {
        summary: 'Delete a habit',
        operationId: 'deleteHabit',
        tags: ['Habits'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Habit ID'
          }
        ],
        responses: {
          200: {
            description: 'Habit deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { success: true, message: 'Habit deleted' }
              }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          429: { $ref: '#/components/responses/TooManyRequests' }
        }
      }
    },

    '/habits/{id}/complete': {
      post: {
        summary: 'Log a habit completion',
        description: 'Records a completion for the given date (defaults to today). Idempotent.',
        operationId: 'completeHabit',
        tags: ['Habits'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Habit ID'
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  date: {
                    type: 'string',
                    format: 'date',
                    example: '2026-03-13',
                    description: 'Defaults to today if omitted'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Completion logged',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    log: { $ref: '#/components/schemas/HabitLog' }
                  }
                }
              }
            }
          },
          200: {
            description: 'Already completed for this date',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: {
                  success: true,
                  message: 'Already completed for this date'
                }
              }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          429: { $ref: '#/components/responses/TooManyRequests' }
        }
      }
    },

    '/habits/{id}/streak': {
      get: {
        summary: 'Get streak statistics for a habit',
        operationId: 'getHabitStreak',
        tags: ['Streak'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Habit ID'
          }
        ],
        responses: {
          200: {
            description: 'Streak statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    streak: { $ref: '#/components/schemas/Streak' }
                  }
                }
              }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          429: { $ref: '#/components/responses/TooManyRequests' }
        }
      }
    },

    '/journal': {
      post: {
        summary: 'Create a journal entry',
        operationId: 'createJournalEntry',
        tags: ['Journal'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: {
                    type: 'string',
                    example: 'Today was a productive day. I completed my morning run and...'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Entry created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    entry: { $ref: '#/components/schemas/JournalEntry' }
                  }
                }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          429: { $ref: '#/components/responses/TooManyRequests' }
        }
      },
      get: {
        summary: 'List journal entries (paginated)',
        operationId: 'getJournalEntries',
        tags: ['Journal'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: 'Page number'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            description: 'Entries per page'
          }
        ],
        responses: {
          200: {
            description: 'Paginated journal entries',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    entries: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/JournalEntry' }
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' }
                  }
                }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          429: { $ref: '#/components/responses/TooManyRequests' }
        }
      }
    },

    '/journal/{id}': {
      put: {
        summary: 'Update a journal entry',
        operationId: 'updateJournalEntry',
        tags: ['Journal'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Journal entry ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', example: 'Updated reflection...' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Entry updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    entry: { $ref: '#/components/schemas/JournalEntry' }
                  }
                }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          429: { $ref: '#/components/responses/TooManyRequests' }
        }
      },
      delete: {
        summary: 'Delete a journal entry',
        operationId: 'deleteJournalEntry',
        tags: ['Journal'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'Journal entry ID'
          }
        ],
        responses: {
          200: {
            description: 'Entry deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { success: true, message: 'Journal entry deleted' }
              }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          429: { $ref: '#/components/responses/TooManyRequests' }
        }
      }
    }
  }
}

export default spec
