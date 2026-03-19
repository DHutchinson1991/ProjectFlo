DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'inquiries_status' AND e.enumlabel = 'Qualified'
    ) THEN
        ALTER TYPE "inquiries_status" ADD VALUE 'Qualified' AFTER 'New';
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'inquiries_status' AND e.enumlabel = 'Discovery_Call'
    ) THEN
        ALTER TYPE "inquiries_status" ADD VALUE 'Discovery_Call' AFTER 'Contacted';
    END IF;
END
$$;
