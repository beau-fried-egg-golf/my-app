-- Allow authenticated users to upload to hole-annotations bucket
create policy "Allow authenticated uploads to hole-annotations"
on storage.objects for insert
to authenticated
with check (bucket_id = 'hole-annotations');

-- Allow authenticated users to update objects in hole-annotations bucket
create policy "Allow authenticated updates to hole-annotations"
on storage.objects for update
to authenticated
using (bucket_id = 'hole-annotations');

-- Allow public read access to hole-annotations bucket
create policy "Allow public read access to hole-annotations"
on storage.objects for select
to public
using (bucket_id = 'hole-annotations');

-- Allow authenticated users to delete from hole-annotations bucket
create policy "Allow authenticated deletes from hole-annotations"
on storage.objects for delete
to authenticated
using (bucket_id = 'hole-annotations');
