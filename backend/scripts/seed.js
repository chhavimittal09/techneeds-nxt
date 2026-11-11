const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const models = require('../src/models');
const { hashPassword } = require('../src/utils/password');
const { createMentee } = require('../src/services/menteeService');
const { syncBadges } = require('../src/services/badgeService');

const { User, Program, Cohort, Resource, Progress, Attempt, Submission, Activity } = models;

const args = new Set(process.argv.slice(2));
const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const ago = (d) => new Date(now - d * DAY);
const ahead = (d) => new Date(now + d * DAY);

const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@techneeds.local').toLowerCase();
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe-Admin-123';
const demoPassword = process.env.SEED_DEMO_PASSWORD || 'Demo@12345';

async function ensureAdmin() {
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({ name: 'TechNeeds Admin', email: adminEmail, passwordHash: await hashPassword(adminPassword), role: 'admin' });
  }
  return admin;
}

const quizQuestions = {
  js: [
    ['Which keyword declares a block-scoped variable?', ['var', 'let', 'def', 'dim'], 1],
    ['What does Array.prototype.map return?', ['A new array', 'The original array', 'A number', 'undefined'], 0],
    ['Which operator checks value and type equality?', ['==', '=', '===', '!='], 2],
    ['What is the result of typeof null?', ['"null"', '"object"', '"undefined"', '"number"'], 1],
    ['Which method converts JSON text to an object?', ['JSON.stringify', 'JSON.parse', 'JSON.object', 'JSON.load'], 1]
  ],
  data: [
    ['Which structure stores key-value pairs in Python?', ['list', 'tuple', 'dict', 'set'], 2],
    ['Which library is most used for tabular data in Python?', ['pandas', 'flask', 'pytest', 'requests'], 0],
    ['What does the mean describe?', ['The middle value', 'The average value', 'The most frequent value', 'The spread'], 1],
    ['Which chart best shows change over time?', ['Pie chart', 'Line chart', 'Venn diagram', 'Treemap'], 1],
    ['What does NaN usually represent in a dataset?', ['A zero', 'A missing value', 'A string', 'A duplicate'], 1]
  ]
};

const toQuestions = (list) => list.map(([text, options, correctIndex]) => ({ text, options, correctIndex, marks: 2 }));

const learners = [
  {
    name: 'Aarohi Sharma',
    interests: ['Web Development', 'Machine Learning'],
    video: { V1: 12, V2: 1 },
    quiz: { Q1: [11, 100], Q2: [0.5, 90] },
    project: { P1: { at: 5, marks: 92, evalAt: 3, feedback: 'Clean structure and thoughtful responsive behaviour. The accessibility pass on the nav stood out. Next time, add a short README with setup steps.' } }
  },
  {
    name: 'Meera Iyer',
    interests: ['Data Analysis'],
    video: { V1: 10 },
    quiz: { Q1: [7, 80], Q2: [0.8, 100] },
    project: { P1: { at: 1, marks: 70, evalAt: 0.5, feedback: 'Solid core layout. The contact section needs validation and the images are unoptimised. Submitted after the deadline, so plan the last day earlier.' } }
  },
  {
    name: 'Sneha Rao',
    interests: ['Cloud & DevOps'],
    video: { V1: 11, V2: 2 },
    quiz: { Q1: [9, 60], Q2: [1.5, 80] },
    project: { P1: { at: 4, marks: 85, evalAt: 2, feedback: 'Good use of semantic HTML and a consistent type scale. Add hover and focus states to interactive elements.' } }
  },
  {
    name: 'Riya Kapoor',
    interests: [],
    video: { V1: 9 },
    quiz: { Q1: [6, 60] },
    project: { P1: { at: 1.5, marks: null } }
  },
  {
    name: 'Ishita Verma',
    interests: ['Design'],
    video: { V1: 8 },
    quiz: { Q1: [4, 40] },
    project: {}
  },
  { name: 'Tanvi Gupta', interests: [], video: {}, quiz: {}, project: {} }
];

