IF COL_LENGTH('horse_owner_profiles', 'logo_url') IS NULL
  ALTER TABLE horse_owner_profiles ADD logo_url VARCHAR(500) NULL;
IF COL_LENGTH('horse_owner_profiles', 'stable_name') IS NULL
  ALTER TABLE horse_owner_profiles ADD stable_name VARCHAR(150) NULL;
IF COL_LENGTH('horse_owner_profiles', 'organization_name') IS NULL
  ALTER TABLE horse_owner_profiles ADD organization_name VARCHAR(150) NULL;
IF COL_LENGTH('horse_owner_profiles', 'license_number') IS NULL
  ALTER TABLE horse_owner_profiles ADD license_number VARCHAR(100) NULL;
IF COL_LENGTH('horse_owner_profiles', 'experience_years') IS NULL
  ALTER TABLE horse_owner_profiles ADD experience_years INT NULL;
IF COL_LENGTH('horse_owner_profiles', 'bio') IS NULL
  ALTER TABLE horse_owner_profiles ADD bio VARCHAR(1000) NULL;
IF COL_LENGTH('horse_owner_profiles', 'evidence_url') IS NULL
  ALTER TABLE horse_owner_profiles ADD evidence_url VARCHAR(500) NULL;
IF COL_LENGTH('horse_owner_profiles', 'status') IS NULL
  ALTER TABLE horse_owner_profiles ADD status VARCHAR(30) NULL;
IF COL_LENGTH('horse_owner_profiles', 'rejection_reason') IS NULL
  ALTER TABLE horse_owner_profiles ADD rejection_reason VARCHAR(500) NULL;
IF COL_LENGTH('horse_owner_profiles', 'approved_by') IS NULL
  ALTER TABLE horse_owner_profiles ADD approved_by BIGINT NULL;
IF COL_LENGTH('horse_owner_profiles', 'approved_at') IS NULL
  ALTER TABLE horse_owner_profiles ADD approved_at DATETIME2 NULL;
IF COL_LENGTH('horse_owner_profiles', 'created_at') IS NULL
  ALTER TABLE horse_owner_profiles ADD created_at DATETIME2 NULL;
IF COL_LENGTH('horse_owner_profiles', 'updated_at') IS NULL
  ALTER TABLE horse_owner_profiles ADD updated_at DATETIME2 NULL;
