# Requirements Document

## Introduction

This feature implements a comprehensive Content Management System (CMS) for managing educational content with a three-tier hierarchy: Programs → Terms → Lessons. The system includes an admin interface for content management, a public catalog API for consumer applications, automated scheduled publishing via background workers, and multi-language support with media asset management. The solution must be production-ready with proper database design, authentication, role-based access control, and deployment infrastructure.

## Requirements

### Requirement 1

**User Story:** As an admin user, I want to manage the complete content hierarchy (Programs, Terms, Lessons) so that I can organize educational content effectively.

#### Acceptance Criteria

1. WHEN I create a Program THEN the system SHALL enforce required fields (title, language_primary) and validate that language_primary is included in languages_available
2. WHEN I create a Term THEN the system SHALL enforce unique term_number per program and require program_id association
3. WHEN I create a Lesson THEN the system SHALL enforce unique lesson_number per term and require all mandatory fields (title, content_type, duration_ms for videos)
4. WHEN I view the content hierarchy THEN the system SHALL display Programs with their Terms and Lessons in a nested structure
5. WHEN I delete a Program THEN the system SHALL cascade delete all associated Terms and Lessons
6. WHEN I set a Program's status to archived THEN the system SHALL prevent new Terms/Lessons from being added

### Requirement 2

**User Story:** As an editor, I want to manage multi-language content and media assets so that I can provide localized educational experiences.

#### Acceptance Criteria

1. WHEN I add content URLs for a Lesson THEN the system SHALL require at least the primary content language URL
2. WHEN I upload Program posters THEN the system SHALL require portrait and landscape variants for the primary language
3. WHEN I upload Lesson thumbnails THEN the system SHALL require portrait and landscape variants for the primary content language
4. WHEN I add subtitle languages THEN the system SHALL validate that subtitle URLs match the specified languages
5. WHEN I publish a Lesson THEN the system SHALL validate that all required assets exist before allowing publication
6. WHEN I view asset management THEN the system SHALL display preview images for all uploaded assets

### Requirement 3

**User Story:** As an editor, I want to schedule lesson publications so that I can control when content becomes available to users.

#### Acceptance Criteria

1. WHEN I schedule a Lesson for future publication THEN the system SHALL set status to 'scheduled' and require publish_at timestamp
2. WHEN the scheduled time arrives THEN the background worker SHALL automatically publish the lesson and update published_at
3. WHEN a Lesson is published THEN the system SHALL automatically publish its parent Program if not already published
4. WHEN I cancel a scheduled publication THEN the system SHALL allow changing status back to draft
5. WHEN multiple workers run simultaneously THEN the system SHALL prevent duplicate publications using database locks
6. WHEN the worker processes scheduled lessons THEN the system SHALL be idempotent and not modify already-published content

### Requirement 4

**User Story:** As a consumer application developer, I want to access published content via a public API so that I can display educational content to end users.

#### Acceptance Criteria

1. WHEN I request programs via the catalog API THEN the system SHALL return only programs with at least one published lesson
2. WHEN I filter programs by language or topic THEN the system SHALL return matching results with proper pagination
3. WHEN I request program details THEN the system SHALL include all terms with their published lessons and multi-language assets
4. WHEN I request lesson details THEN the system SHALL return complete lesson information including content URLs and subtitles
5. WHEN I make catalog API requests THEN the system SHALL include appropriate cache headers for performance
6. WHEN API errors occur THEN the system SHALL return consistent error format with code, message, and optional details

### Requirement 5

**User Story:** As a system administrator, I want role-based access control so that I can manage user permissions appropriately.

#### Acceptance Criteria

1. WHEN a user logs in THEN the system SHALL authenticate them and establish their role (Admin, Editor, or Viewer)
2. WHEN an Admin accesses the system THEN the system SHALL allow full access including user management
3. WHEN an Editor accesses the system THEN the system SHALL allow content management and publishing but not user management
4. WHEN a Viewer accesses the system THEN the system SHALL provide read-only access to all content
5. WHEN API endpoints are accessed THEN the system SHALL enforce role-based permissions at the backend level
6. WHEN unauthorized access is attempted THEN the system SHALL return appropriate HTTP status codes and error messages

### Requirement 6

**User Story:** As a developer, I want a robust database schema with proper constraints and indexing so that the system performs well and maintains data integrity.

#### Acceptance Criteria

1. WHEN the database is created THEN the system SHALL enforce unique constraints on (program_id, term_number) and (term_id, lesson_number)
2. WHEN lesson status is 'scheduled' THEN the system SHALL enforce that publish_at is NOT NULL via database constraint
3. WHEN lesson status is 'published' THEN the system SHALL enforce that published_at is NOT NULL via database constraint
4. WHEN querying lessons by status and publish_at THEN the system SHALL use database indexes for optimal performance
5. WHEN filtering programs by status, language, and published_at THEN the system SHALL use appropriate indexes
6. WHEN looking up assets THEN the system SHALL use indexes on foreign keys and unique constraints for fast retrieval

### Requirement 7

**User Story:** As a DevOps engineer, I want the system to be deployable and maintainable so that it can run reliably in production.

#### Acceptance Criteria

1. WHEN I run docker compose up --build THEN the system SHALL start all services (web, api, worker, database) locally
2. WHEN the system starts THEN the health endpoint SHALL return OK status and confirm database connectivity
3. WHEN I run migrations THEN the system SHALL create the complete database schema from scratch
4. WHEN I run the seed script THEN the system SHALL create sample data including multi-language content and scheduled lessons
5. WHEN the system logs events THEN the system SHALL use structured logging with correlation IDs
6. WHEN configuration is needed THEN the system SHALL use environment variables without exposing secrets in the repository

### Requirement 8

**User Story:** As a content manager, I want an intuitive web interface so that I can efficiently manage content without technical expertise.

#### Acceptance Criteria

1. WHEN I access the CMS THEN the system SHALL provide a clean, responsive interface with clear navigation
2. WHEN I view the programs list THEN the system SHALL show filters for status, language, and topics with poster previews
3. WHEN I edit a program THEN the system SHALL provide forms for all fields with validation feedback
4. WHEN I manage assets THEN the system SHALL show upload interfaces with preview capabilities for all variants
5. WHEN I edit lessons THEN the system SHALL provide action buttons for Publish Now, Schedule, and Archive with clear status indicators
6. WHEN validation errors occur THEN the system SHALL display clear, actionable error messages
