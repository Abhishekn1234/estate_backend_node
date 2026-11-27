# EstateHub Backend

TypeScript REST API for authentication, property listings, images, inquiries, and saved properties. The backend uses Express, PostgreSQL, Prisma ORM, JWT access tokens, rotating HTTP-only refresh-token cookies, Zod validation, Cloudinary, and Swagger/OpenAPI.

## Backend resources

```text
backend/
├── prisma/
│   ├── migrations/
│   │   ├── 20261126074401_init/
│   │   │   └── migration.sql
│   │   ├── 20261126090000_listing_search_indexes/
│   │   │   └── migration.sql
│   │   ├── 20261126182800_user_list_pagination_indexes/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── schema.prisma
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   ├── cloudinary.ts
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── swagger.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── image.controller.ts
│   │   ├── inquiry.controller.ts
│   │   ├── property.controller.ts
│   │   └── savedProperty.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── validate.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── inquiry.routes.ts
│   │   ├── property.routes.ts
│   │   └── savedProperty.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── image.service.ts
│   │   ├── inquiry.service.ts
│   │   ├── property.service.ts
│   │   └── savedProperty.service.ts
│   ├── types/
│   │   └── express.d.ts
│   ├── utils/
│   │   ├── ApiError.ts
│   │   ├── asyncHandler.ts
│   │   ├── imageValidation.ts
│   │   ├── pagination.ts
│   │   ├── response.ts
│   │   └── token.ts
│   └── validators/
│       ├── auth.validator.ts
│       ├── inquiry.validator.ts
│       └── property.validator.ts
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── tsconfig.json
```

### Source responsibilities

- `src/app.ts` configures Express, security and CORS middleware, global rate limiting, routes, Swagger UI, and error handlers.
- `src/server.ts` connects to PostgreSQL, starts the HTTP server, and handles graceful shutdown.
- `src/config/` configures environment values, Prisma, Cloudinary, and the OpenAPI specification.
- `src/routes/` maps HTTP paths to authentication, validation, throttling, and controller handlers.
- `src/controllers/` translates HTTP requests and responses; `src/services/` contains database access and business rules.
- `src/middleware/` provides JWT authentication, request validation, upload processing, and centralized errors.
- `src/validators/` defines Zod request schemas. `src/types/express.d.ts` adds the authenticated user to Express request typing.
- `src/utils/` contains shared errors, async handling, response formatting, cursor encoding, token operations, and image-signature checks.

## Prisma schema and migrations

`prisma/schema.prisma` is the canonical Prisma model definition. It configures the Prisma Client generator and PostgreSQL datasource through `DATABASE_URL`, and defines:

- `User`, `Property`, `PropertyImage`, `Inquiry`, `RefreshToken`, and `SavedProperty` models.
- `UserRole`, `PropertyType`, `ListingType`, and `InquiryStatus` enums.
- Foreign-key relations and cascade behavior for property ownership, images, inquiries, refresh tokens, and saved listings.
- Unique constraints preventing duplicate user emails, buyer/property inquiries, and saved user/property pairs.
- B-tree indexes for common filters, ownership, foreign-key lookups, ordered listings, and cursor-paginated inquiry/saved-property scans.

The committed SQL migration history under `prisma/migrations/` is:

| Migration | Purpose |
|---|---|
| `20261126074401_init/migration.sql` | Creates the enums, six tables, constraints, relations, and initial indexes. |
| `20261126090000_listing_search_indexes/migration.sql` | Installs `pg_trgm`; adds listing-search, price-order, filter, trigram location, and inquiry lookup indexes. |
| `20261126182800_user_list_pagination_indexes/migration.sql` | Replaces earlier inquiry/saved-list indexes with composite descending indexes for cursor pagination. |

`prisma/migrations/migration_lock.toml` records the PostgreSQL migration provider. Apply the committed migrations with `npx prisma migrate deploy`; do not edit an already-applied migration to change a deployed schema. For a schema change, edit `schema.prisma`, create a new development migration with `npx prisma migrate dev --name <description>`, and commit both the schema and generated migration SQL. Regenerate Prisma Client with `npx prisma generate` after schema changes.

The listing search migration requires PostgreSQL's `pg_trgm` extension to be available to the database migration role. The schema indexes support the 50,000+ listing target, but production query plans and latency should be measured against representative data.

## Setup

Requirements: Node.js/npm, PostgreSQL, and Cloudinary credentials for image operations.

1. From the `backend/` directory, install the locked dependencies:

   ```sh
   npm ci
   ```

