# 🎬 ProjectFlo Backend API

A comprehensive NestJS backend API for ProjectFlo, providing authentication, CRUD operations, and business logic for wedding videography project management.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment (.env)
DATABASE_URL="postgresql://username:password@localhost:5432/projectflo"
JWT_SECRET="your-secure-jwt-secret"
PORT=3002

# Set up database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start development server
pnpm dev
```

## 🔌 API Access

- **Base URL:** http://localhost:3002
- **API Documentation:** http://localhost:3002/api (Swagger UI)
- **Health Check:** http://localhost:3002/health

## �️ Technology Stack

- **Framework:** NestJS with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with Passport.js
- **API Documentation:** Swagger/OpenAPI
- **Validation:** class-validator and class-transformer

## 📁 Module Structure

```
src/
├── auth/                          # Authentication & Authorization
├── contacts/                      # Contact Management (CRM)
├── contributors/                  # Team Management
├── coverage-scenes/               # Wedding Coverage Types
├── deliverables/                  # Deliverable Types
├── editing-styles/                # Video Editing Styles
├── app.module.ts                  # Main application module
├── main.ts                        # Application bootstrap
└── prisma.service.ts              # Database service
```

## 🔐 Authentication

**Default Credentials:**
```
Email: admin@projectflo.com
Password: admin123
```

**Login Endpoint:**
```bash
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@projectflo.com","password":"admin123"}'
```

## 🔧 Development Commands

```bash
# Development
pnpm dev              # Start with hot reload
pnpm build            # Build for production
pnpm start            # Start production server

# Database
npx prisma studio     # Database GUI
npx prisma generate   # Generate client
npx prisma db push    # Apply schema changes
npx prisma db seed    # Seed database

# Testing
pnpm test             # Unit tests
pnpm test:e2e         # End-to-end tests
```

## 📚 Documentation

**For complete API documentation, setup instructions, and architecture details, see:**

- **[API Design Spec](../../Plan/System%20Architecture/API%20Design%20Spec.md)** - Complete API endpoints and examples
- **[DevOps Guide](../../Plan/System%20Architecture/DevOps%20Guide.md)** - Development setup and deployment
- **[Database Design](../../Plan/Database%20Design.md)** - Database schema and relationships

## 🎯 Key API Modules

- **`/auth`** - Authentication and user management
- **`/contacts`** - Client and vendor contact management
- **`/contributors`** - Team member management
- **`/coverage-scenes`** - Wedding coverage scene types
- **`/deliverables`** - Deliverable type management
- **`/editing-styles`** - Video editing style options

---

**See the main [ProjectFlo README](../../README.md) for complete project information.**

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
