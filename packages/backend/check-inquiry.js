
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInquiry() {
  const inquiryId = 5;
  try {
    const inquiry = await prisma.inquiries.findUnique({
      where: { id: inquiryId },
      include: {
        contact: true
      }
    });

    if (inquiry) {
      console.log('Inquiry found:', inquiry);
      console.log('Brand ID:', inquiry.contact?.brand_id);
    } else {
      console.log('Inquiry not found');
    }
  } catch (error) {
    console.error('Error fetching inquiry:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInquiry();
