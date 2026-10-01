-- AlterTable
ALTER TABLE "LawyerRequest" ADD COLUMN "closeRequestedBy" TEXT;

-- คำขอปิดเคสที่ค้างอยู่ก่อนมีช่องนี้ — ตอนนั้นมีแต่ทนายที่ขอได้
UPDATE "LawyerRequest" SET "closeRequestedBy" = 'LAWYER' WHERE "closeRequestedAt" IS NOT NULL;
