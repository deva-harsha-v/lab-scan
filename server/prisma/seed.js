const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── HOD ──────────────────────────────────────────────────────────────────
  const hodPassword = await bcrypt.hash('hod123', 10);
  const hod = await prisma.user.upsert({
    where: { email: 'hod@labscan.edu' },
    update: {},
    create: {
      name: 'Prof. Rajan Kumar',
      email: 'hod@labscan.edu',
      passwordHash: hodPassword,
      role: 'HOD',
      department: 'EEE',
      employeeId: 'HOD001',
    },
  });
  console.log('✅ Created HOD:', hod.email);

  // ── Faculty ───────────────────────────────────────────────────────────────
  const facultyPassword = await bcrypt.hash('faculty123', 10);
  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@labscan.edu' },
    update: {},
    create: {
      name: 'Dr. Sarah Johnson',
      email: 'faculty@labscan.edu',
      passwordHash: facultyPassword,
      role: 'FACULTY',
      department: 'EEE',
      employeeId: 'FAC001',
    },
  });
  console.log('✅ Created faculty:', faculty.email);

  // ── Section ───────────────────────────────────────────────────────────────
  let section = await prisma.section.findFirst({ where: { name: 'EEE-A', academicYear: '2025-26' } });
  if (!section) {
    section = await prisma.section.create({
      data: { name: 'EEE-A', department: 'EEE', semester: 3, academicYear: '2025-26' },
    });
  }
  console.log('✅ Created section:', section.name);

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@labscan.edu' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@labscan.edu',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin:', admin.email);
  // ── Student enrolled in section ───────────────────────────────────────────
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@labscan.edu' },
    update: {},
    create: {
      name: 'Alex Kumar',
      email: 'student@labscan.edu',
      passwordHash: studentPassword,
      role: 'STUDENT',
      rollNumber: 'EEE001',
      sectionId: section.id,
    },
  });
  console.log('✅ Created student:', student.email);

  // ── Subject ───────────────────────────────────────────────────────────────
  const subject = await prisma.subject.upsert({
    where: { code: 'EE2301' },
    update: {},
    create: { name: 'Basic Electronics Lab', code: 'EE2301', department: 'EEE', totalSlots: 10 },
  });
  console.log('✅ Created subject:', subject.name);

  // ── Assignment ────────────────────────────────────────────────────────────
  let assignment = await prisma.subjectAssignment.findFirst({
    where: { sectionId: section.id, subjectId: subject.id },
  });
  if (!assignment) {
    assignment = await prisma.subjectAssignment.create({
      data: { sectionId: section.id, subjectId: subject.id, facultyId: faculty.id, hodId: hod.id },
    });
    console.log('✅ Created assignment: EEE-A → Basic Electronics Lab → Dr. Sarah Johnson');
  } else {
    console.log('ℹ️  Assignment already exists');
  }

  // ── Experiment Slots ──────────────────────────────────────────────────────
  const experiments = [
    { slotNumber: 1, title: 'Half Wave Rectifier', description: 'Study characteristics of half wave rectifier', maxMarks: 10 },
    { slotNumber: 2, title: 'Full Wave Rectifier', description: 'Study characteristics of full wave bridge rectifier', maxMarks: 10 },
    { slotNumber: 3, title: 'Zener Diode Characteristics', description: 'Plot V-I characteristics of a Zener diode', maxMarks: 10 },
    { slotNumber: 4, title: 'BJT CE Amplifier', description: 'Determine voltage gain and bandwidth of CE amplifier', maxMarks: 10 },
    { slotNumber: 5, title: 'RC Phase Shift Oscillator', description: 'Design and test RC phase shift oscillator', maxMarks: 10 },
  ];
  for (const exp of experiments) {
    await prisma.experimentSlot.upsert({
      where: { assignmentId_slotNumber: { assignmentId: assignment.id, slotNumber: exp.slotNumber } },
      update: {},
      create: { ...exp, assignmentId: assignment.id },
    });
  }
  console.log(`✅ Created ${experiments.length} experiment slots`);

  // ── Legacy ArUco experiment ───────────────────────────────────────────────
  await prisma.experiment.upsert({
    where: { arucoId: 1 },
    update: {},
    create: {
      title: 'Acid-Base Titration',
      description: 'Determine the concentration of an unknown acid solution using a standard NaOH solution.',
      arucoId: 1,
      createdById: faculty.id,
      contents: {
        create: [
          { type: 'TEXT', content: 'In this experiment, you will perform an acid-base titration...', order: 1, label: 'Introduction' },
          { type: 'STEP', content: '1. Fill burette with 0.1M NaOH.\n2. Pipette 25mL HCl.\n3. Add phenolphthalein.\n4. Titrate to pink endpoint.', order: 2, label: 'Procedure' },
        ],
      },
    },
  });
  console.log('✅ Created legacy ArUco experiment');

  console.log('\n🎉 Seeding complete!\n');
  console.log('📋 Login credentials:');
  console.log('  HOD:     hod@labscan.edu     / hod123');
  console.log('  Faculty: faculty@labscan.edu / faculty123');
  console.log('  Student: student@labscan.edu / student123  (Section: EEE-A)');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
