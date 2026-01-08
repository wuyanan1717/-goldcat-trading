-- Allow anonymous role to insert into daily_reports
-- This is needed for the local script (news_factory.js) to write data without a full login session.
CREATE POLICY "Allow public insert"
ON daily_reports
FOR INSERT
TO anon
WITH CHECK (true);

-- Also allow update (upsert)
CREATE POLICY "Allow public update"
ON daily_reports
FOR UPDATE
TO anon
USING (true);
