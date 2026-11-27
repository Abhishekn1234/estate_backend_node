import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Real Estate Listing API",
            version: "1.0.0",
            description: "API documentation for the Real Estate Listing Platform"
        },
        servers: [
            {
                url: "http://localhost:5000",
                description: "Development server"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            },
            schemas: {
                Credentials: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", format: "email" },
                        password: { type: "string", minLength: 8, maxLength: 100 }
                    }
                },
                LoginCredentials: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", format: "email" },
                        password: { type: "string", minLength: 1, maxLength: 100 }
                    }
                },
                Registration: {
                    allOf: [
                        { $ref: "#/components/schemas/Credentials" },
                        {
                            type: "object",
                            required: ["name"],
                            properties: {
                                name: { type: "string", minLength: 2, maxLength: 100 },
                                phone: { type: "string" }
                            }
                        }
                    ]
                },
                PropertyInput: {
                    type: "object",
                    required: [
                        "title",
                        "description",
                        "price",
                        "city",
                        "locality",
                        "propertyType",
                        "listingType",
                        "bedrooms",
                        "bathrooms",
                        "area"
                    ],
                    properties: {
                        title: { type: "string", minLength: 5, maxLength: 150 },
                        description: { type: "string", minLength: 20, maxLength: 10000 },
                        price: { type: "number", minimum: 0, exclusiveMinimum: true },
                        city: { type: "string", minLength: 2, maxLength: 100 },
                        locality: { type: "string", minLength: 2, maxLength: 100 },
                        address: { type: "string", maxLength: 300 },
                        propertyType: {
                            type: "string",
                            enum: ["APARTMENT", "VILLA", "HOUSE", "PLOT", "COMMERCIAL"]
                        },
                        listingType: { type: "string", enum: ["SALE", "RENT"] },
                        bedrooms: { type: "integer", minimum: 0, maximum: 100 },
                        bathrooms: { type: "integer", minimum: 0, maximum: 100 },
                        area: { type: "number", minimum: 0, exclusiveMinimum: true, maximum: 10000000 },
                        furnishing: { type: "string", maxLength: 50 },
                        latitude: { type: "number", minimum: -90, maximum: 90 },
                        longitude: { type: "number", minimum: -180, maximum: 180 }
                    }
                },
                PropertyUpdate: {
                    type: "object",
                    minProperties: 1,
                    properties: {
                        title: { type: "string", minLength: 5, maxLength: 150 },
                        description: { type: "string", minLength: 20, maxLength: 10000 },
                        price: { type: "number", minimum: 0, exclusiveMinimum: true },
                        city: { type: "string", minLength: 2, maxLength: 100 },
                        locality: { type: "string", minLength: 2, maxLength: 100 },
                        address: { type: "string", maxLength: 300 },
                        propertyType: {
                            type: "string",
                            enum: ["APARTMENT", "VILLA", "HOUSE", "PLOT", "COMMERCIAL"]
                        },
                        listingType: { type: "string", enum: ["SALE", "RENT"] },
                        bedrooms: { type: "integer", minimum: 0, maximum: 100 },
                        bathrooms: { type: "integer", minimum: 0, maximum: 100 },
                        area: { type: "number", minimum: 0, exclusiveMinimum: true, maximum: 10000000 },
                        furnishing: { type: "string", maxLength: 50 },
                        latitude: { type: "number", minimum: -90, maximum: 90 },
                        longitude: { type: "number", minimum: -180, maximum: 180 }
                    }
                },
                InquiryInput: {
                    type: "object",
                    required: ["propertyId", "message"],
                    properties: {
                        propertyId: { type: "string", format: "uuid" },
                        message: { type: "string", minLength: 10, maxLength: 1000 }
                    }
                },
                Error: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        message: { type: "string" }
                    }
                }
            }
        },
        tags: [
            { name: "Authentication" },
            { name: "Properties" },
            { name: "Inquiries" },
            { name: "Saved Properties" }
        ],
        paths: {
            "/api/auth/register": {
                post: {
                    tags: ["Authentication"],
                    summary: "Register a new user",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Registration" }
                            }
                        }
                    },
                    responses: {
                        "201": { description: "User registered" },
                        "400": { description: "Invalid registration data" },
                        "409": { description: "Email already registered" }
                    }
                }
            },
            "/api/auth/login": {
                post: {
                    tags: ["Authentication"],
                    summary: "Login and receive an access token",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/LoginCredentials" }
                            }
                        }
                    },
                    responses: {
                        "200": { description: "Login successful; refresh token is an HTTP-only cookie" },
                        "401": { description: "Invalid credentials" },
                        "429": { description: "Too many authentication attempts" }
                    }
                }
            },
            "/api/auth/refresh": {
                post: {
                    tags: ["Authentication"],
                    summary: "Rotate the refresh token and issue a new access token",
                    responses: {
                        "200": { description: "Token refreshed" },
                        "401": { description: "Refresh token missing or invalid" }
                    }
                }
            },
            "/api/auth/logout": {
                post: {
                    tags: ["Authentication"],
                    summary: "Revoke the current refresh token",
                    responses: { "200": { description: "Logged out" } }
                }
            },
            "/api/auth/me": {
                get: {
                    tags: ["Authentication"],
                    summary: "Get the authenticated user profile",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        "200": { description: "User profile" },
                        "401": { description: "Unauthorized" }
                    }
                }
            },
            "/api/properties": {
                get: {
                    tags: ["Properties"],
                    summary: "Search and paginate active listings",
                    parameters: [
                        { name: "city", in: "query", schema: { type: "string" } },
                        { name: "locality", in: "query", schema: { type: "string" } },
                        { name: "location", in: "query", description: "Matches city or locality", schema: { type: "string" } },
                        { name: "minPrice", in: "query", schema: { type: "number", minimum: 0 } },
                        { name: "maxPrice", in: "query", schema: { type: "number", minimum: 0 } },
                        { name: "propertyType", in: "query", schema: { type: "string", enum: ["APARTMENT", "VILLA", "HOUSE", "PLOT", "COMMERCIAL"] } },
                        { name: "listingType", in: "query", schema: { type: "string", enum: ["SALE", "RENT"] } },
                        { name: "bedrooms", in: "query", schema: { type: "integer", minimum: 0 } },
                        { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "price_asc", "price_desc"], default: "newest" } },
                        { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 10 } },
                        { name: "cursor", in: "query", description: "Opaque keyset cursor returned from the previous page", schema: { type: "string" } },
                        { name: "page", in: "query", description: "Offset-based alternative; do not combine with cursor", schema: { type: "integer", minimum: 1, maximum: 1000 } }
                    ],
                    responses: {
                        "200": { description: "Listings and pagination metadata" },
                        "400": { description: "Invalid filters or cursor" }
                    }
                },
                post: {
                    tags: ["Properties"],
                    summary: "Create a property listing",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/PropertyInput" }
                            }
                        }
                    },
                    responses: {
                        "201": { description: "Property created" },
                        "400": { description: "Invalid property data" },
                        "401": { description: "Unauthorized" }
                    }
                }
            },
            "/api/properties/mine": {
                get: {
                    tags: ["Properties"],
                    summary: "Get the authenticated user's listings",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
                        { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 10 } }
                    ],
                    responses: {
                        "200": { description: "Owned listings and pagination metadata" },
                        "401": { description: "Unauthorized" }
                    }
                }
            },
            "/api/properties/{id}": {
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                get: {
                    tags: ["Properties"],
                    summary: "Get property details",
                    responses: {
                        "200": { description: "Property details" },
                        "404": { description: "Property not found" }
                    }
                },
                put: {
                    tags: ["Properties"],
                    summary: "Update an owned listing",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/PropertyUpdate" }
                            }
                        }
                    },
                    responses: {
                        "200": { description: "Property updated" },
                        "403": { description: "Not the owner or administrator" },
                        "404": { description: "Property not found" }
                    }
                },
                delete: {
                    tags: ["Properties"],
                    summary: "Soft-delete an owned listing",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        "200": { description: "Property deactivated" },
                        "403": { description: "Not the owner or administrator" },
                        "404": { description: "Property not found" }
                    }
                }
            },
            "/api/properties/{id}/similar": {
                get: {
                    tags: ["Properties"],
                    summary: "Get similar active listings",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: {
                        "200": { description: "Up to six properties matching city, type, bedrooms, and price range" },
                        "404": { description: "Property not found" }
                    }
                }
            },
            "/api/properties/{id}/images": {
                post: {
                    tags: ["Properties"],
                    summary: "Upload up to ten images for an owned property",
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    requestBody: {
                        required: true,
                        content: {
                            "multipart/form-data": {
                                schema: {
                                    type: "object",
                                    required: ["images"],
                                    properties: {
                                        images: {
                                            type: "array",
                                            maxItems: 10,
                                            items: { type: "string", format: "binary" }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "201": { description: "Images uploaded" },
                        "400": { description: "Invalid image files" },
                        "403": { description: "Not the owner or administrator" },
                        "503": { description: "Image storage is not configured" }
                    }
                }
            },
            "/api/properties/{id}/images/{imageId}": {
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                delete: {
                    tags: ["Properties"],
                    summary: "Delete an image from an owned property",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                        { name: "imageId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
                    ],
                    responses: {
                        "200": { description: "Image deleted" },
                        "403": { description: "Not the owner or administrator" },
                        "404": { description: "Image not found" }
                    }
                }
            },
            "/api/inquiries": {
                post: {
                    tags: ["Inquiries"],
                    summary: "Contact a property owner",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/InquiryInput" }
                            }
                        }
                    },
                    responses: {
                        "201": { description: "Inquiry submitted" },
                        "400": { description: "Invalid or self-directed inquiry" },
                        "409": { description: "Duplicate inquiry" },
                        "429": { description: "Inquiry rate limit exceeded" }
                    }
                }
            },
            "/api/inquiries/mine": {
                get: {
                    tags: ["Inquiries"],
                    summary: "Get inquiries submitted by the current user",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 10 } },
                        { name: "cursor", in: "query", description: "Opaque keyset cursor from the previous page", schema: { type: "string" } }
                    ],
                    responses: { "200": { description: "Submitted inquiries" } }
                }
            },
            "/api/inquiries/received": {
                get: {
                    tags: ["Inquiries"],
                    summary: "Get inquiries received on the current user's properties",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 10 } },
                        { name: "cursor", in: "query", description: "Opaque keyset cursor from the previous page", schema: { type: "string" } }
                    ],
                    responses: { "200": { description: "Received inquiries" } }
                }
            },
            "/api/inquiries/{inquiryId}/status": {
                patch: {
                    tags: ["Inquiries"],
                    summary: "Update the status of an inquiry received on the current user's property",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: "inquiryId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["status"],
                                    properties: {
                                        status: { type: "string", enum: ["CONTACTED", "CLOSED"] }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "200": { description: "Inquiry status updated" },
                        "400": { description: "Invalid status" },
                        "401": { description: "Authentication required" },
                        "404": { description: "Inquiry not found or not owned by the current user" }
                    }
                }
            },
            "/api/saved-properties": {
                get: {
                    tags: ["Saved Properties"],
                    summary: "List saved active properties",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 10 } },
                        { name: "cursor", in: "query", description: "Opaque keyset cursor from the previous page", schema: { type: "string" } }
                    ],
                    responses: { "200": { description: "Saved properties" } }
                }
            },
            "/api/saved-properties/{propertyId}": {
                parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                get: {
                    tags: ["Saved Properties"],
                    summary: "Check whether a property is saved by the current user",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        "200": { description: "Saved status returned" },
                        "401": { description: "Authentication required" }
                    }
                },
                post: {
                    tags: ["Saved Properties"],
                    summary: "Save a property",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        "201": { description: "Property saved" },
                        "409": { description: "Property is already saved" }
                    }
                },
                delete: {
                    tags: ["Saved Properties"],
                    summary: "Remove a saved property",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        "200": { description: "Property removed" },
                        "404": { description: "Saved property not found" }
                    }
                }
            }
        }
    },
    apis: []
};

export const swaggerSpec = swaggerJsdoc(options);