2. Copy `.env.example` to `.env`. Configure `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`. Set `FRONTEND_URL` to the permitted web origin. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to enable photo upload and deletion. Keep `.env` private and never commit credential values.
3. Generate Prisma Client and deploy migrations:

   ```sh
   npx prisma generate
   npx prisma migrate deploy
   ```

4. Start the development server:

   ```sh
   npm run dev
   ```

The default port is `5000`. `GET /` is the health endpoint, and interactive API documentation is served at `GET /api-docs`.

## API overview

All paths below are mounted under `/api`, except the health and API documentation paths. Authenticated endpoints require an access-token bearer header unless the table specifies a refresh cookie. Property updates, deletion, and image management are restricted to the listing owner or an administrator. Inquiry status updates are restricted to the owner of the property's listing.

| Method | Path | Purpose | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register and issue an access token and refresh cookie | Public |
| `POST` | `/api/auth/login` | Authenticate and issue an access token and refresh cookie | Public |
| `POST` | `/api/auth/refresh` | Rotate refresh cookie and issue a new access token | Refresh cookie |
| `POST` | `/api/auth/logout` | Revoke refresh token | Refresh cookie |
| `GET` | `/api/auth/me` | Return the authenticated user's profile | Bearer token |
| `GET` | `/api/properties` | Search and paginate active listings | Public |
| `GET` | `/api/properties/mine` | List the authenticated user's listings | Bearer token |
| `POST` | `/api/properties` | Create a listing | Bearer token |
| `GET` | `/api/properties/:id` | Get listing details | Public |
| `PUT` | `/api/properties/:id` | Update a listing | Owner or admin |
| `DELETE` | `/api/properties/:id` | Deactivate a listing | Owner or admin |
| `GET` | `/api/properties/:id/similar` | Get similar active listings | Public |
| `POST` | `/api/properties/:id/images` | Upload listing images | Owner or admin |
| `DELETE` | `/api/properties/:id/images/:imageId` | Remove a listing image | Owner or admin |
| `POST` | `/api/inquiries` | Contact a listing owner | Bearer token |
| `GET` | `/api/inquiries/mine` | Cursor-paginated inquiries submitted by the user | Bearer token |
| `GET` | `/api/inquiries/received` | Cursor-paginated inquiries for the user's listings | Bearer token |
| `PATCH` | `/api/inquiries/:inquiryId/status` | Set a received inquiry to `CONTACTED` or `CLOSED` | Listing owner |
| `GET` | `/api/saved-properties` | Cursor-paginated saved listings | Bearer token |
| `GET` | `/api/saved-properties/:propertyId` | Check whether a listing is saved | Bearer token |
| `POST` | `/api/saved-properties/:propertyId` | Save a listing | Bearer token |
| `DELETE` | `/api/saved-properties/:propertyId` | Remove a saved listing | Bearer token |

Property search accepts `city`, `locality`, `location`, `minPrice`, `maxPrice`, `propertyType`, `listingType`, `bedrooms`, `sort`, `limit`, `cursor`, and `page`. Sorting accepts `newest`, `price_asc`, or `price_desc`. Cursor pagination uses the opaque `nextCursor` value returned by the previous response; `cursor` and page-number pagination cannot be combined.

Inquiry status starts as `PENDING`. Only the listing owner can change a received inquiry's status. Duplicate buyer/property inquiries are rejected, and users cannot inquire about their own listings.

## Operational notes

- The API validates request bodies and relevant path/query parameters with Zod. Passwords are hashed; refresh tokens are stored as hashes and issued in HTTP-only cookies.
- Listing search, owner listing, saved-property, and recommendation responses use compact projections; property detail returns the full description and image gallery.
- Similar listings are selected using location, property type, bedroom count, and price proximity.
- Property image files are checked against allowed types and signatures. Uploads are limited to ten images per property, ten files per request, and 5 MiB per file; image assets are stored in Cloudinary.
- Inquiry creation enforces database uniqueness and a persisted limit of five inquiries per user per hour. Express rate-limit middleware also applies process-local limits. Multi-instance deployments should configure a shared rate-limit store.
- API error responses are centralized. Public property responses expose the owner's name, not their private phone number.
- No automated backend test script is defined in `package.json`.

## Available scripts

Run these commands from `backend/`:

| Script | Description |
|---|---|
| `npm run dev` | Run the API with `tsx watch src/server.ts`. |
| `npm run build` | Compile TypeScript to `dist/` using `tsconfig.json`. |
| `npm start` | Run the compiled `dist/server.js`. |
| `npm run db:init` | Generate Prisma Client. |
| `npm run db:migrate` | Create/apply a development migration with Prisma Migrate. |
| `npm run db:studio` | Open Prisma Studio. |
#   e s t a t e _ b a c k e n d _ n o d e  
 