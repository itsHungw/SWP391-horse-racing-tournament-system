-- Migration Script: Create/update blogs table
IF OBJECT_ID('dbo.blogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.blogs (
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
        CONSTRAINT FK_blogs_users FOREIGN KEY (author_id) REFERENCES dbo.users(id)
    );
END;

IF COL_LENGTH('dbo.blogs', 'thumbnail') IS NULL
BEGIN
    ALTER TABLE dbo.blogs ADD thumbnail VARCHAR(255) NULL;
END;

IF COL_LENGTH('dbo.blogs', 'thumbnail_url') IS NOT NULL
   AND COL_LENGTH('dbo.blogs', 'thumbnail') IS NOT NULL
BEGIN
    EXEC('UPDATE dbo.blogs SET thumbnail = COALESCE(thumbnail, thumbnail_url) WHERE thumbnail IS NULL AND thumbnail_url IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_blogs_slug'
      AND object_id = OBJECT_ID('dbo.blogs')
)
BEGIN
    CREATE INDEX IX_blogs_slug ON dbo.blogs(slug);
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_blogs_status'
      AND object_id = OBJECT_ID('dbo.blogs')
)
BEGIN
    CREATE INDEX IX_blogs_status ON dbo.blogs(status);
END;
