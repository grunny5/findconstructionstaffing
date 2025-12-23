# FindConstructionStaffing

[![CI/CD Pipeline](https://github.com/grunny5/findconstructionstaffing/actions/workflows/ci.yml/badge.svg)](https://github.com/grunny5/findconstructionstaffing/actions/workflows/ci.yml)
[![Coverage Status](https://img.shields.io/badge/dynamic/json?color=brightgreen&label=coverage&query=%24.total.lines.pct&suffix=%25&url=https%3A%2F%2Fraw.githubusercontent.com%2Fgrunny5%2Ffindconstructionstaffing%2Fmain%2Fcoverage%2Fcoverage-summary.json)](https://github.com/grunny5/findconstructionstaffing/actions/workflows/ci.yml)

A modern web directory platform connecting construction companies with specialized staffing agencies across North America.

## Project Overview

FindConstructionStaffing is a Next.js-based directory application designed to streamline the process of finding qualified construction staffing partners. The platform serves two primary audiences:

- **Construction Companies**: Looking for reliable staffing agencies to fill skilled labor positions
- **Staffing Agencies**: Seeking to showcase their services and connect with potential clients

## Current State of the Project

### Technology Stack

#### Core Framework

- **Next.js 13.5.1** - Using App Router for modern React development
- **React 18.2.0** - Component-based UI architecture
- **TypeScript 5.2.2** - Type-safe development with strict configuration

#### UI & Styling

- **Tailwind CSS 3.3.3** - Utility-first CSS framework
- **Shadcn/ui** - Comprehensive component library built on Radix UI
- **Lucide React** - Modern icon library
- **CSS Variables** - Dynamic theming support

#### Data & State Management

- **Supabase** - PostgreSQL database (configured, not yet implemented)
- **React Hook Form 7.53.0** - Form state management
- **Zod 3.23.8** - Schema validation

### Current Features

1. **Agency Directory**
   - Display of construction staffing agencies with filtering capabilities
   - Search functionality across agency names, descriptions, trades, and locations
   - Filtering by trades, states, per diem offerings, and union status
   - Sorting options (rating, reviews, projects, establishment date)
   - Featured agency highlighting

2. **Agency Profiles**
   - Individual pages for each agency (currently basic implementation)
   - Dynamic routing using Next.js slug-based routes

3. **Lead Generation Forms**
   - Request labor form for construction companies
   - Claim listing form for agencies

4. **Responsive Design**
   - Mobile-first approach with adaptive layouts
   - Glass morphism effects and modern gradients
   - Professional UI with consistent component styling

5. **Authentication & Authorization** ✅
   - Email/password signup and login with Supabase Auth
   - Role-based access control (user, agency_owner, admin)
   - Admin user management dashboard at `/admin/users`
   - Role change functionality with audit logging
   - Secure database-level permissions (Row Level Security)
   - Server-side route protection
   - Comprehensive test coverage (1145 tests passing)

6. **Agency Claim & Profile Management** ✅
   - Agency claim request workflow with email domain verification
   - Admin claim review and approval dashboard with filtering
   - Profile editing dashboard for agency owners
   - Trade and region management with multi-select UI
   - Profile completion tracking (0-100% scoring)
   - Audit trail for all profile changes
   - Email notifications (confirmation, approval, rejection, completion)
   - Comprehensive test coverage (2,197+ tests passing)

### Project Structure

```
findconstructionstaffing/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Home page with agency directory
│   ├── claim-listing/       # Agency claim form page
│   ├── request-labor/       # Labor request form page
│   └── recruiters/
│       └── [slug]/          # Dynamic agency profile pages
├── components/              # React components
│   ├── ui/                 # Shadcn/ui components (47 total)
│   ├── Header.tsx          # Navigation header
│   ├── Footer.tsx          # Site footer
│   ├── AgencyCard.tsx      # Agency listing card
│   └── DirectoryFilters.tsx # Filter controls
├── lib/                    # Utilities and data
│   ├── mock-data.ts       # Mock agency data
│   ├── supabase.ts        # Database configuration
│   └── utils.ts           # Helper functions
└── hooks/                 # Custom React hooks
```

### Data Architecture

Currently using mock data with plans for Supabase integration:

- **Agencies**: Staffing company profiles with trades, regions, and attributes
- **Trades**: 45+ construction specialties (electrician, welder, etc.)
- **Regions**: All US states for geographical filtering
- **Leads**: Labor requests from construction companies

## Future Development Guidelines

### Architecture Principles

1. **Component-Based Architecture**
   - Maintain separation between business logic and UI components
   - Use Shadcn/ui pattern for consistent, reusable components
   - Implement composition over inheritance

2. **Type Safety**
   - Leverage TypeScript for all new code
   - Define interfaces for all data structures
   - Use Zod for runtime validation

3. **Performance First**
   - Utilize Next.js static generation where possible
   - Implement lazy loading for heavy components
   - Optimize images and assets

4. **Database Integration**
   - Transition from mock data to Supabase
   - Implement Row Level Security (RLS) policies
   - Create proper indexes for search functionality

### Development Standards

#### Code Style

- Use functional components with hooks
- Implement proper error boundaries
- Follow ESLint configuration
- No unnecessary comments in production code

#### Component Guidelines

- All new components should follow existing patterns
- Use Tailwind classes for styling
- Implement responsive design from the start
- Ensure accessibility (ARIA labels, keyboard navigation)

#### State Management

- Use React Hook Form for all forms
- Implement proper loading and error states
- Validate data on both client and server

### Planned Features & Roadmap

#### Phase 1: Core Functionality (Current)

- ✅ Basic directory listing
- ✅ Search and filtering
- ✅ Agency profiles (basic)
- ⏳ Form submissions
- ⏳ Database integration

#### Phase 2: Enhanced Features

- [x] User authentication (core features complete)
  - [x] Email/password signup and login
  - [x] Role-based access control
  - [x] Admin user management UI (Phase 4 complete)
  - [x] Email verification (complete)
  - [x] Password reset flow (complete)
  - [x] Account settings/profile management (complete)
- [x] Agency claim and profile management (Phase 2A complete) ✅
  - [x] Agency claim request workflow
  - [x] Admin claim verification and approval
  - [x] Profile editing dashboard for agency owners
  - [x] Trade and region management
  - [x] Profile completion tracking
  - [x] Audit logging for all changes
- [ ] Advanced agency profiles with portfolios
- [ ] Review and rating system
- [ ] Lead distribution system

#### Phase 3: Advanced Capabilities

- [ ] API for third-party integrations
- [ ] Mobile app development
- [ ] Analytics dashboard
- [ ] Subscription/payment system
- [ ] Automated matching algorithm

### Security Considerations

1. **Authentication & Authorization** ✅
   - ✅ Supabase Auth for user accounts
   - ✅ Role-based access control (user, agency_owner, admin)
   - ✅ Row Level Security (RLS) policies for data protection
   - ✅ Admin-only routes with server-side verification
   - ✅ Role change audit logging for compliance
   - ✅ Secure RPC functions with validation checks
   - ⏳ Email verification (in progress)
   - ⏳ Password reset flow (planned)
   - ⏳ OAuth/social authentication (planned)

2. **Data Protection**
   - Validate all user inputs
   - Implement rate limiting
   - Secure file uploads
   - GDPR compliance for user data

3. **Best Practices**
   - Environment variables for sensitive data
   - HTTPS enforcement
   - Regular security audits
   - Input sanitization

### Performance Optimization

1. **Frontend**
   - Implement React.lazy for code splitting
   - Use next/image for optimized images
   - Minimize bundle size
   - Implement proper caching strategies

2. **Backend**
   - Database query optimization
   - Implement Redis caching layer
   - CDN for static assets
   - API response compression

### Testing Strategy

1. **Unit Testing**
   - Jest for component testing
   - React Testing Library for UI tests
   - Test utilities and helpers

2. **Integration Testing**
   - API endpoint testing
   - Database transaction tests
   - Form submission flows

3. **E2E Testing**
   - Playwright for user journey tests
   - Cross-browser compatibility
   - Mobile responsiveness

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/findconstructionstaffing.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Seed the database (required for development)
npm run seed

# Run development server
npm run dev
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Required for seeding
```

### Development Commands

```bash
# Essential development commands
npm run dev          # Start development server
npm run test         # Run test suite
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
npm run format:check # Check code formatting
npm run format       # Format code with Prettier

# Build and deployment
npm run build        # Build for production
npm run start        # Start production server

# Database seeding commands
npm run seed         # Seed database with mock data
npm run seed:reset   # Clear existing data and re-seed
npm run seed:verify  # Verify seeded data integrity
```

### Database Seeding

The project includes a comprehensive database seeding script for development and testing:

#### Features

- **Idempotent Operations**: Run multiple times without creating duplicates
- **Foreign Key Respect**: Proper deletion order when resetting
- **Progress Tracking**: Clear logging of operations and counts
- **Data Verification**: Built-in verification to ensure data integrity
- **Performance Optimized**: Batch operations for fast seeding

#### Usage

1. **Initial Seeding**

   ```bash
   npm run seed
   ```

   Seeds the database with all mock agency data, trades, and regions.

2. **Reset and Re-seed**

   ```bash
   npm run seed:reset
   ```

   Clears all existing data and performs a fresh seed. Includes a 3-second safety delay.

3. **Verify Data**
   ```bash
   npm run seed:verify
   ```
   Runs verification queries to ensure all data was seeded correctly.

#### Seeded Data

- **12 Agencies**: Complete staffing company profiles
- **48 Trades**: All construction specialties
- **35 Regions**: US states with agencies
- **60 Agency-Trade Relationships**: Specialization mappings
- **58 Agency-Region Relationships**: Service area mappings

## CI/CD

Our project uses GitHub Actions for continuous integration and deployment:

### Continuous Integration

- **Type Checking**: TypeScript compilation with strict mode
- **Linting**: ESLint for code quality
- **Formatting**: Prettier for consistent style
- **Testing**: Jest with 80% coverage requirement
- **Security**: npm audit for vulnerability scanning

### Continuous Deployment

- **Preview Deployments**: Every PR gets a unique preview URL
- **Production Deployments**: Automatic deployment to Vercel on main branch
- **Environment Management**: Separate preview and production environments
- **Rollback Support**: Via Vercel dashboard

All PR checks must pass before merging. Preview deployments available at:

```
https://findconstructionstaffing-pr-{PR_NUMBER}.vercel.app
```

## Deployment

### Vercel Deployment

The project is configured for deployment on Vercel with automatic CI/CD:

1. **Environment Setup**: Configure environment variables in Vercel before deploying
   - See [docs/deployment/vercel-env-setup.md](docs/deployment/vercel-env-setup.md) for detailed instructions
   - Quick setup: `bash scripts/setup-vercel-env.sh`

2. **Automatic Deployments**:
   - **Production**: Merges to `main` branch
   - **Staging**: Pushes to `staging` branch
   - **Preview**: All pull requests

3. **Manual Deployment**:

   ```bash
   vercel --prod  # Deploy to production
   vercel         # Deploy preview
   ```

4. **Required Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for API routes)
   - `MONITORING_API_KEY` - Optional, for metrics endpoint

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

### Automated Checks

Every pull request and push to main/develop branches triggers:

1. **Code Quality Checks**
   - TypeScript compilation verification
   - ESLint code quality rules
   - Prettier formatting check

2. **Test Suite**
   - Unit tests with Jest
   - Coverage report generation
   - Test results uploaded as artifacts

3. **Security Scanning**
   - npm audit for vulnerability detection
   - Production dependency scanning

4. **Build Verification**
   - Next.js production build
   - Build artifacts saved for deployment

### Workflow Status

Check the Actions tab in GitHub to view:

- Pipeline execution history
- Detailed logs for each job
- Test coverage reports
- Build artifacts

## Contributing

1. Follow the established code patterns
2. Write meaningful commit messages
3. Create feature branches for new work
4. Submit pull requests with clear descriptions
5. Ensure all tests pass before submitting
6. Run CI checks locally before pushing:
   ```bash
   npm run lint && npm run type-check && npm run format:check && npm test
   ```
7. CI/CD checks must pass before merging

## License

[Your chosen license]

## Support

For questions or issues, please contact [your contact information]
