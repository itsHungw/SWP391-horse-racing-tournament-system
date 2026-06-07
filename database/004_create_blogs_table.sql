-- Migration Script: Create blogs table
CREATE TABLE blogs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    summary NVARCHAR(500) NULL,
    content NVARCHAR(MAX) NOT NULL,
    thumbnail VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL,
    author_id BIGINT NOT NULL,
    CONSTRAINT FK_blogs_users FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX IX_blogs_slug ON blogs(slug);
CREATE INDEX IX_blogs_status ON blogs(status);
