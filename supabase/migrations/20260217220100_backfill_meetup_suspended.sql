UPDATE meetups SET suspended = false WHERE suspended IS NULL;
ALTER TABLE meetups ALTER COLUMN suspended SET NOT NULL;
