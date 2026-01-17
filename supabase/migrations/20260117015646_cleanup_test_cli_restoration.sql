-- Cleanup test migration artifacts
-- Drops the test table created during CLI restoration verification

DROP TABLE IF EXISTS cli_restoration_test;