async function seedDemo(admin) {
  const program = await Program.create({
    name: 'Full-Stack Foundations (Demo)',
    description: 'Demo programme seeded for evaluation. Covers JavaScript, web development and data handling.',
    tags: ['web', 'javascript', 'data'],
    createdBy: admin._id
  });

  const cohort = await Cohort.create({
    program: program._id,
    name: 'Demo Cohort 2026',
    startDate: ago(14),
    endDate: ahead(60),
    capacity: 40,
    createdBy: admin._id
  });

  const mentor = await User.create({
    name: 'Demo Mentor',
    email: 'mentor.demo@techneeds.local',
    passwordHash: await hashPassword(demoPassword),
    role: 'mentor',
    createdBy: admin._id
  });
  cohort.mentors.push(mentor._id);
  await cohort.save();

  const base = { program: program._id, cohort: cohort._id, createdBy: mentor._id, published: true };
  const defs = [
    { key: 'V1', type: 'video', title: 'Git and GitHub Essentials', description: 'Branching, commits and pull requests in about twenty minutes.', videoUrl: 'https://www.youtube.com/watch?v=RGOj5yH7evk', durationMinutes: 68, skills: ['Programming'], maxMarks: 10, deadline: ago(9), publishedAt: ago(13) },
    { key: 'Q1', type: 'quiz', title: 'JavaScript Fundamentals Quiz', description: 'Five questions on core language behaviour.', skills: ['Programming', 'Problem Solving'], questions: toQuestions(quizQuestions.js), maxMarks: 10, timeLimitMinutes: 15, deadline: ago(6), publishedAt: ago(12) },
    { key: 'P1', type: 'project', title: 'Personal Portfolio Page', description: 'Build and deploy a responsive one-page portfolio.', instructions: 'Use semantic HTML and CSS only. Include an about section, three projects and a contact form. Deploy it and submit the repository link.', submissionFormat: 'GitHub repository URL with a live demo link in the README', skills: ['Web Development', 'Technical Communication'], maxMarks: 100, deadline: ago(2), publishedAt: ago(11) },
    { key: 'V2', type: 'video', title: 'REST APIs Explained', description: 'How clients and servers talk to each other.', videoUrl: 'https://www.youtube.com/watch?v=lsMQRaeKNDk', durationMinutes: 30, skills: ['Web Development'], maxMarks: 10, deadline: ahead(3), publishedAt: ago(3) },
    { key: 'Q2', type: 'quiz', title: 'Data Handling Quiz', description: 'Basics of working with datasets.', skills: ['Data Analysis', 'Programming'], questions: toQuestions(quizQuestions.data), maxMarks: 10, timeLimitMinutes: 15, deadline: ahead(5), publishedAt: ago(3) },
    { key: 'P2', type: 'project', title: 'Mini Dashboard Project', description: 'Turn a small dataset into a useful dashboard.', instructions: 'Pick any open dataset, clean it and present at least two charts with a short written insight.', submissionFormat: 'Repository URL and a short write-up', skills: ['Web Development', 'Data Analysis'], maxMarks: 100, deadline: ahead(10), publishedAt: ago(2) }
  ];

  const resources = {};
  for (const d of defs) {
    const { key, ...doc } = d;
    resources[key] = await Resource.create({ ...base, ...doc });
  }

  for (let i = 0; i < learners.length; i += 1) {
    const L = learners[i];
    const { mentee } = await createMentee({ cohort, name: L.name, createdBy: mentor._id });
    mentee.passwordHash = await hashPassword(demoPassword);
    mentee.mustChangePassword = false;
    mentee.interests = L.interests;
    await mentee.save();
    await User.updateOne({ _id: mentee._id }, { $set: { createdAt: ago(14) } }, { timestamps: false });
    await Activity.updateOne({ user: mentee._id, kind: 'joined' }, { $set: { at: ago(14) } });

    const common = { mentee: mentee._id, cohort: cohort._id };
    const log = (kind, resource, label, at) => Activity.create({ user: mentee._id, cohort: cohort._id, kind, resource: resource._id, label, at });

    for (const [key, d] of Object.entries(L.video)) {
      const r = resources[key];
      const completedAt = ago(d);
      await Progress.create({ ...common, resource: r._id, startedAt: new Date(completedAt.getTime() - 40 * 60000), completedAt, marks: r.maxMarks });
      await log('video_started', r, r.title, new Date(completedAt.getTime() - 40 * 60000));
      await log('video_completed', r, r.title, completedAt);
    }

    for (const [key, [d, pct]] of Object.entries(L.quiz)) {
      const r = resources[key];
      const correctCount = Math.round((pct / 100) * r.questions.length);
      const answers = r.questions.map((q, qi) => ({
        questionId: String(q._id),
        selectedIndex: qi < correctCount ? q.correctIndex : (q.correctIndex + 1) % q.options.length
      }));
      const score = r.questions.reduce((s, q, qi) => s + (qi < correctCount ? q.marks : 0), 0);
      const submittedAt = ago(d);
      await Attempt.create({ ...common, resource: r._id, startedAt: new Date(submittedAt.getTime() - 9 * 60000), submittedAt, answers, score, maxScore: r.maxMarks, late: submittedAt > r.deadline });
      await log('quiz_attempted', r, `${r.title}: ${score}/${r.maxMarks}`, submittedAt);
    }

    for (const [key, p] of Object.entries(L.project)) {
      const r = resources[key];
      const submittedAt = ago(p.at);
      const doc = {
        ...common,
        resource: r._id,
        link: `https://github.com/demo-${L.name.split(' ')[0].toLowerCase()}/${key.toLowerCase()}-project`,
        notes: 'Demo submission seeded for evaluation.',
        submittedAt,
        late: submittedAt > r.deadline,
        status: 'submitted'
      };
      if (p.marks !== null && p.marks !== undefined) {
        const evaluatedAt = ago(p.evalAt);
        Object.assign(doc, { status: 'evaluated', marks: p.marks, feedback: p.feedback, evaluatedAt, evaluatedBy: mentor._id, history: [{ marks: p.marks, feedback: p.feedback, by: mentor._id, at: evaluatedAt }] });
      }
      await Submission.create(doc);
      await log('project_submitted', r, r.title, submittedAt);
      if (doc.status === 'evaluated') await log('project_evaluated', r, `${r.title}: ${doc.marks}/${r.maxMarks}`, doc.evaluatedAt);
    }

    await syncBadges(mentee._id);
  }

  console.log('Demo data created.');
  console.log(`  Mentor : mentor.demo@techneeds.local / ${demoPassword}`);
  const demoMentees = await User.find({ cohort: cohort._id, role: 'mentee' }).sort({ enrollmentNumber: 1 }).lean();
  demoMentees.forEach((m) => console.log(`  Mentee : ${m.enrollmentNumber} / ${demoPassword}   (${m.name})`));
}

async function main() {
  await connectDB();
  if (args.has('--reset')) {
    for (const model of Object.values(models)) await model.deleteMany({});
    console.log('All collections cleared.');
  }

  const admin = await ensureAdmin();
  console.log(`Admin  : ${adminEmail} / ${adminPassword === 'ChangeMe-Admin-123' ? adminPassword : '(from SEED_ADMIN_PASSWORD)'}`);

  if (!args.has('--admin-only')) {
    const exists = await Program.exists({ name: 'Full-Stack Foundations (Demo)' });
    if (exists) console.log('Demo data already present. Run with --reset to rebuild it.');
    else await seedDemo(admin);
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
