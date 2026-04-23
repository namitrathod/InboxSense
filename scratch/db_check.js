const { PrismaClient } = require('@prisma/client');
// Adjust path to your generated client
const prisma = new PrismaClient();

async function checkEmails() {
  const emails = await prisma.email.findMany({
    where: {
      subject: {
        contains: 'Personal Wellness Plan'
      }
    },
    select: {
      subject: true,
      body: true
    }
  });

  console.log(`Total Personal Wellness Plan emails found: ${emails.length}`);
  emails.forEach((e, i) => {
    // Look for times in subject or body
    const timeMatch = e.subject.match(/\d+:\d+\s*[ap]m/i) || e.body.match(/\d+:\d+\s*[ap]m/i);
    console.log(`${i+1}: ${e.subject} | Time found: ${timeMatch ? timeMatch[0] : 'None'}`);
  });
  
  await prisma.$disconnect();
}

checkEmails();
