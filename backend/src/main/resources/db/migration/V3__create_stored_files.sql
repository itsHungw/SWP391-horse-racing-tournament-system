IF OBJECT_ID(N'dbo.stored_files', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stored_files (
        id bigint IDENTITY(1,1) NOT NULL,
        filename nvarchar(120) NOT NULL,
        object_key nvarchar(500) NOT NULL,
        original_filename nvarchar(255) NOT NULL,
        category nvarchar(50) NOT NULL,
        content_type nvarchar(100) NOT NULL,
        private_file bit NOT NULL,
        file_size bigint NOT NULL,
        uploaded_by bigint NOT NULL,
        created_at datetime2 NOT NULL,
        CONSTRAINT pk_stored_files PRIMARY KEY (id),
        CONSTRAINT uq_stored_files_filename UNIQUE (filename),
        CONSTRAINT uq_stored_files_object_key UNIQUE (object_key),
        CONSTRAINT fk_stored_files_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES dbo.users(id)
    );
END;

IF OBJECT_ID(N'dbo.stored_files', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.stored_files', N'object_key') IS NULL
BEGIN
    ALTER TABLE dbo.stored_files ADD object_key nvarchar(500) NULL;
    EXEC(N'UPDATE dbo.stored_files SET object_key = N''legacy/'' + filename WHERE object_key IS NULL');
    ALTER TABLE dbo.stored_files ALTER COLUMN object_key nvarchar(500) NOT NULL;
END;

IF OBJECT_ID(N'dbo.stored_files', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.stored_files', N'original_filename') IS NULL
BEGIN
    ALTER TABLE dbo.stored_files ADD original_filename nvarchar(255) NULL;
    EXEC(N'UPDATE dbo.stored_files SET original_filename = filename WHERE original_filename IS NULL');
    ALTER TABLE dbo.stored_files ALTER COLUMN original_filename nvarchar(255) NOT NULL;
END;

IF OBJECT_ID(N'dbo.stored_files', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.stored_files', N'file_size') IS NULL
BEGIN
    ALTER TABLE dbo.stored_files ADD file_size bigint NOT NULL
        CONSTRAINT df_stored_files_file_size DEFAULT 0 WITH VALUES;
END;

IF OBJECT_ID(N'dbo.stored_files', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'uq_stored_files_object_key'
         AND object_id = OBJECT_ID(N'dbo.stored_files')
   )
BEGIN
    CREATE UNIQUE INDEX uq_stored_files_object_key ON dbo.stored_files(object_key);
END;
